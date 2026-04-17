import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

const resetSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, password } = resetSchema.parse(body);

    const normalizedEmail = email.toLowerCase().trim();

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalizedEmail,
        token,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'קישור לא תקין או שפג תוקפו' },
        { status: 400 }
      );
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: normalizedEmail,
            token,
          },
        },
      });
      return NextResponse.json(
        { error: 'פג תוקף הקישור. אנא בקש איפוס סיסמה מחדש' },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: normalizedEmail,
          token,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'אירעה שגיאה באיפוס הסיסמה' },
      { status: 500 }
    );
  }
}
