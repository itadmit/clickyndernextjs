/**
 * Manual loyalty adjust.
 * POST /api/mobile/customers/[id]/loyalty/adjust
 *   body: { type: 'earn' | 'redeem' | 'adjust', points: number (positive), notes?: string }
 *
 * 'earn'    : adds points (also bumps totalEarned)
 * 'redeem'  : subtracts points (cannot go below 0)
 * 'adjust'  : signed manual delta — body.points may be negative (rare; e.g. correction)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { id: customerId } = await params;
  const member = await prisma.loyaltyMember.findUnique({ where: { customerId } });
  if (!member || member.businessId !== business.id) {
    return NextResponse.json({ error: 'Loyalty member not found' }, { status: 404 });
  }

  const { type, points, notes } = await req.json();
  if (!['earn', 'redeem', 'adjust'].includes(type)) {
    return NextResponse.json({ error: 'invalid type' }, { status: 400 });
  }
  if (typeof points !== 'number' || (type !== 'adjust' && points <= 0)) {
    return NextResponse.json({ error: 'points must be positive' }, { status: 400 });
  }

  const delta = type === 'redeem' ? -Math.abs(points) : (type === 'adjust' ? points : Math.abs(points));
  const newBalance = member.points + delta;
  if (newBalance < 0) {
    return NextResponse.json({ error: 'Insufficient points', balance: member.points }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const tr = await tx.loyaltyTransaction.create({
      data: { memberId: member.id, type, points: delta, notes: notes || null },
    });
    const m = await tx.loyaltyMember.update({
      where: { id: member.id },
      data: {
        points: newBalance,
        totalEarned: type === 'earn' ? member.totalEarned + delta : member.totalEarned,
        lastActivityAt: new Date(),
      },
    });
    return { transaction: tr, member: m };
  });

  return NextResponse.json(result);
}
