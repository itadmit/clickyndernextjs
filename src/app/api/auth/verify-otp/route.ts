import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhoneNumber } from '@/lib/notifications/rappelsend';
import { randomBytes } from 'crypto';

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

    // Short-lived verification token for NextAuth signIn
    const verificationToken = randomBytes(32).toString('hex');

    // Store in VerificationToken table (expires in 5 minutes)
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedPhone,
        token: verificationToken,
        expires: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // Find or create user by phone
    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          name: null,
          email: null,
        },
      });
    }

    // Auto-link existing Customer records
    await prisma.customer.updateMany({
      where: { phone: normalizedPhone, userId: null },
      data: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      phone: normalizedPhone,
      verificationToken,
      userId: user.id,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'שגיאה באימות קוד' }, { status: 500 });
  }
}
