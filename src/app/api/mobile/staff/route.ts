/**
 * Mobile Staff API
 * GET  /api/mobile/staff - List business staff
 * POST /api/mobile/staff - Create staff member
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

    const staff = await prisma.staff.findMany({
      where: {
        businessId: business.id,
        deletedAt: null,
        active: true,
      },
      include: {
        branch: true,
        serviceStaff: {
          include: { service: { select: { id: true, name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      staff: staff.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        roleLabel: s.roleLabel,
        calendarColor: s.calendarColor,
        active: s.active,
        branch: s.branch ? { id: s.branch.id, name: s.branch.name } : null,
        serviceStaff: s.serviceStaff.map((ss) => ({ service: ss.service })),
      })),
    });
  } catch (error) {
    console.error('Error fetching mobile staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
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
    const { name, email, phone, branchId, roleLabel, calendarColor, active, serviceIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const staff = await prisma.staff.create({
      data: {
        businessId: business.id,
        name,
        email: email ?? null,
        phone: phone ?? null,
        branchId: branchId ?? null,
        roleLabel: roleLabel ?? null,
        calendarColor: calendarColor ?? null,
        active: active ?? true,
      },
    });

    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      await prisma.serviceStaff.createMany({
        data: serviceIds.map((serviceId: string) => ({
          serviceId,
          staffId: staff.id,
        })),
      });
    }

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    console.error('POST /api/mobile/staff error:', error);
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 });
  }
}
