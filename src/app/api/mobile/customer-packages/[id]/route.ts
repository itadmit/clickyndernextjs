/**
 * Mobile Customer Package detail API
 * GET    /api/mobile/customer-packages/[id] - Detail
 * PUT    /api/mobile/customer-packages/[id] - Update notes / cancel / extend
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
  const cp = await prisma.customerPackage.findFirst({
    where: { id, businessId: a.business.id },
    include: {
      package: true,
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      appointments: {
        select: { id: true, startAt: true, endAt: true, status: true, service: { select: { name: true } } },
        orderBy: { startAt: 'desc' },
      },
    },
  });
  if (!cp) return NextResponse.json({ error: 'Customer package not found' }, { status: 404 });
  return NextResponse.json({ customerPackage: cp });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const { id } = await params;
  const existing = await prisma.customerPackage.findFirst({ where: { id, businessId: a.business.id } });
  if (!existing) return NextResponse.json({ error: 'Customer package not found' }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if ('notes' in body) data.notes = body.notes;
  if ('status' in body && ['active', 'used', 'expired', 'canceled'].includes(body.status)) {
    data.status = body.status;
  }
  if ('expiresAt' in body) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  const cp = await prisma.customerPackage.update({ where: { id }, data });
  return NextResponse.json({ customerPackage: cp });
}
