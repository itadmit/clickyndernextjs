/**
 * Customer-side "what do I have" endpoint.
 * GET /api/mobile/customer/perks?businessId=<id>
 *   Returns the loyalty points + active packages the authenticated customer
 *   has at this specific business. Used by the customer landing screen.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId נדרש' }, { status: 400 });

  const customer = await prisma.customer.findFirst({
    where: { userId: auth.userId, businessId },
  });
  if (!customer) return NextResponse.json({ error: 'אין גישה לעסק זה' }, { status: 403 });

  const [loyaltyMember, loyaltyProgram, customerPackages] = await Promise.all([
    prisma.loyaltyMember.findUnique({ where: { customerId: customer.id } }),
    prisma.loyaltyProgram.findUnique({ where: { businessId } }),
    prisma.customerPackage.findMany({
      where: { customerId: customer.id, businessId, status: 'active' },
      include: { package: { select: { name: true, serviceId: true } } },
      orderBy: { purchasedAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    loyalty: loyaltyProgram?.enabled
      ? {
          enabled: true,
          name: loyaltyProgram.name,
          points: loyaltyMember?.points ?? 0,
          totalEarned: loyaltyMember?.totalEarned ?? 0,
          pointsPerRedemption: loyaltyProgram.pointsPerRedemption,
          redemptionValueCents: loyaltyProgram.redemptionValueCents,
        }
      : { enabled: false },
    packages: customerPackages.map((cp) => ({
      id: cp.id,
      name: cp.package.name,
      serviceId: cp.package.serviceId,
      sessionsRemaining: cp.sessionsRemaining,
      totalSessions: cp.totalSessions,
      expiresAt: cp.expiresAt,
    })),
  });
}
