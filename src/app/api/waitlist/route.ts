/**
 * Waitlist API
 * POST /api/waitlist - Join waitlist (public)
 * GET /api/waitlist - List waitlist entries (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, serviceId, staffId, branchId, customerName, customerPhone, customerEmail, preferredDate, preferredTimeRange } = body;

    if (!businessId || !serviceId || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.waitlistEnabled) {
      return NextResponse.json({ error: 'Waitlist not available for this service' }, { status: 400 });
    }

    let customer = await prisma.customer.findFirst({
      where: { businessId, phone: customerPhone },
    });

    if (!customer) {
      const [firstName, ...lastNameParts] = customerName.split(' ');
      customer = await prisma.customer.create({
        data: {
          businessId,
          firstName,
          lastName: lastNameParts.join(' ') || firstName,
          phone: customerPhone,
          email: customerEmail,
        },
      });
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
        preferredTimeRange,
        status: 'waiting',
        position: (lastEntry?.position || 0) + 1,
      },
      include: { customer: true, service: true },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Error joining waitlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerUserId: session.user.id },
    });

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
      include: {
        customer: true,
        service: true,
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
