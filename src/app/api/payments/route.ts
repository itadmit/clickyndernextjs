/**
 * Payments API
 * POST /api/payments/generate-sale - Create a payment via PayMe
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSale } from '@/lib/payme-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointmentId, buyerKey, businessId } = body;

    if (!appointmentId || !buyerKey || !businessId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business?.paymeSellerPaymeId) {
      return NextResponse.json({ error: 'Payment not configured for this business' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, customer: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Calculate the amount: deposit or full price
    let amountCents = appointment.priceCents || appointment.service.priceCents || 0;

    if (appointment.service.depositOverrideCents) {
      amountCents = appointment.service.depositOverrideCents;
    } else if (business.depositEnabled && business.depositAmountCents) {
      amountCents = business.depositAmountCents;
    } else if (business.depositEnabled && business.depositPercentage) {
      amountCents = Math.round(amountCents * business.depositPercentage / 100);
    }

    if (amountCents < 500) {
      amountCents = 500; // PayMe minimum is 500 (5.00 ILS)
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://clickynder.com';
    const callbackUrl = `${baseUrl}/api/payments/webhook`;
    const returnUrl = `${baseUrl}/${business.slug}?payment=success`;

    const result = await generateSale({
      sellerPaymeId: business.paymeSellerPaymeId,
      salePriceCents: amountCents,
      currency: business.currency || 'ILS',
      productName: `${appointment.service.name} - ${business.name}`,
      buyerKey,
      callbackUrl,
      returnUrl,
      transactionId: appointmentId,
    });

    if (result.status_code !== 0) {
      return NextResponse.json({
        error: 'Payment creation failed',
        details: result.status_error_details,
      }, { status: 400 });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        businessId,
        appointmentId,
        provider: 'quickpayments',
        paymeSaleId: result.payme_sale_id,
        paymeSaleCode: result.payme_sale_code?.toString(),
        amountCents,
        currency: business.currency || 'ILS',
        status: 'initiated',
      },
    });

    // Update appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: 'pending',
        depositAmountCents: amountCents,
        paymeSaleId: result.payme_sale_id,
        paymentProvider: 'quickpayments',
      },
    });

    return NextResponse.json({
      success: true,
      saleUrl: result.sale_url,
      paymeSaleId: result.payme_sale_id,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Error generating sale:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
