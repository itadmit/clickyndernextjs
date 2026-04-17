import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, generateAccessToken, generateRefreshToken } from '@/lib/mobile-auth';
import { createDefaultBusinessData } from '@/lib/create-default-business';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        ownedBusinesses: { select: { id: true }, take: 1 },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    if (user.ownedBusinesses.length > 0) {
      const existing = await prisma.business.findFirst({
        where: { ownerUserId: user.id },
        select: { id: true, name: true, slug: true, logoUrl: true },
      });
      return NextResponse.json({
        business: existing,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
        message: 'העסק כבר קיים',
      });
    }

    const body = await req.json();
    const { phone, businessSlug, businessAddress, city } = body;

    if (!businessSlug || !businessAddress || !city) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה: businessSlug, businessAddress, city' },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9-]+$/.test(businessSlug) || businessSlug.length < 3) {
      return NextResponse.json(
        { error: 'כתובת אתר חייבת להכיל לפחות 3 תווים, אותיות אנגליות קטנות, מספרים ומקפים בלבד' },
        { status: 400 },
      );
    }

    const slugTaken = await prisma.business.findUnique({ where: { slug: businessSlug } });
    if (slugTaken) {
      return NextResponse.json(
        { error: 'כתובת האתר הזאת כבר תפוסה. אנא בחר כתובת אחרת' },
        { status: 400 },
      );
    }

    if (phone && !user.phone) {
      await prisma.user.update({ where: { id: user.id }, data: { phone } });
    }

    const business = await prisma.business.create({
      data: {
        ownerUserId: user.id,
        name: city,
        slug: businessSlug,
        address: businessAddress,
        phone: phone || user.phone || null,
        email: user.email || auth.email || '',
        timezone: 'Asia/Jerusalem',
        locale: 'he-IL',
        showStaff: true,
        showBranches: false,
        onlinePaymentEnabled: false,
        templateStyle: 'modern',
        primaryColor: '#3b82f6',
        secondaryColor: '#758dff',
        backgroundColorStart: '#dbeafe',
        backgroundColorEnd: '#faf5ff',
        font: 'Noto Sans Hebrew',
      },
    });

    await createDefaultBusinessData(business.id, {
      name: user.name || city,
      email: user.email || auth.email || '',
      phone: phone || user.phone || undefined,
      city,
      businessAddress,
    });

    const email = user.email || auth.email || '';
    const accessToken = await generateAccessToken(user.id, email);
    const refreshToken = await generateRefreshToken(user.id, email);

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: phone || user.phone,
      },
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        logoUrl: business.logoUrl,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/mobile/auth/register error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת העסק' },
      { status: 500 },
    );
  }
}
