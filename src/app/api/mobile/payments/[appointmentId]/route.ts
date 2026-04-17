/**
 * Mobile Payment Status
 * GET /api/mobile/payments/[appointmentId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: { appointmentId: params.appointmentId },
      orderBy: { createdAt: 'desc' },
    });

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      select: { paymentStatus: true, depositAmountCents: true },
    });

    return NextResponse.json({
      payments,
      appointmentPaymentStatus: appointment?.paymentStatus,
      depositAmountCents: appointment?.depositAmountCents,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
