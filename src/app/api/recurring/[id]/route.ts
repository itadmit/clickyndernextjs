/**
 * Recurring Series Detail
 * GET /api/recurring/[id]
 * DELETE /api/recurring/[id] - Cancel series and all future appointments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const series = await prisma.recurringSeries.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          orderBy: { startAt: 'asc' },
          include: { customer: true, service: true, staff: true },
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const series = await prisma.recurringSeries.findUnique({
      where: { id: params.id },
      include: { business: true },
    });

    if (!series || series.business.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Cancel all future appointments in the series
    const now = new Date();
    await prisma.appointment.updateMany({
      where: {
        recurringSeriesId: params.id,
        startAt: { gt: now },
        status: { notIn: ['canceled', 'completed'] },
      },
      data: {
        status: 'canceled',
        canceledAt: now,
      },
    });

    await prisma.recurringSeries.update({
      where: { id: params.id },
      data: { status: 'canceled' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
