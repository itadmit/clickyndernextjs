/**
 * Refund Payment API
 * POST /api/payments/refund
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refundSale } from '@/lib/payme-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, refundAmountCents } = body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { business: true, appointment: true },
    });

    if (!payment || !payment.paymeSaleId) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.business.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!payment.business.paymeSellerPaymeId) {
      return NextResponse.json({ error: 'Payment provider not configured' }, { status: 400 });
    }

    const result = await refundSale({
      sellerPaymeId: payment.business.paymeSellerPaymeId,
      paymeSaleId: payment.paymeSaleId,
      refundAmountCents,
    });

    if (result.status_code !== 0) {
      return NextResponse.json({
        error: 'Refund failed',
        details: result.status_error_details,
      }, { status: 400 });
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'refunded' },
    });

    if (payment.appointmentId) {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { paymentStatus: 'refunded' },
      });
    }

    return NextResponse.json({ success: true, saleStatus: result.sale_status });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
