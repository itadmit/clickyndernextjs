/**
 * Mobile Gift Card redemption
 * POST /api/mobile/gift-cards/redeem
 *   body: { code, amountCents, appointmentId?, notes? }
 *
 * Looks up the gift card by code (case-insensitive), validates status/expiry/balance,
 * deducts the amount, records a redemption row, and marks the card as 'redeemed' when
 * the balance hits zero.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { code, amountCents, appointmentId, notes } = await req.json();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });
  if (!amountCents || amountCents <= 0) {
    return NextResponse.json({ error: 'amountCents must be positive' }, { status: 400 });
  }

  const card = await prisma.giftCard.findFirst({
    where: { businessId: business.id, code: String(code).toUpperCase() },
  });
  if (!card) return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
  if (card.status === 'canceled') return NextResponse.json({ error: 'Gift card canceled' }, { status: 400 });
  if (card.expiresAt && card.expiresAt < new Date()) {
    await prisma.giftCard.update({ where: { id: card.id }, data: { status: 'expired' } });
    return NextResponse.json({ error: 'Gift card expired' }, { status: 400 });
  }
  if (card.balanceCents < amountCents) {
    return NextResponse.json(
      { error: 'Insufficient balance', balanceCents: card.balanceCents },
      { status: 400 },
    );
  }

  const newBalance = card.balanceCents - amountCents;
  const result = await prisma.$transaction(async (tx) => {
    const redemption = await tx.giftCardRedemption.create({
      data: {
        giftCardId: card.id,
        amountCents,
        appointmentId: appointmentId || null,
        notes: notes || null,
      },
    });
    const updated = await tx.giftCard.update({
      where: { id: card.id },
      data: {
        balanceCents: newBalance,
        ...(newBalance === 0
          ? { status: 'redeemed' as const, redeemedAt: new Date() }
          : {}),
      },
    });
    return { redemption, giftCard: updated };
  });

  return NextResponse.json(result);
}
