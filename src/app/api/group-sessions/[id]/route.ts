/**
 * Group Session Detail API
 * GET /api/group-sessions/[id] - Get single group session
 * PUT /api/group-sessions/[id] - Update group session
 * DELETE /api/group-sessions/[id] - Cancel group session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    console.error('Error fetching group session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { maxParticipants, staffId, notes, status } = body;

    const existing = await prisma.groupSession.findUnique({
      where: { id: params.id },
      include: { business: true },
    });

    if (!existing || existing.business.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    if (staffId !== undefined) updateData.staffId = staffId;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    if (updateData.maxParticipants && updateData.maxParticipants < existing.currentCount) {
      return NextResponse.json(
        { error: 'Cannot reduce capacity below current participant count' },
        { status: 400 }
      );
    }

    const groupSession = await prisma.groupSession.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ groupSession });
  } catch (error) {
    console.error('Error updating group session:', error);
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

    const existing = await prisma.groupSession.findUnique({
      where: { id: params.id },
      include: { business: true, appointments: { where: { status: { notIn: ['canceled'] } } } },
    });

    if (!existing || existing.business.ownerUserId !== session.user.id) {
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
    console.error('Error canceling group session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
