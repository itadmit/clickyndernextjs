/**
 * Mobile Staff Break Detail API
 * PUT    /api/mobile/staff-breaks/:id - Update a staff break
 * DELETE /api/mobile/staff-breaks/:id - Delete a staff break
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

    const existing = await prisma.staffBreak.findUnique({
      where: { id: params.id },
      include: { staff: true },
    });

    if (!existing || existing.staff.businessId !== business.id) {
      return NextResponse.json({ error: 'Staff break not found' }, { status: 404 });
    }

    const body = await req.json();
    const { weekday, startTime, endTime, title, active } = body;

    if (weekday !== undefined && (weekday < 0 || weekday > 6)) {
      return NextResponse.json(
        { error: 'weekday must be between 0 and 6' },
        { status: 400 }
      );
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (startTime && !timeRegex.test(startTime)) {
      return NextResponse.json(
        { error: 'startTime must be in HH:mm format' },
        { status: 400 }
      );
    }
    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'endTime must be in HH:mm format' },
        { status: 400 }
      );
    }

    const staffBreak = await prisma.staffBreak.update({
      where: { id: params.id },
      data: {
        ...(weekday !== undefined && { weekday }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(title !== undefined && { title }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json({ staffBreak });
  } catch (error) {
    console.error('Error updating mobile staff break:', error);
    return NextResponse.json(
      { error: 'Failed to update staff break' },
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

    const existing = await prisma.staffBreak.findUnique({
      where: { id: params.id },
      include: { staff: true },
    });

    if (!existing || existing.staff.businessId !== business.id) {
      return NextResponse.json({ error: 'Staff break not found' }, { status: 404 });
    }

    await prisma.staffBreak.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mobile staff break:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff break' },
      { status: 500 }
    );
  }
}
