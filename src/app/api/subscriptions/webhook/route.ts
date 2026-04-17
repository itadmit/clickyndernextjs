import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PackageCode } from '@prisma/client';
import { createRecurringPayment } from '@/lib/payplus-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('PayPlus webhook received:', JSON.stringify(body, null, 2));

    const transactionStatus = body.transaction?.status_code;
    const isSuccess = transactionStatus === '000';

    if (!isSuccess) {
      console.log('PayPlus payment failed or pending:', transactionStatus);
      return NextResponse.json({ received: true });
    }

    let moreInfo: { businessId?: string; packageCode?: string } = {};
    try {
      moreInfo = JSON.parse(body.more_info || '{}');
    } catch {
      console.error('Failed to parse more_info:', body.more_info);
      return NextResponse.json({ error: 'Invalid more_info' }, { status: 400 });
    }

    const { businessId, packageCode } = moreInfo;
    if (!businessId || !packageCode) {
      console.error('Missing businessId or packageCode in webhook');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validCodes: string[] = Object.values(PackageCode);
    if (!validCodes.includes(packageCode)) {
      console.error('Invalid packageCode in webhook:', packageCode);
      return NextResponse.json({ error: 'Invalid packageCode' }, { status: 400 });
    }

    const pkg = await prisma.package.findUnique({
      where: { code: packageCode as PackageCode },
    });
    if (!pkg) {
      console.error('Package not found:', packageCode);
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const customerUid = body.customer_uid || body.transaction?.customer_uid || '';
    const cardToken = body.token || body.transaction?.token || '';

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    await prisma.subscription.upsert({
      where: { businessId },
      update: {
        packageId: pkg.id,
        status: 'active',
        payplusCustomerUid: customerUid || null,
        payplusCardToken: cardToken || null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      create: {
        businessId,
        packageId: pkg.id,
        status: 'active',
        payplusCustomerUid: customerUid || null,
        payplusCardToken: cardToken || null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    if (customerUid && cardToken) {
      try {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + 30);
        const startDateStr = startDate.toISOString().split('T')[0];

        const recurringResult = await createRecurringPayment({
          customerUid,
          cardToken,
          amount: pkg.priceCents / 100,
          description: `מנוי חודשי Clickinder - ${pkg.name}`,
          startDate: startDateStr,
        });

        if (recurringResult.data?.recurring_payment_uid) {
          await prisma.subscription.update({
            where: { businessId },
            data: {
              payplusRecurringUid: recurringResult.data.recurring_payment_uid,
            },
          });
          console.log('Recurring payment created:', recurringResult.data.recurring_payment_uid);
        }
      } catch (recurringError) {
        console.error('Failed to create recurring payment:', recurringError);
      }
    }

    return NextResponse.json({ received: true, status: 'success' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
