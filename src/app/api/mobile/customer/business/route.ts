import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId נדרש' }, { status: 400 });
  }

  try {
    // Verify user is a customer of this business
    const customer = await prisma.customer.findFirst({
      where: { userId: auth.userId, businessId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'אין גישה לעסק זה' }, { status: 403 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        branches: {
          where: { active: true, deletedAt: null },
          select: { id: true, name: true, address: true, phone: true, isDefault: true },
        },
        services: {
          where: { active: true, deletedAt: null },
          include: {
            category: { select: { id: true, name: true } },
          },
        },
        staff: {
          where: { active: true, deletedAt: null },
          select: {
            id: true,
            name: true,
            roleLabel: true,
            calendarColor: true,
            serviceStaff: { select: { serviceId: true } },
          },
        },
        businessHours: { orderBy: { weekday: 'asc' } },
        galleryImages: { orderBy: { position: 'asc' } },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        address: business.address,
        phone: business.phone,
        email: business.email,
        logoUrl: business.logoUrl,
        coverImageUrl: business.coverImageUrl,
        primaryColor: business.primaryColor,
        secondaryColor: business.secondaryColor,
        font: business.font,
        showBranches: business.showBranches,
        showStaff: business.showStaff,
        facebookUrl: business.facebookUrl,
        instagramUrl: business.instagramUrl,
        twitterUrl: business.twitterUrl,
        youtubeUrl: business.youtubeUrl,
        whatsappNumber: business.whatsappNumber,
        telegramUrl: business.telegramUrl,
        branches: business.branches,
        services: business.services,
        staff: business.staff,
        businessHours: business.businessHours,
        galleryImages: business.galleryImages,
      },
    });
  } catch (error) {
    console.error('Get business details error:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת פרטי עסק' }, { status: 500 });
  }
}
