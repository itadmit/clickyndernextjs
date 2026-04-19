import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const status = searchParams.get('status'); // upcoming, past, all
  const now = new Date();

  try {
    const customerIds = await prisma.customer.findMany({
      where: {
        userId: auth.userId,
        ...(businessId ? { businessId } : {}),
      },
      select: { id: true },
    });

    if (customerIds.length === 0) {
      return NextResponse.json({ appointments: [] });
    }

    const statusFilter =
      status === 'past'
        ? { startAt: { lt: now } }
        : status === 'upcoming'
          ? { startAt: { gte: now }, status: { in: ['confirmed' as const, 'pending' as const] } }
          : {};

    const appointments = await prisma.appointment.findMany({
      where: {
        customerId: { in: customerIds.map((c) => c.id) },
        ...statusFilter,
      },
      include: {
        service: { select: { name: true, durationMin: true, priceCents: true, color: true } },
        staff: { select: { name: true } },
        branch: { select: { name: true, address: true } },
        business: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
      orderBy: { startAt: status === 'past' ? 'desc' : 'asc' },
      take: 50,
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Get customer appointments error:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת תורים' }, { status: 500 });
  }
}
