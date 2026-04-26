/**
 * Mobile Service Packages API
 * GET  /api/mobile/packages - List packages defined by the business
 * POST /api/mobile/packages - Create a new service package
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const packages = await prisma.servicePackage.findMany({
      where: {
        businessId: business.id,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      packages: packages.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        totalSessions: p.totalSessions,
        priceCents: p.priceCents,
        validityDays: p.validityDays,
        active: p.active,
        serviceId: p.serviceId,
        service: p.service ? { id: p.service.id, name: p.service.name } : null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err) {
    console.error('Error fetching packages:', err);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const { name, description, totalSessions, priceCents, validityDays, serviceId, active } = await req.json();

    if (!name || !totalSessions || priceCents == null) {
      return NextResponse.json({ error: 'name, totalSessions, priceCents are required' }, { status: 400 });
    }

    if (serviceId) {
      const svc = await prisma.service.findFirst({ where: { id: serviceId, businessId: business.id } });
      if (!svc) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const pkg = await prisma.servicePackage.create({
      data: {
        businessId: business.id,
        serviceId: serviceId || null,
        name,
        description: description ?? null,
        totalSessions,
        priceCents,
        validityDays: validityDays ?? null,
        active: active ?? true,
      },
    });

    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (err) {
    console.error('Error creating package:', err);
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
}
