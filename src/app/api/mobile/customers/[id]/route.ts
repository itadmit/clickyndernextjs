/**
 * Mobile Customer Detail API
 * GET    /api/mobile/customers/:id - Get customer details with appointments
 * PATCH  /api/mobile/customers/:id - Update customer
 * DELETE /api/mobile/customers/:id - Delete customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
      include: {
        appointments: {
          orderBy: { startAt: 'desc' },
          take: 50,
          include: {
            service: {
              select: {
                id: true,
                name: true,
                priceCents: true,
                color: true,
              },
            },
            staff: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      createdAt: customer.createdAt,
      _count: customer._count,
      appointments: customer.appointments.map((appt) => ({
        id: appt.id,
        startAt: appt.startAt,
        endAt: appt.endAt,
        status: appt.status,
        service: appt.service
          ? {
              id: appt.service.id,
              name: appt.service.name,
              priceCents: appt.service.priceCents,
              color: appt.service.color,
            }
          : null,
        staff: appt.staff
          ? {
              id: appt.staff.id,
              name: appt.staff.name,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching mobile customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const existing = await prisma.customer.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const body = await req.json();
    const { firstName, lastName, phone, email, notes } = body;

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      email: updated.email,
      notes: updated.notes,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error('Error updating mobile customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const existing = await prisma.customer.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mobile customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
