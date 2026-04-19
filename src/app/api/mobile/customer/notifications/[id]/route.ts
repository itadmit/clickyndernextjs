import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/mobile-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const notification = await prisma.customerNotification.findUnique({
      where: { id: params.id },
    });

    if (!notification || notification.userId !== auth.userId) {
      return NextResponse.json({ error: 'התראה לא נמצאה' }, { status: 404 });
    }

    const updated = await prisma.customerNotification.update({
      where: { id: params.id },
      data: { acknowledged: true, acknowledgedAt: new Date() },
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    console.error('Acknowledge notification error:', error);
    return NextResponse.json({ error: 'שגיאה בעדכון התראה' }, { status: 500 });
  }
}
