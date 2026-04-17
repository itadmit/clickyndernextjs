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

    const { id } = params;

    const staff = await prisma.staff.findFirst({
      where: {
        id,
        businessId: business.id,
        deletedAt: null,
      },
      include: {
        branch: true,
        serviceStaff: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('GET /api/mobile/staff/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { id } = params;

    const existing = await prisma.staff.findFirst({
      where: {
        id,
        businessId: business.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      branchId,
      roleLabel,
      calendarColor,
      active,
      serviceIds,
    } = body;

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(branchId !== undefined && { branchId }),
        ...(roleLabel !== undefined && { roleLabel }),
        ...(calendarColor !== undefined && { calendarColor }),
        ...(active !== undefined && { active }),
      },
    });

    if (serviceIds && Array.isArray(serviceIds)) {
      await prisma.serviceStaff.deleteMany({
        where: { staffId: id },
      });

      if (serviceIds.length > 0) {
        await prisma.serviceStaff.createMany({
          data: serviceIds.map((serviceId: string) => ({
            staffId: id,
            serviceId,
          })),
        });
      }
    }

    const updated = await prisma.staff.findUnique({
      where: { id },
      include: {
        branch: true,
        serviceStaff: {
          include: {
            service: true,
          },
        },
      },
    });

    return NextResponse.json({ staff: updated });
  } catch (error) {
    console.error('PUT /api/mobile/staff/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update staff' },
      { status: 500 }
    );
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

    const { id } = params;

    const existing = await prisma.staff.findFirst({
      where: {
        id,
        businessId: business.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    await prisma.staff.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/mobile/staff/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff' },
      { status: 500 }
    );
  }
}
