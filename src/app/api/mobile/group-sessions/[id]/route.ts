/**
 * Mobile Group Session Detail API
 * GET /api/mobile/group-sessions/[id]
 * PUT /api/mobile/group-sessions/[id]
 * DELETE /api/mobile/group-sessions/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const groupSession = await prisma.groupSession.findUnique({
      where: { id: params.id },
      include: {
        service: true,
        staff: true,
        branch: true,
        appointments: {
          where: { status: { notIn: ['canceled'] } },
          include: { customer: true },
        },
      },
    });

    if (!groupSession) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ groupSession });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const body = await req.json();
    const { maxParticipants, staffId, notes, status } = body;

    const existing = await prisma.groupSession.findUnique({ where: { id: params.id } });
    if (!existing || existing.businessId !== business.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    if (staffId !== undefined) updateData.staffId = staffId;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const groupSession = await prisma.groupSession.update({
      where: { id: params.id },
      data: updateData,
      include: { service: true, staff: true, branch: true },
    });

    return NextResponse.json({ groupSession });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const existing = await prisma.groupSession.findUnique({
      where: { id: params.id },
      include: { appointments: { where: { status: { notIn: ['canceled'] } } } },
    });

    if (!existing || existing.businessId !== business.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.$transaction([
      ...existing.appointments.map((apt) =>
        prisma.appointment.update({
          where: { id: apt.id },
          data: { status: 'canceled', canceledAt: new Date() },
        })
      ),
      prisma.groupSession.update({
        where: { id: params.id },
        data: { status: 'canceled' },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
