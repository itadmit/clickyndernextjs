/**
 * Mobile Customer Packages API
 * GET  /api/mobile/customers/[id]/packages - List packages purchased by a customer
 * POST /api/mobile/customers/[id]/packages - Sell a package to a customer (creates CustomerPackage)
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const { id: customerId } = await params;
  const customer = await prisma.customer.findFirst({ where: { id: customerId, businessId: a.business.id } });
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // 'active' to filter

  const purchases = await prisma.customerPackage.findMany({
    where: {
      businessId: a.business.id,
      customerId,
      ...(status === 'active' ? { status: 'active' } : {}),
    },
    include: {
      package: { select: { id: true, name: true, serviceId: true, service: { select: { id: true, name: true } } } },
    },
    orderBy: { purchasedAt: 'desc' },
  });

  return NextResponse.json({
    customerPackages: purchases.map((p) => ({
      id: p.id,
      packageId: p.packageId,
      packageName: p.package.name,
      serviceId: p.package.serviceId,
      serviceName: p.package.service?.name ?? null,
      sessionsRemaining: p.sessionsRemaining,
      totalSessions: p.totalSessions,
      priceCents: p.priceCents,
      status: p.status,
      expiresAt: p.expiresAt,
      purchasedAt: p.purchasedAt,
      paymentTransactionId: p.paymentTransactionId,
      notes: p.notes,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const { id: customerId } = await params;
  const customer = await prisma.customer.findFirst({ where: { id: customerId, businessId: a.business.id } });
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const { packageId, paymentTransactionId, notes } = await req.json();
  if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 });

  const pkg = await prisma.servicePackage.findFirst({ where: { id: packageId, businessId: a.business.id } });
  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

  const expiresAt = pkg.validityDays
    ? new Date(Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000)
    : null;

  const customerPackage = await prisma.customerPackage.create({
    data: {
      businessId: a.business.id,
      customerId,
      packageId: pkg.id,
      sessionsRemaining: pkg.totalSessions,
      totalSessions: pkg.totalSessions,
      priceCents: pkg.priceCents,
      expiresAt,
      paymentTransactionId: paymentTransactionId ?? null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json({ customerPackage }, { status: 201 });
}
