import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/mobile-auth';
import crypto from 'crypto';

// POST - Business owner generates an invitation link
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { businessId } = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: 'businessId נדרש' }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerUserId: auth.userId },
    });

    if (!business) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }

    const token = crypto.randomBytes(16).toString('hex');

    const invite = await prisma.businessInvite.create({
      data: {
        businessId,
        token,
        expiresAt: null, // no expiry by default
      },
    });

    const inviteUrl = `https://www.clickynder.com/invite/${token}`;

    return NextResponse.json({
      invite: {
        id: invite.id,
        token: invite.token,
        url: inviteUrl,
      },
    });
  } catch (error) {
    console.error('Generate invite error:', error);
    return NextResponse.json({ error: 'שגיאה ביצירת הזמנה' }, { status: 500 });
  }
}

// GET - Get invite info by token (public, no auth needed)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'token נדרש' }, { status: 400 });
  }

  try {
    const invite = await prisma.businessInvite.findUnique({
      where: { token },
      include: {
        business: {
          select: { id: true, name: true, slug: true, logoUrl: true, address: true },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'הזמנה פגת תוקף' }, { status: 410 });
    }

    return NextResponse.json({ invite: { business: invite.business } });
  } catch (error) {
    console.error('Get invite error:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת הזמנה' }, { status: 500 });
  }
}
