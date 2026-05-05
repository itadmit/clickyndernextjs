/**
 * Customer-facing Waitlist API (mobile).
 *
 * POST /api/mobile/customer/waitlist
 *   Authenticated as a customer (via mobile JWT). Looks up the customer
 *   record at the requested business and creates a waitlist entry on
 *   their behalf. Mirrors the manager-side flow at
 *   /api/mobile/waitlist but scoped to the calling user.
 *
 * GET  /api/mobile/customer/waitlist
 *   Returns the calling customer's own waitlist entries (optionally
 *   filtered by businessId).
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { businessId, serviceId, staffId, branchId, preferredDate, preferredTimeRange } = body;

    if (!businessId || !serviceId) {
      return NextResponse.json({ error: 'businessId, serviceId נדרשים' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { userId: auth.userId, businessId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'לא רשום כלקוח של עסק זה' }, { status: 403 });
    }

    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        businessId,
        serviceId,
        customerId: customer.id,
        status: 'waiting',
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'כבר נמצא ברשימת ההמתנה לשירות זה', entry: existing },
        { status: 409 }
      );
    }

    const lastEntry = await prisma.waitlistEntry.findFirst({
      where: { businessId, serviceId, status: 'waiting' },
      orderBy: { position: 'desc' },
    });

    const entry = await prisma.waitlistEntry.create({
      data: {
        businessId,
        serviceId,
        staffId: staffId || null,
        branchId: branchId || null,
        customerId: customer.id,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTimeRange: preferredTimeRange || null,
        status: 'waiting',
        position: (lastEntry?.position || 0) + 1,
      },
      include: { customer: true, service: true },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Customer waitlist error:', error);
    return NextResponse.json({ error: 'שגיאה בהצטרפות לרשימת המתנה' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;

    const customers = await prisma.customer.findMany({
      where: { userId: auth.userId, ...(businessId && { businessId }) },
      select: { id: true },
    });

    if (customers.length === 0) {
      return NextResponse.json({ entries: [] });
    }

    const entries = await prisma.waitlistEntry.findMany({
      where: { customerId: { in: customers.map((c) => c.id) } },
      include: { service: true, business: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Customer waitlist list error:', error);
    return NextResponse.json({ error: 'שגיאה בשליפת רשימת המתנה' }, { status: 500 });
  }
}
