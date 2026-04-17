/**
 * PayMe Webhook (IPN Callback)
 * POST /api/payments/webhook - Receives payment status from PayMe
 * PayMe sends POST x-www-form-urlencoded
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log('PayMe webhook received:', JSON.stringify(data));

    const paymeSaleId = data.payme_sale_id;
    const saleStatus = data.sale_status;
    const transactionId = data.transaction_id;
    const paymeTransactionId = data.payme_transaction_id;

    if (!paymeSaleId) {
      return NextResponse.json({ error: 'Missing sale ID' }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { paymeSaleId },
    });

    if (!payment) {
      console.error('Payment not found for sale:', paymeSaleId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    let newStatus: 'captured' | 'failed' | 'initiated' = 'initiated';
    let appointmentPaymentStatus: 'paid' | 'pending' | 'not_required' = 'pending';

    if (saleStatus === 'completed' || saleStatus === 'success') {
      newStatus = 'captured';
      appointmentPaymentStatus = 'paid';
    } else if (saleStatus === 'failure' || saleStatus === 'failed') {
      newStatus = 'failed';
      appointmentPaymentStatus = 'pending';
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paymeTransactionId: paymeTransactionId || null,
        externalPaymentId: transactionId || null,
      },
    });

    if (payment.appointmentId) {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { paymentStatus: appointmentPaymentStatus },
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing PayMe webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
