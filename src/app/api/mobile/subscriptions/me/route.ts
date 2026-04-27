/**
 * Mobile: read current subscription state for the authenticated business.
 * GET /api/mobile/subscriptions/me - subscription, package, usage stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const subscription = await prisma.subscription.findUnique({
    where: { businessId: business.id },
    include: { package: true },
  });

  // Aggregate usage
  const [staffCount, branchesCount, servicesCount, monthAppointments] = await Promise.all([
    prisma.staff.count({ where: { businessId: business.id, active: true } }),
    prisma.branch.count({ where: { businessId: business.id, active: true, deletedAt: null } }),
    prisma.service.count({ where: { businessId: business.id, active: true, deletedAt: null } }),
    (async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return prisma.appointment.count({
        where: { businessId: business.id, startAt: { gte: start, lt: end }, status: { notIn: ['canceled'] } },
      });
    })(),
  ]);

  return NextResponse.json({
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          provider: subscription.provider,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          packageCode: subscription.package.code,
          packageName: subscription.package.name,
          priceCents: subscription.package.priceCents,
        }
      : null,
    usage: {
      staff: { current: staffCount, max: subscription?.package.maxStaff ?? 1 },
      branches: { current: branchesCount, max: subscription?.package.maxBranches ?? 1 },
      services: { current: servicesCount, max: 100 },
      monthAppointments: {
        current: monthAppointments,
        max: subscription?.package.monthlyAppointmentsCap ?? 50,
      },
    },
  });
}
