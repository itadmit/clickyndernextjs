/**
 * Staff Detail API Routes
 * GET /api/staff/[id] - Get staff
 * PUT /api/staff/[id] - Update staff
 * PATCH /api/staff/[id] - Partial update
 * DELETE /api/staff/[id] - Delete staff
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyBusinessOwnership } from '@/lib/verify-business';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
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

    const business = await verifyBusinessOwnership(session.user.id, staff.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const existingStaff = await prisma.staff.findUnique({
      where: { id: params.id },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const business = await verifyBusinessOwnership(session.user.id, existingStaff.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update staff
    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        branchId: body.branchId,
        roleLabel: body.roleLabel,
        calendarColor: body.calendarColor,
        calendarProvider: body.calendarProvider,
        active: body.active,
      },
    });

    // Update service assignments
    if (body.serviceIds) {
      // Delete existing assignments
      await prisma.serviceStaff.deleteMany({
        where: { staffId: params.id },
      });

      // Create new assignments
      if (body.serviceIds.length > 0) {
        await prisma.serviceStaff.createMany({
          data: body.serviceIds.map((serviceId: string) => ({
            serviceId,
            staffId: params.id,
          })),
        });
      }
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const existingStaff = await prisma.staff.findUnique({
      where: { id: params.id },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const business = await verifyBusinessOwnership(session.user.id, existingStaff.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { id: params.id },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const business = await verifyBusinessOwnership(session.user.id, existingStaff.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await prisma.staff.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

