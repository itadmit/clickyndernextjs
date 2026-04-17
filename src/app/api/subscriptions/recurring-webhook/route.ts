import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('PayPlus recurring webhook received:', JSON.stringify(body, null, 2));

    const recurringUid = body.recurring_payment_uid || body.data?.recurring_payment_uid;
    const isSuccess = body.transaction?.status_code === '000' || body.status === 'success';

    if (!recurringUid) {
      console.error('Missing recurring_payment_uid in recurring webhook');
      return NextResponse.json({ error: 'Missing recurring_payment_uid' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { payplusRecurringUid: recurringUid },
    });

    if (!subscription) {
      console.error('Subscription not found for recurring UID:', recurringUid);
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (isSuccess) {
      const newPeriodEnd = new Date();
      newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: newPeriodEnd,
        },
      });

      console.log('Subscription renewed for business:', subscription.businessId);
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'past_due' },
      });

      console.log('Subscription payment failed for business:', subscription.businessId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Recurring webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
