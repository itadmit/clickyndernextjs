/**
 * Mobile: cancel the active subscription.
 * POST /api/mobile/subscriptions/cancel
 *   Marks the subscription as 'canceled'. The recurring charges stop at the
 *   end of the current billing period. We don't yet call the PayPlus
 *   recurring-cancel API here — manual ops can confirm. (TODO)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const sub = await prisma.subscription.findUnique({ where: { businessId: business.id } });
  if (!sub) return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
  if (sub.status === 'canceled') {
    return NextResponse.json({ error: 'Already canceled' }, { status: 400 });
  }

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'canceled' },
  });

  return NextResponse.json({ subscription: updated });
}
