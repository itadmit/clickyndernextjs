/**
 * Waitlist Entry API
 * PATCH /api/waitlist/[id] - Update status
 * DELETE /api/waitlist/[id] - Remove from waitlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    const entry = await prisma.waitlistEntry.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'offered' && { offeredAt: new Date(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
      },
      include: { customer: true, service: true },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error updating waitlist entry:', error);
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

    await prisma.waitlistEntry.update({
      where: { id: params.id },
      data: { status: 'canceled' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from waitlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
