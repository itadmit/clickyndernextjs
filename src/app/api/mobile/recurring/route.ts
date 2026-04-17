/**
 * Mobile Recurring Series API
 * GET /api/mobile/recurring
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

    const series = await prisma.recurringSeries.findMany({
      where: { businessId: business.id },
      include: {
        appointments: {
          orderBy: { startAt: 'asc' },
          include: { customer: true, service: true, staff: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
