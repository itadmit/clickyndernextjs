/**
 * Mobile Service Package detail API
 * GET    /api/mobile/packages/[id] - Get a single package
 * PUT    /api/mobile/packages/[id] - Update a package
 * DELETE /api/mobile/packages/[id] - Soft delete (set active=false) or hard delete if no purchases
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

  const { id } = await params;
  const pkg = await prisma.servicePackage.findFirst({
    where: { id, businessId: a.business.id },
    include: { service: { select: { id: true, name: true } } },
  });
  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  return NextResponse.json({ package: pkg });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const { id } = await params;
  const existing = await prisma.servicePackage.findFirst({ where: { id, businessId: a.business.id } });
  if (!existing) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  for (const f of ['name', 'description', 'totalSessions', 'priceCents', 'validityDays', 'serviceId', 'active'] as const) {
    if (f in body) data[f] = body[f];
  }

  if (data.serviceId) {
    const svc = await prisma.service.findFirst({ where: { id: data.serviceId, businessId: a.business.id } });
    if (!svc) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const pkg = await prisma.servicePackage.update({ where: { id }, data });
  return NextResponse.json({ package: pkg });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const { id } = await params;
  const existing = await prisma.servicePackage.findFirst({
    where: { id, businessId: a.business.id },
    include: { _count: { select: { customerPackages: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

  // Soft delete (set active=false) if customers have purchased it; hard delete otherwise
  if (existing._count.customerPackages > 0) {
    const pkg = await prisma.servicePackage.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ package: pkg, softDeleted: true });
  }

  await prisma.servicePackage.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
