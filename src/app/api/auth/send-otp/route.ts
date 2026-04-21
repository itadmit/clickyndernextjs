import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, normalizePhoneNumber } from '@/lib/notifications/rappelsend';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'מספר טלפון נדרש' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentAttempts = await prisma.otpCode.count({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentAttempts >= 3) {
      return NextResponse.json(
        { error: 'נשלחו יותר מדי קודים. נסה שוב בעוד מספר דקות' },
        { status: 429 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otpCode.create({
      data: {
        phone: normalizedPhone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const message = `קוד האימות שלך בקליקינדר: ${code}\nתוקף הקוד 5 דקות.`;

    const result = await sendWhatsAppMessage(normalizedPhone, message);

    if (!result.success) {
      console.error('Failed to send OTP WhatsApp:', result.error);
      return NextResponse.json(
        { error: 'לא ניתן לשלוח קוד. ודא שמספר הטלפון נכון' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, phone: normalizedPhone });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'שגיאה בשליחת קוד' }, { status: 500 });
  }
}
