/**
 * Mobile: list available subscription packages.
 * GET /api/mobile/subscriptions/packages
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });

  const packages = await prisma.package.findMany({
    orderBy: { priceCents: 'asc' },
  });

  return NextResponse.json({
    packages: packages.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      priceCents: p.priceCents,
      maxStaff: p.maxStaff,
      maxBranches: p.maxBranches,
      monthlyAppointmentsCap: p.monthlyAppointmentsCap,
      features: Array.isArray(p.featuresJson) ? (p.featuresJson as string[]) : [],
    })),
  });
}
