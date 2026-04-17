/**
 * Time Off Detail API Routes
 * PUT /api/time-off/[id] - Update time-off
 * DELETE /api/time-off/[id] - Delete time-off
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyBusinessOwnership } from '@/lib/verify-business';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingTimeOff = await prisma.timeOff.findUnique({
      where: { id: params.id },
      select: { businessId: true },
    });

    if (!existingTimeOff) {
      return NextResponse.json({ error: 'Time off not found' }, { status: 404 });
    }

    const ownedPut = await verifyBusinessOwnership(session.user.id, existingTimeOff.businessId);
    if (!ownedPut) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { startAt, endAt, reason, type, isRecurring, isAllDay } = body;

    if (!startAt || !endAt) {
      return NextResponse.json(
        { error: 'startAt and endAt are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startAt);
    const end = new Date(endAt);

    // For all-day events, set full day range
    if (isAllDay !== false) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (start >= end) {
      return NextResponse.json({ error: 'תאריך סיום חייב להיות אחרי תאריך התחלה' }, { status: 400 });
    }

    const updateData: any = {
      startAt: start,
      endAt: end,
      reason: reason || null,
    };

    if (type !== undefined) updateData.type = type;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (isAllDay !== undefined) updateData.isAllDay = isAllDay;

    const timeOff = await prisma.timeOff.update({
      where: { id: params.id },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(timeOff);
  } catch (error) {
    console.error('Error updating time-off:', error);
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

    const existingTimeOffDelete = await prisma.timeOff.findUnique({
      where: { id: params.id },
      select: { businessId: true },
    });

    if (!existingTimeOffDelete) {
      return NextResponse.json({ error: 'Time off not found' }, { status: 404 });
    }

    const ownedDelete = await verifyBusinessOwnership(session.user.id, existingTimeOffDelete.businessId);
    if (!ownedDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.timeOff.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time-off:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
