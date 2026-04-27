/**
 * Mobile: subscription payment history.
 * GET /api/mobile/subscriptions/payments
 *   Returns the most recent 50 payments belonging to the business.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const payments = await prisma.payment.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    payments: payments.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      createdAt: p.createdAt,
      receiptUrl: p.receiptUrl,
    })),
  });
}
