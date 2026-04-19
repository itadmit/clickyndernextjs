import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const customerRecords = await prisma.customer.findMany({
      where: { userId: auth.userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            address: true,
            phone: true,
            primaryColor: true,
          },
        },
        _count: {
          select: {
            appointments: {
              where: { status: { in: ['confirmed', 'pending'] } },
            },
          },
        },
      },
    });

    const businesses = customerRecords.map((c) => ({
      ...c.business,
      customerId: c.id,
      upcomingAppointments: c._count.appointments,
    }));

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Get customer businesses error:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת עסקים' }, { status: 500 });
  }
}
