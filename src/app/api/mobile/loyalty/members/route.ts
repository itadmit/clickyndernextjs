/**
 * Loyalty members list — every customer with non-zero or any history.
 * GET /api/mobile/loyalty/members?sort=points|name|recent
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get('sort') || 'points';
  const orderBy = sort === 'name'
    ? { customer: { firstName: 'asc' as const } }
    : sort === 'recent'
      ? { lastActivityAt: 'desc' as const }
      : { points: 'desc' as const };

  const members = await prisma.loyaltyMember.findMany({
    where: { businessId: business.id },
    include: { customer: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    orderBy,
  });

  const totalPoints = members.reduce((s, m) => s + m.points, 0);
  const totalEarned = members.reduce((s, m) => s + m.totalEarned, 0);

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      points: m.points,
      totalEarned: m.totalEarned,
      joinedAt: m.joinedAt,
      lastActivityAt: m.lastActivityAt,
      customer: m.customer,
    })),
    stats: { count: members.length, totalPoints, totalEarned },
  });
}
