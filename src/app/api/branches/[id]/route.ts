/**
 * Branch Detail API Routes
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

    const branch = await prisma.branch.findUnique({
      where: { id: params.id },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const business = await verifyBusinessOwnership(session.user.id, branch.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
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

    // Get the branch to find its businessId
    const existingBranch = await prisma.branch.findUnique({
      where: { id: params.id },
      select: { businessId: true },
    });

    if (!existingBranch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const business = await verifyBusinessOwnership(session.user.id, existingBranch.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If this is set as default, unset all other defaults
    if (body.isDefault) {
      await prisma.branch.updateMany({
        where: {
          businessId: existingBranch.businessId,
          deletedAt: null,
          id: { not: params.id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const branch = await prisma.branch.update({
      where: { id: params.id },
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        hasCustomHours: body.hasCustomHours,
        active: body.active,
        isDefault: body.isDefault,
      },
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
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

    const existingBranch = await prisma.branch.findUnique({
      where: { id: params.id },
      select: { businessId: true },
    });

    if (!existingBranch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const business = await verifyBusinessOwnership(session.user.id, existingBranch.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const branch = await prisma.branch.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
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

    const existingBranch = await prisma.branch.findUnique({
      where: { id: params.id },
      select: { businessId: true },
    });

    if (!existingBranch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const business = await verifyBusinessOwnership(session.user.id, existingBranch.businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await prisma.branch.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

