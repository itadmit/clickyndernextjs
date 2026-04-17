/**
 * Group Sessions API Routes
 * GET /api/group-sessions - List group sessions
 * POST /api/group-sessions - Create group session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createGroupSessionSchema = z.object({
  businessId: z.string(),
  serviceId: z.string(),
  staffId: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
  startAt: z.string(),
  maxParticipants: z.number().min(2),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerUserId: session.user.id },
    });

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = createGroupSessionSchema.parse(body);

    const business = await prisma.business.findFirst({
      where: { ownerUserId: session.user.id, id: data.businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service || !service.isGroup) {
      return NextResponse.json({ error: 'Service is not a group service' }, { status: 400 });
    }

    const startAt = new Date(data.startAt);
    const endAt = new Date(startAt.getTime() + service.durationMin * 60000);

    const groupSession = await prisma.groupSession.create({
      data: {
        businessId: data.businessId,
        serviceId: data.serviceId,
        staffId: data.staffId || null,
        branchId: data.branchId || null,
        startAt,
        endAt,
        maxParticipants: data.maxParticipants,
        notes: data.notes,
        status: 'open',
      },
      include: {
        service: true,
        staff: true,
        branch: true,
      },
    });

    return NextResponse.json({ groupSession }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating group session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
