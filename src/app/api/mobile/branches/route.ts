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

    const branches = await prisma.branch.findMany({
      where: {
        businessId: business.id,
        deletedAt: null,
        active: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error('GET /api/mobile/branches error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
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
    const { name, address, phone, active, isDefault } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (isDefault) {
      await prisma.branch.updateMany({
        where: {
          businessId: business.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const branch = await prisma.branch.create({
      data: {
        businessId: business.id,
        name,
        address: address ?? null,
        phone: phone ?? null,
        active: active ?? true,
        isDefault: isDefault ?? false,
      },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    console.error('POST /api/mobile/branches error:', error);
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}
