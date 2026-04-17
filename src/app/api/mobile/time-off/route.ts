/**
 * Mobile Time Off API
 * GET  /api/mobile/time-off - List time-off records for the business
 * POST /api/mobile/time-off - Create a new time-off record
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
    const scope = searchParams.get('scope');

    const where: any = { businessId: business.id };
    if (staffId) where.staffId = staffId;
    if (scope) where.scope = scope;

    const timeOffs = await prisma.timeOff.findMany({
      where,
      include: {
        staff: true,
        branch: true,
      },
      orderBy: { startAt: 'desc' },
    });

    return NextResponse.json({ timeOffs });
  } catch (error) {
    console.error('Error fetching mobile time-off:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time-off records' },
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
    const { scope, staffId, branchId, startAt, endAt, reason, type, isRecurring, isAllDay } = body;

    if (!scope || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'scope, startAt, and endAt are required' },
        { status: 400 }
      );
    }

    if (scope === 'staff' && !staffId) {
      return NextResponse.json(
        { error: 'staffId is required when scope is staff' },
        { status: 400 }
      );
    }

    if (scope === 'branch' && !branchId) {
      return NextResponse.json(
        { error: 'branchId is required when scope is branch' },
        { status: 400 }
      );
    }

    let normalizedStartAt = new Date(startAt);
    let normalizedEndAt = new Date(endAt);

    if (isAllDay) {
      normalizedStartAt.setHours(0, 0, 0, 0);
      normalizedEndAt.setHours(23, 59, 59, 999);
    }

    const timeOff = await prisma.timeOff.create({
      data: {
        businessId: business.id,
        scope,
        staffId: staffId ?? null,
        branchId: branchId ?? null,
        startAt: normalizedStartAt,
        endAt: normalizedEndAt,
        reason: reason ?? null,
        type: type ?? 'vacation',
        isRecurring: isRecurring ?? false,
        isAllDay: isAllDay ?? true,
      },
      include: {
        staff: true,
        branch: true,
      },
    });

    return NextResponse.json({ timeOff }, { status: 201 });
  } catch (error) {
    console.error('Error creating mobile time-off:', error);
    return NextResponse.json(
      { error: 'Failed to create time-off record' },
      { status: 500 }
    );
  }
}
