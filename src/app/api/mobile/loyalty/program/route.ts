/**
 * Loyalty program config (single per business).
 * GET /api/mobile/loyalty/program - returns the program (creates default disabled one on first call)
 * PUT /api/mobile/loyalty/program - update config
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

async function getOrCreateProgram(businessId: string) {
  const existing = await prisma.loyaltyProgram.findUnique({ where: { businessId } });
  if (existing) return existing;
  return prisma.loyaltyProgram.create({ data: { businessId } });
}

export async function GET(req: NextRequest) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const program = await getOrCreateProgram(a.business.id);
  return NextResponse.json({ program });
}

export async function PUT(req: NextRequest) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const program = await getOrCreateProgram(a.business.id);

  const body = await req.json();
  const data: any = {};
  for (const f of [
    'enabled', 'name',
    'spendPerPointCents', 'pointsPerRedemption', 'redemptionValueCents',
    'welcomeBonusPoints', 'expiryMonths', 'termsHe',
  ] as const) {
    if (f in body) data[f] = body[f];
  }
  const updated = await prisma.loyaltyProgram.update({ where: { id: program.id }, data });
  return NextResponse.json({ program: updated });
}
