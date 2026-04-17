/**
 * Mobile Staff Breaks API
 * GET  /api/mobile/staff-breaks - List breaks for a staff member
 * POST /api/mobile/staff-breaks - Create a new staff break
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    if (!staffId) {
      return NextResponse.json({ error: 'staffId is required' }, { status: 400 });
    }

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, businessId: business.id },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const breaks = await prisma.staffBreak.findMany({
      where: { staffId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ breaks });
  } catch (error) {
    console.error('Error fetching mobile staff breaks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff breaks' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
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
      where: { id: staffId, businessId: business.id },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    if (weekday < 0 || weekday > 6) {
      return NextResponse.json(
        { error: 'weekday must be between 0 and 6' },
        { status: 400 }
      );
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'startTime and endTime must be in HH:mm format' },
        { status: 400 }
      );
    }

    const staffBreak = await prisma.staffBreak.create({
      data: {
        staffId,
        weekday,
        startTime,
        endTime,
        title: title ?? null,
      },
    });

    return NextResponse.json({ staffBreak }, { status: 201 });
  } catch (error) {
    console.error('Error creating mobile staff break:', error);
    return NextResponse.json(
      { error: 'Failed to create staff break' },
      { status: 500 }
    );
  }
}
