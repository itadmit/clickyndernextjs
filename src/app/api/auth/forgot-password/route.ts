import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/notifications/email-service';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'נא להזין כתובת אימייל' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // תמיד מחזירים הצלחה כדי לא לחשוף אם האימייל קיים
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: true });
    }

    // מחיקת טוקנים ישנים לאותו אימייל
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // שעה אחת

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendEmail({
      to: normalizedEmail,
      subject: 'איפוס סיסמה - Clickynder',
      body: 'איפוס סיסמה',
      html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Noto Sans Hebrew', 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; direction: rtl; text-align: right;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">איפוס סיסמה</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #333;">שלום <strong>${user.name || ''}</strong>,</p>
      <p style="font-size: 16px; color: #666; line-height: 1.7;">קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה:</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
          איפוס סיסמה
        </a>
      </div>
      <p style="font-size: 14px; color: #999; line-height: 1.6;">הקישור תקף לשעה אחת בלבד. אם לא ביקשת לאפס את הסיסמה, התעלם מהודעה זו.</p>
      <p style="font-size: 12px; color: #ccc; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
        Clickynder - מערכת ניהול תורים חכמה
      </p>
    </div>
  </div>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בשליחת המייל' },
      { status: 500 }
    );
  }
}
