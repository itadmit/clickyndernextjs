/**
 * Staff Breaks API Routes
 * GET /api/staff-breaks - Get all breaks for a staff member
 * POST /api/staff-breaks - Create a new break
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyBusinessOwnership } from '@/lib/verify-business';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    if (!staffId) {
      return NextResponse.json({ error: 'staffId is required' }, { status: 400 });
    }

    const staff = await prisma.staff.findFirst({
      where: { id: staffId },
      select: { businessId: true },
    });
    if (!staff) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const business = await verifyBusinessOwnership(session.user.id, staff.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const breaks = await prisma.staffBreak.findMany({
      where: { staffId },
      orderBy: [
        { weekday: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json(breaks);
  } catch (error) {
    console.error('Error fetching staff breaks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { staffId, weekday, startTime, endTime, title } = body;

    if (!staffId || weekday === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'staffId, weekday, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findFirst({
      where: { id: staffId },
      select: { businessId: true },
    });
    if (!staff) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const business = await verifyBusinessOwnership(session.user.id, staff.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate weekday
    if (weekday < 0 || weekday > 6) {
      return NextResponse.json({ error: 'weekday must be between 0 and 6' }, { status: 400 });
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json({ error: 'Invalid time format. Use HH:mm' }, { status: 400 });
    }

    // Validate start < end
    if (startTime >= endTime) {
      return NextResponse.json({ error: 'שעת סיום חייבת להיות אחרי שעת התחלה' }, { status: 400 });
    }

    // Check for overlapping breaks on the same day
    const existingBreaks = await prisma.staffBreak.findMany({
      where: {
        staffId,
        weekday,
        active: true,
      },
    });

    const hasOverlap = existingBreaks.some((b) => {
      return startTime < b.endTime && endTime > b.startTime;
    });

    if (hasOverlap) {
      return NextResponse.json(
        { error: 'קיימת הפסקה חופפת ביום זה' },
        { status: 409 }
      );
    }

    const staffBreak = await prisma.staffBreak.create({
      data: {
        staffId,
        weekday,
        startTime,
        endTime,
        title: title || null,
      },
    });

    return NextResponse.json(staffBreak);
  } catch (error) {
    console.error('Error creating staff break:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


