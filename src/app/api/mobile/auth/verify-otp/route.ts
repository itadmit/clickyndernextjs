import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken } from '@/lib/mobile-auth';
import { normalizePhoneNumber } from '@/lib/notifications/rappelsend';

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'טלפון וקוד נדרשים' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        code,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'קוד שגוי או פג תוקף' }, { status: 401 });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Find or create user by phone
    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: {
        ownedBusinesses: {
          select: { id: true, name: true, slug: true, logoUrl: true },
          take: 1,
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          name: null,
          email: null,
        },
        include: {
          ownedBusinesses: {
            select: { id: true, name: true, slug: true, logoUrl: true },
            take: 1,
          },
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Auto-link existing Customer records that match this phone
    await prisma.customer.updateMany({
      where: {
        phone: normalizedPhone,
        userId: null,
      },
      data: { userId: user.id },
    });

    // Get all businesses where user is a customer
    const customerRecords = await prisma.customer.findMany({
      where: { userId: user.id },
      include: {
        business: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
    });

    const customerBusinesses = customerRecords.map((c) => c.business);

    const ownedBusiness = user.ownedBusinesses[0] || null;

    let role: 'owner' | 'customer' | 'both' | 'none' = 'none';
    if (ownedBusiness && customerBusinesses.length > 0) role = 'both';
    else if (ownedBusiness) role = 'owner';
    else if (customerBusinesses.length > 0) role = 'customer';

    const email = user.email || '';
    const accessToken = await generateAccessToken(user.id, email);
    const refreshToken = await generateRefreshToken(user.id, email);

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isSuperAdmin: user.isSuperAdmin,
      },
      business: ownedBusiness,
      customerBusinesses,
      role,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'שגיאה באימות קוד' }, { status: 500 });
  }
}
