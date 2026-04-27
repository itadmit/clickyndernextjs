/**
 * Mobile: cancel the active subscription.
 * POST /api/mobile/subscriptions/cancel
 *   1. Calls PayPlus RecurringPayments/Cancel to stop the standing order
 *      (if a payplusRecurringUid is stored on the row).
 *   2. Marks the subscription as 'canceled' so the UI reflects it.
 *
 * If the PayPlus call fails we still mark the subscription canceled, but
 * include the failure message in the response so ops can follow up.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { cancelRecurringPayment } from '@/lib/payplus-service';

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

  let payplusError: string | null = null;
  if (sub.payplusRecurringUid) {
    try {
      const r = await cancelRecurringPayment(sub.payplusRecurringUid);
      if (r.results?.status !== 'success') {
        payplusError = r.results?.description || 'PayPlus did not confirm cancel';
      }
    } catch (e) {
      payplusError = (e as Error).message;
      console.error('PayPlus recurring cancel failed:', e);
    }
  }

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'canceled' },
  });

  return NextResponse.json({
    subscription: updated,
    payplus: payplusError ? { canceled: false, error: payplusError } : { canceled: true },
  });
}
