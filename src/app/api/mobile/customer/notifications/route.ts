import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unacknowledgedOnly = searchParams.get('unacknowledged') === 'true';

  try {
    const notifications = await prisma.customerNotification.findMany({
      where: {
        userId: auth.userId!,
        ...(unacknowledgedOnly ? { acknowledged: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Get customer notifications error:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת התראות' }, { status: 500 });
  }
}
