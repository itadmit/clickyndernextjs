/**
 * Mobile Time Off Detail API
 * PUT    /api/mobile/time-off/:id - Update a time-off record
 * DELETE /api/mobile/time-off/:id - Delete a time-off record
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const existing = await prisma.timeOff.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Time-off record not found' }, { status: 404 });
    }

    const body = await req.json();
    const { scope, staffId, branchId, startAt, endAt, reason, type, isRecurring, isAllDay } = body;

    let normalizedStartAt = startAt ? new Date(startAt) : undefined;
    let normalizedEndAt = endAt ? new Date(endAt) : undefined;

    if (isAllDay && normalizedStartAt) {
      normalizedStartAt.setHours(0, 0, 0, 0);
    }
    if (isAllDay && normalizedEndAt) {
      normalizedEndAt.setHours(23, 59, 59, 999);
    }

    const timeOff = await prisma.timeOff.update({
      where: { id: params.id },
      data: {
        ...(scope !== undefined && { scope }),
        ...(staffId !== undefined && { staffId }),
        ...(branchId !== undefined && { branchId }),
        ...(normalizedStartAt && { startAt: normalizedStartAt }),
        ...(normalizedEndAt && { endAt: normalizedEndAt }),
        ...(reason !== undefined && { reason }),
        ...(type !== undefined && { type }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(isAllDay !== undefined && { isAllDay }),
      },
      include: {
        staff: true,
        branch: true,
      },
    });

    return NextResponse.json({ timeOff });
  } catch (error) {
    console.error('Error updating mobile time-off:', error);
    return NextResponse.json(
      { error: 'Failed to update time-off record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const existing = await prisma.timeOff.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Time-off record not found' }, { status: 404 });
    }

    await prisma.timeOff.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mobile time-off:', error);
    return NextResponse.json(
      { error: 'Failed to delete time-off record' },
      { status: 500 }
    );
  }
}
