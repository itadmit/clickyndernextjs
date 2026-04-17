/**
 * Recurring Series API
 * GET /api/recurring - List recurring series
 * POST /api/recurring - Create recurring series (generates all appointments)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateConfirmationCode, addMinutes } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const series = await prisma.recurringSeries.findMany({
      where: { businessId: business.id },
      include: {
        appointments: {
          orderBy: { startAt: 'asc' },
          include: { customer: true, service: true, staff: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      serviceId, staffId, customerId, branchId,
      startDate, startTime, intervalDays, count,
    } = body;

    if (!serviceId || !customerId || !startDate || !startTime || !intervalDays || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const recurrenceRule = `FREQ=${intervalDays === 7 ? 'WEEKLY' : 'DAILY'};INTERVAL=${intervalDays === 7 ? 1 : intervalDays};COUNT=${count}`;

    const series = await prisma.recurringSeries.create({
      data: {
        businessId: business.id,
        serviceId,
        staffId: staffId || null,
        customerId,
        recurrenceRule,
        startDate: new Date(startDate),
        endDate: null,
        status: 'active',
      },
    });

    // Generate individual appointments
    const appointments = [];
    const [hours, minutes] = startTime.split(':').map(Number);

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * intervalDays);
      date.setHours(hours, minutes, 0, 0);

      const endAt = addMinutes(date, service.durationMin + (service.bufferAfterMin || 0));
      const confirmationCode = generateConfirmationCode();

      appointments.push({
        businessId: business.id,
        branchId: branchId || null,
        serviceId,
        staffId: staffId || null,
        customerId,
        recurringSeriesId: series.id,
        startAt: date,
        endAt,
        status: 'confirmed' as const,
        priceCents: service.priceCents,
        paymentStatus: 'not_required' as const,
        confirmationCode,
        source: 'admin' as const,
      });
    }

    await prisma.appointment.createMany({ data: appointments });

    const createdSeries = await prisma.recurringSeries.findUnique({
      where: { id: series.id },
      include: {
        appointments: { orderBy: { startAt: 'asc' }, include: { customer: true } },
      },
    });

    return NextResponse.json({ series: createdSeries }, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring series:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
