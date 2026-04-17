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

    const branch = await prisma.branch.findFirst({
      where: {
        id,
        businessId: business.id,
        deletedAt: null,
      },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json({ branch });
  } catch (error) {
    console.error('GET /api/mobile/branches/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branch' },
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

    const existing = await prisma.branch.findFirst({
      where: {
        id,
        businessId: business.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, address, phone, active, isDefault } = body;

    if (isDefault) {
      await prisma.branch.updateMany({
        where: {
          businessId: business.id,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(active !== undefined && { active }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json({ branch });
  } catch (error) {
    console.error('PUT /api/mobile/branches/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update branch' },
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

    const existing = await prisma.branch.findFirst({
      where: {
        id,
        businessId: business.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    await prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/mobile/branches/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
