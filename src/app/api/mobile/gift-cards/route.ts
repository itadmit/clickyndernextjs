/**
 * Mobile Gift Cards API
 * GET  /api/mobile/gift-cards          - List gift cards (filter by status, search by code)
 * POST /api/mobile/gift-cards          - Issue a new gift card (auto-generate code unless provided)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

function generateCode(): string {
  // Human-readable, 12 chars, no ambiguous I/O/0/1
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (i === 3 || i === 7) out += '-';
  }
  return out;
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const cards = await prisma.giftCard.findMany({
    where: {
      businessId: business.id,
      ...(status && ['active', 'redeemed', 'canceled', 'expired'].includes(status)
        ? { status: status as any }
        : {}),
      ...(search ? { code: { contains: search.toUpperCase() } } : {}),
    },
    orderBy: { purchasedAt: 'desc' },
  });

  return NextResponse.json({
    giftCards: cards.map((g) => ({
      id: g.id,
      code: g.code,
      initialCents: g.initialCents,
      balanceCents: g.balanceCents,
      status: g.status,
      recipientName: g.recipientName,
      recipientPhone: g.recipientPhone,
      recipientEmail: g.recipientEmail,
      message: g.message,
      expiresAt: g.expiresAt,
      purchasedAt: g.purchasedAt,
      redeemedAt: g.redeemedAt,
      notes: g.notes,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const body = await req.json();
  const {
    code,
    initialCents,
    recipientName,
    recipientPhone,
    recipientEmail,
    message,
    expiresAt,
    validityDays,
    notes,
  } = body;

  if (!initialCents || initialCents <= 0) {
    return NextResponse.json({ error: 'initialCents must be positive' }, { status: 400 });
  }

  let finalCode = (code || generateCode()).toUpperCase();
  // ensure unique — retry up to 4 times if collision
  for (let i = 0; i < 4; i++) {
    const exists = await prisma.giftCard.findUnique({ where: { code: finalCode } });
    if (!exists) break;
    finalCode = generateCode();
  }

  const expires = expiresAt
    ? new Date(expiresAt)
    : validityDays
      ? new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000)
      : null;

  const card = await prisma.giftCard.create({
    data: {
      businessId: business.id,
      code: finalCode,
      initialCents,
      balanceCents: initialCents,
      recipientName: recipientName || null,
      recipientPhone: recipientPhone || null,
      recipientEmail: recipientEmail || null,
      message: message || null,
      expiresAt: expires,
      notes: notes || null,
    },
  });

  return NextResponse.json({ giftCard: card }, { status: 201 });
}
