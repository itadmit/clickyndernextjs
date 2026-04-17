import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    // If user already has a password, verify the current one
    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'נא להזין את הסיסמה הנוכחית' },
          { status: 400 }
        );
      }

      const isValid = await compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'הסיסמה הנוכחית שגויה' },
          { status: 400 }
        );
      }
    }

    // Hash and save new password
    const passwordHash = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true, message: 'הסיסמה עודכנה בהצלחה' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בעדכון הסיסמה' },
      { status: 500 }
    );
  }
}


