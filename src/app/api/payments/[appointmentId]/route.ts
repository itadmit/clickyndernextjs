/**
 * Payment Status API
 * GET /api/payments/[appointmentId] - Get payment status for an appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const payments = await prisma.payment.findMany({
      where: { appointmentId: params.appointmentId },
      orderBy: { createdAt: 'desc' },
    });

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      select: { paymentStatus: true, depositAmountCents: true, paymeSaleId: true },
    });

    return NextResponse.json({
      payments,
      appointmentPaymentStatus: appointment?.paymentStatus,
      depositAmountCents: appointment?.depositAmountCents,
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
