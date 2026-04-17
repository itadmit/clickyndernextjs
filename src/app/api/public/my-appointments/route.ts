/**
 * Client Portal - My Appointments (public)
 * GET /api/public/my-appointments?businessId=X&phone=Y
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const phone = searchParams.get('phone');

    if (!businessId || !phone) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { businessId, phone },
    });

    if (!customer) {
      return NextResponse.json({ appointments: [] });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        customerId: customer.id,
        startAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: {
        service: { select: { name: true, durationMin: true } },
        staff: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: { startAt: 'desc' },
      take: 50,
    });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        cancellationPolicyEnabled: true,
        cancellationDeadlineHours: true,
      },
    });

    return NextResponse.json({
      appointments: appointments.map((a) => ({
        id: a.id,
        serviceName: a.service.name,
        staffName: a.staff?.name,
        branchName: a.branch?.name,
        startAt: a.startAt,
        endAt: a.endAt,
        status: a.status,
        confirmationCode: a.confirmationCode,
        paymentStatus: a.paymentStatus,
        canCancel: a.status === 'confirmed' && a.startAt > new Date(),
        cancellationDeadline: business?.cancellationPolicyEnabled
          ? new Date(a.startAt.getTime() - (business.cancellationDeadlineHours || 24) * 60 * 60 * 1000)
          : null,
      })),
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
