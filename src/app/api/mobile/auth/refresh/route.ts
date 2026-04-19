/**
 * Mobile Token Refresh API
 * POST /api/mobile/auth/refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // ודא שהמשתמש עדיין קיים
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        ownedBusinesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // יצירת טוקנים חדשים
    const email = user.email || '';
    const newAccessToken = await generateAccessToken(user.id, email);
    const newRefreshToken = await generateRefreshToken(user.id, email);

    const business = user.ownedBusinesses[0] || null;

    const customerRecords = await prisma.customer.findMany({
      where: { userId: user.id },
      include: {
        business: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
    });
    const customerBusinesses = customerRecords.map((c) => c.business);

    let role: 'owner' | 'customer' | 'both' | 'none' = 'none';
    if (business && customerBusinesses.length > 0) role = 'both';
    else if (business) role = 'owner';
    else if (customerBusinesses.length > 0) role = 'customer';

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
      },
      business,
      customerBusinesses,
      role,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'שגיאה ברענון הטוקן' },
      { status: 500 }
    );
  }
}
