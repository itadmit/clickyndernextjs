import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/mobile-auth';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'token נדרש' }, { status: 400 });
    }

    const invite = await prisma.businessInvite.findUnique({
      where: { token },
      include: {
        business: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'הזמנה פגת תוקף' }, { status: 410 });
    }

    // Check if already a customer
    const existing = await prisma.customer.findFirst({
      where: { userId: auth.userId, businessId: invite.businessId },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        business: invite.business,
      });
    }

    // Get user info for creating Customer record
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    await prisma.customer.create({
      data: {
        businessId: invite.businessId,
        userId: user.id,
        firstName: user.name?.split(' ')[0] || 'לקוח',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        phone: user.phone || '',
        email: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      business: invite.business,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'שגיאה בקבלת הזמנה' }, { status: 500 });
  }
}
