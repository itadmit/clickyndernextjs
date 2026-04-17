/**
 * Mobile Business Hours API
 * GET /api/mobile/businesses/hours - Get business hours
 * PUT /api/mobile/businesses/hours - Update business hours
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

    const hours = await prisma.businessHours.findMany({
      where: { businessId: business.id },
      orderBy: { weekday: 'asc' },
    });

    return NextResponse.json({ hours });
  } catch (error) {
    console.error('Error fetching mobile business hours:', error);
    return NextResponse.json({ error: 'Failed to fetch hours' }, { status: 500 });
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

    const { hours } = await req.json();

    if (!Array.isArray(hours)) {
      return NextResponse.json({ error: 'Invalid hours data' }, { status: 400 });
    }

    await prisma.businessHours.deleteMany({
      where: { businessId: business.id },
    });

    await prisma.businessHours.createMany({
      data: hours.map((hour: any) => ({
        businessId: business.id,
        weekday: hour.weekday,
        openTime: hour.active ? hour.openTime : null,
        closeTime: hour.active ? hour.closeTime : null,
        active: hour.active,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating mobile business hours:', error);
    return NextResponse.json({ error: 'Failed to update hours' }, { status: 500 });
  }
}
