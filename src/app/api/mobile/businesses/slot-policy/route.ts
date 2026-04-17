/**
 * Mobile Slot Policy API
 * GET /api/mobile/businesses/slot-policy - Get slot policy for the business
 * PUT /api/mobile/businesses/slot-policy - Create or update slot policy
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

    const slotPolicy = await prisma.slotPolicy.findUnique({
      where: { businessId: business.id },
    });

    return NextResponse.json({ slotPolicy: slotPolicy ?? null });
  } catch (error) {
    console.error('Error fetching mobile slot policy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slot policy' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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
    const {
      defaultDurationMin,
      defaultGapMin,
      advanceWindowDays,
      sameDayBooking,
      minimumAdvanceBookingHours,
      roundingStrategy,
    } = body;

    const slotPolicy = await prisma.slotPolicy.upsert({
      where: { businessId: business.id },
      update: {
        ...(defaultDurationMin !== undefined && { defaultDurationMin }),
        ...(defaultGapMin !== undefined && { defaultGapMin }),
        ...(advanceWindowDays !== undefined && { advanceWindowDays }),
        ...(sameDayBooking !== undefined && { sameDayBooking }),
        ...(minimumAdvanceBookingHours !== undefined && { minimumAdvanceBookingHours }),
        ...(roundingStrategy !== undefined && { roundingStrategy }),
      },
      create: {
        businessId: business.id,
        defaultDurationMin: defaultDurationMin ?? 30,
        defaultGapMin: defaultGapMin ?? 0,
        advanceWindowDays: advanceWindowDays ?? 30,
        sameDayBooking: sameDayBooking ?? true,
        minimumAdvanceBookingHours: minimumAdvanceBookingHours ?? 2,
        roundingStrategy: roundingStrategy ?? 'continuous',
      },
    });

    return NextResponse.json({ slotPolicy });
  } catch (error) {
    console.error('Error updating mobile slot policy:', error);
    return NextResponse.json(
      { error: 'Failed to update slot policy' },
      { status: 500 }
    );
  }
}
