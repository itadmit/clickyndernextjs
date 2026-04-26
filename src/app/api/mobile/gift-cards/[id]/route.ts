/**
 * Mobile Gift Card detail API
 * GET    /api/mobile/gift-cards/[id]
 * PUT    /api/mobile/gift-cards/[id]   - Update notes/expiresAt/recipient details/status
 * DELETE /api/mobile/gift-cards/[id]   - Cancel (soft) — marks status='canceled', preserves audit trail
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
  const card = await prisma.giftCard.findFirst({
    where: { id, businessId: a.business.id },
    include: {
      redemptions: { orderBy: { redeemedAt: 'desc' } },
    },
  });
  if (!card) return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
  return NextResponse.json({ giftCard: card });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const { id } = await params;
  const existing = await prisma.giftCard.findFirst({ where: { id, businessId: a.business.id } });
  if (!existing) return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  for (const f of ['recipientName', 'recipientPhone', 'recipientEmail', 'message', 'notes'] as const) {
    if (f in body) data[f] = body[f] || null;
  }
  if ('expiresAt' in body) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if ('status' in body && ['active', 'redeemed', 'canceled', 'expired'].includes(body.status)) {
    data.status = body.status;
  }

  const card = await prisma.giftCard.update({ where: { id }, data });
  return NextResponse.json({ giftCard: card });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const { id } = await params;
  const existing = await prisma.giftCard.findFirst({ where: { id, businessId: a.business.id } });
  if (!existing) return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });

  // Soft delete via status to preserve redemption history
  const card = await prisma.giftCard.update({ where: { id }, data: { status: 'canceled' } });
  return NextResponse.json({ giftCard: card });
}
