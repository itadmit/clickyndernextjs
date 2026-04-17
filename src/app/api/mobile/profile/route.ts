/**
 * Mobile Profile API
 * GET /api/mobile/profile - Get user profile and business info
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        ownedBusinesses: {
          include: {
            _count: {
              select: {
                staff: { where: { active: true } },
                services: { where: { active: true } },
                branches: { where: { active: true } },
                customers: true,
              },
            },
            subscription: {
              include: {
                package: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const business = user.ownedBusinesses[0];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        createdAt: user.createdAt,
      },
      business: business ? {
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        address: business.address,
        phone: business.phone,
        email: business.email,
        logoUrl: business.logoUrl,
        primaryColor: business.primaryColor,
        currency: business.currency,
        counts: {
          staff: business._count.staff,
          services: business._count.services,
          branches: business._count.branches,
          customers: business._count.customers,
        },
        subscription: business.subscription ? {
          status: business.subscription.status,
          packageName: business.subscription.package.name,
          packageCode: business.subscription.package.code,
          currentPeriodEnd: business.subscription.currentPeriodEnd,
        } : null,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching mobile profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
