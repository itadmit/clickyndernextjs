/**
 * Mobile Payments API
 * POST /api/mobile/payments - Generate sale
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { generateSale } from '@/lib/payme-service';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (!business.paymeSellerPaymeId) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 400 });
    }

    const { appointmentId, buyerKey } = await req.json();

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true },
    });

    if (!appointment || appointment.businessId !== business.id) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    let amountCents = appointment.priceCents || appointment.service.priceCents || 0;
    if (appointment.service.depositOverrideCents) {
      amountCents = appointment.service.depositOverrideCents;
    } else if (business.depositEnabled && business.depositAmountCents) {
      amountCents = business.depositAmountCents;
    }
    if (amountCents < 500) amountCents = 500;

    const baseUrl = process.env.NEXTAUTH_URL || 'https://clickynder.com';

    const result = await generateSale({
      sellerPaymeId: business.paymeSellerPaymeId,
      salePriceCents: amountCents,
      currency: business.currency || 'ILS',
      productName: `${appointment.service.name} - ${business.name}`,
      buyerKey,
      callbackUrl: `${baseUrl}/api/payments/webhook`,
      transactionId: appointmentId,
    });

    if (result.status_code !== 0) {
      return NextResponse.json({ error: 'Payment failed', details: result.status_error_details }, { status: 400 });
    }

    await prisma.payment.create({
      data: {
        businessId: business.id,
        appointmentId,
        provider: 'quickpayments',
        paymeSaleId: result.payme_sale_id,
        amountCents,
        currency: business.currency || 'ILS',
        status: 'initiated',
      },
    });

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: 'pending',
        depositAmountCents: amountCents,
        paymeSaleId: result.payme_sale_id,
        paymentProvider: 'quickpayments',
      },
    });

    return NextResponse.json({ success: true, saleUrl: result.sale_url, paymeSaleId: result.payme_sale_id });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
