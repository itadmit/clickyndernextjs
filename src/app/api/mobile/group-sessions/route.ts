/**
 * Mobile Group Sessions API
 * GET /api/mobile/group-sessions - List group sessions
 * POST /api/mobile/group-sessions - Create group session
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
    const serviceId = searchParams.get('serviceId');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const groupSessions = await prisma.groupSession.findMany({
      where: {
        businessId: business.id,
        ...(serviceId && { serviceId }),
        ...(status && { status: status as any }),
        ...(from && { startAt: { gte: new Date(from) } }),
        ...(to && { startAt: { lte: new Date(to) } }),
      },
      include: {
        service: true,
        staff: true,
        branch: true,
        appointments: {
          where: { status: { notIn: ['canceled'] } },
          include: { customer: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return NextResponse.json({ groupSessions });
  } catch (error) {
    console.error('Error fetching group sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const { serviceId, staffId, branchId, startAt: startAtStr, maxParticipants, notes } = await req.json();

    if (!serviceId || !startAtStr || !maxParticipants) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isGroup) {
      return NextResponse.json({ error: 'Service is not a group service' }, { status: 400 });
    }

    const startAt = new Date(startAtStr);
    const endAt = new Date(startAt.getTime() + service.durationMin * 60000);

    const groupSession = await prisma.groupSession.create({
      data: {
        businessId: business.id,
        serviceId,
        staffId: staffId || null,
        branchId: branchId || null,
        startAt,
        endAt,
        maxParticipants,
        notes,
        status: 'open',
      },
      include: { service: true, staff: true, branch: true },
    });

    return NextResponse.json({ groupSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating group session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
