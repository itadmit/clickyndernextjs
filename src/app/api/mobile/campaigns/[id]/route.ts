/**
 * Campaign detail - read, update, delete.
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
  const campaign = await prisma.campaign.findFirst({
    where: { id, businessId: a.business.id },
    include: {
      recipients: {
        orderBy: { createdAt: 'asc' },
        take: 200,
      },
    },
  });
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  return NextResponse.json({ campaign });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const existing = await prisma.campaign.findFirst({ where: { id, businessId: a.business.id } });
  if (!existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  if (existing.status !== 'draft') {
    return NextResponse.json({ error: 'Cannot edit a campaign that has been sent' }, { status: 400 });
  }
  const body = await req.json();
  const data: any = {};
  for (const f of ['name', 'message', 'channel', 'audienceType', 'audienceParams'] as const) {
    if (f in body) data[f] = body[f];
  }
  const campaign = await prisma.campaign.update({ where: { id }, data });
  return NextResponse.json({ campaign });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const existing = await prisma.campaign.findFirst({ where: { id, businessId: a.business.id } });
  if (!existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
