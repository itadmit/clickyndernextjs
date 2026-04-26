/**
 * Loyalty for a specific customer.
 * GET  /api/mobile/customers/[id]/loyalty   - member info + transaction history
 * POST /api/mobile/customers/[id]/loyalty/adjust  - manual add/remove/redeem points (manager)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

async function authBusiness(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return { error: auth.error, status: 401 } as const;
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return { error: 'Business not found', status: 404 } as const;
  return { business } as const;
}

async function ensureMember(businessId: string, customerId: string) {
  let member = await prisma.loyaltyMember.findUnique({ where: { customerId } });
  if (member && member.businessId === businessId) return member;
  if (member && member.businessId !== businessId) {
    // unique-on-customerId means a customer belongs to one business; should match.
    return null;
  }
  // Need a program to bind a member to.
  let program = await prisma.loyaltyProgram.findUnique({ where: { businessId } });
  if (!program) program = await prisma.loyaltyProgram.create({ data: { businessId } });

  // Welcome bonus (if configured) on first join.
  member = await prisma.loyaltyMember.create({
    data: {
      programId: program.id,
      businessId,
      customerId,
      points: program.welcomeBonusPoints,
      totalEarned: program.welcomeBonusPoints,
    },
  });
  if (program.welcomeBonusPoints > 0) {
    await prisma.loyaltyTransaction.create({
      data: { memberId: member.id, type: 'welcome', points: program.welcomeBonusPoints, notes: 'בונוס הצטרפות' },
    });
  }
  return member;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const { id: customerId } = await params;
  const customer = await prisma.customer.findFirst({ where: { id: customerId, businessId: a.business.id } });
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const member = await ensureMember(a.business.id, customerId);
  if (!member) return NextResponse.json({ error: 'Loyalty member not found' }, { status: 404 });

  const transactions = await prisma.loyaltyTransaction.findMany({
    where: { memberId: member.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const program = await prisma.loyaltyProgram.findUnique({ where: { businessId: a.business.id } });

  return NextResponse.json({
    member: {
      id: member.id,
      points: member.points,
      totalEarned: member.totalEarned,
      joinedAt: member.joinedAt,
    },
    program,
    transactions,
  });
}
