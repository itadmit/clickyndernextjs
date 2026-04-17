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

    const service = await prisma.service.findFirst({
      where: {
        id,
        businessId: business.id,
        deletedAt: null,
      },
      include: {
        category: true,
        serviceStaff: {
          include: {
            staff: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('GET /api/mobile/services/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
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

    const existing = await prisma.service.findFirst({
      where: {
        id,
        businessId: business.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      name, durationMin, priceCents, bufferAfterMin, description, color, active,
      staffIds, categoryId, isGroup, maxParticipants, minParticipants,
      waitlistEnabled, requirePayment, depositOverrideCents,
    } = body;

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(durationMin !== undefined && { durationMin }),
        ...(priceCents !== undefined && { priceCents }),
        ...(bufferAfterMin !== undefined && { bufferAfterMin }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(active !== undefined && { active }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isGroup !== undefined && { isGroup }),
        ...(maxParticipants !== undefined && { maxParticipants }),
        ...(minParticipants !== undefined && { minParticipants }),
        ...(waitlistEnabled !== undefined && { waitlistEnabled }),
        ...(requirePayment !== undefined && { requirePayment }),
        ...(depositOverrideCents !== undefined && { depositOverrideCents }),
      },
    });

    if (staffIds && Array.isArray(staffIds)) {
      await prisma.serviceStaff.deleteMany({
        where: { serviceId: id },
      });

      if (staffIds.length > 0) {
        await prisma.serviceStaff.createMany({
          data: staffIds.map((staffId: string) => ({
            serviceId: id,
            staffId,
          })),
        });
      }
    }

    const updated = await prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        serviceStaff: {
          include: {
            staff: true,
          },
        },
      },
    });

    return NextResponse.json({ service: updated });
  } catch (error) {
    console.error('PUT /api/mobile/services/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
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

    const existing = await prisma.service.findFirst({
      where: {
        id,
        businessId: business.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/mobile/services/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
