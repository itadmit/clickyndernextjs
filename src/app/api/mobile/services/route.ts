/**
 * Mobile Services API
 * GET  /api/mobile/services - List business services
 * POST /api/mobile/services - Create a service
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

    const services = await prisma.service.findMany({
      where: {
        businessId: business.id,
        deletedAt: null,
        active: true,
      },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMin: s.durationMin,
        priceCents: s.priceCents,
        bufferAfterMin: s.bufferAfterMin,
        color: s.color,
        description: s.description,
        active: s.active,
        categoryId: s.categoryId,
        category: s.category ? { id: s.category.id, name: s.category.name } : null,
        isGroup: s.isGroup,
        maxParticipants: s.maxParticipants,
        minParticipants: s.minParticipants,
        waitlistEnabled: s.waitlistEnabled,
        requirePayment: s.requirePayment,
        depositOverrideCents: s.depositOverrideCents,
      })),
    });
  } catch (error) {
    console.error('Error fetching mobile services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
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
    const {
      name, durationMin, priceCents, bufferAfterMin, description, color, active,
      staffIds, categoryId, isGroup, maxParticipants, minParticipants,
      waitlistEnabled, requirePayment, depositOverrideCents,
    } = body;

    if (!name || durationMin == null) {
      return NextResponse.json({ error: 'name and durationMin are required' }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        businessId: business.id,
        name,
        durationMin,
        priceCents: priceCents ?? null,
        bufferAfterMin: bufferAfterMin ?? 0,
        description: description ?? null,
        color: color ?? null,
        active: active ?? true,
        categoryId: categoryId ?? null,
        isGroup: isGroup ?? false,
        maxParticipants: maxParticipants ?? null,
        minParticipants: minParticipants ?? null,
        waitlistEnabled: waitlistEnabled ?? false,
        requirePayment: requirePayment ?? false,
        depositOverrideCents: depositOverrideCents ?? null,
      },
    });

    if (staffIds && Array.isArray(staffIds) && staffIds.length > 0) {
      await prisma.serviceStaff.createMany({
        data: staffIds.map((staffId: string) => ({
          serviceId: service.id,
          staffId,
        })),
      });
    }

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('POST /api/mobile/services error:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
