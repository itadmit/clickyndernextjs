/**
 * Staff Break Detail API Routes
 * PUT /api/staff-breaks/[id] - Update a break
 * DELETE /api/staff-breaks/[id] - Delete a break
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

    const existingBreak = await prisma.staffBreak.findUnique({
      where: { id: params.id },
      include: { staff: { select: { businessId: true } } },
    });

    if (!existingBreak) {
      return NextResponse.json({ error: 'Break not found' }, { status: 404 });
    }

    const ownedPut = await verifyBusinessOwnership(session.user.id, existingBreak.staff.businessId);
    if (!ownedPut) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { weekday, startTime, endTime, title, active } = body;

    // Build update data
    const updateData: any = {};
    
    if (weekday !== undefined) {
      if (weekday < 0 || weekday > 6) {
        return NextResponse.json({ error: 'weekday must be between 0 and 6' }, { status: 400 });
      }
      updateData.weekday = weekday;
    }
    
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (title !== undefined) updateData.title = title || null;
    if (active !== undefined) updateData.active = active;

    // Validate time if both are provided
    const finalStartTime = startTime || existingBreak.startTime;
    const finalEndTime = endTime || existingBreak.endTime;
    
    if (finalStartTime && finalEndTime && finalStartTime >= finalEndTime) {
      return NextResponse.json({ error: 'שעת סיום חייבת להיות אחרי שעת התחלה' }, { status: 400 });
    }

    const staffBreak = await prisma.staffBreak.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(staffBreak);
  } catch (error) {
    console.error('Error updating staff break:', error);
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

    const existingBreakDelete = await prisma.staffBreak.findUnique({
      where: { id: params.id },
      include: { staff: { select: { businessId: true } } },
    });

    if (!existingBreakDelete) {
      return NextResponse.json({ error: 'Break not found' }, { status: 404 });
    }

    const ownedDelete = await verifyBusinessOwnership(session.user.id, existingBreakDelete.staff.businessId);
    if (!ownedDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.staffBreak.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff break:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


