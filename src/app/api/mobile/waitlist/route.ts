/**
 * Mobile Waitlist API
 * GET /api/mobile/waitlist - List entries
 * POST /api/mobile/waitlist - Join waitlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('serviceId');
    const status = searchParams.get('status');

    const entries = await prisma.waitlistEntry.findMany({
      where: {
        businessId: business.id,
        ...(serviceId && { serviceId }),
        ...(status && { status: status as any }),
      },
      include: { customer: true, service: true },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const { serviceId, staffId, branchId, customerId, preferredDate, preferredTimeRange } = body;

    if (!serviceId || !customerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lastEntry = await prisma.waitlistEntry.findFirst({
      where: { businessId: business.id, serviceId, status: 'waiting' },
      orderBy: { position: 'desc' },
    });

    const entry = await prisma.waitlistEntry.create({
      data: {
        businessId: business.id,
        serviceId,
        staffId: staffId || null,
        branchId: branchId || null,
        customerId,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTimeRange,
        status: 'waiting',
        position: (lastEntry?.position || 0) + 1,
      },
      include: { customer: true, service: true },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
