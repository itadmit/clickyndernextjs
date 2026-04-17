/**
 * Business Hours API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyBusinessOwnership } from '@/lib/verify-business';

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId, hours } = await req.json();

    const business = await verifyBusinessOwnership(session.user.id, businessId);
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete existing hours
    await prisma.businessHours.deleteMany({
      where: { businessId },
    });

    // Create new hours
    await prisma.businessHours.createMany({
      data: hours.map((hour: any) => ({
        businessId,
        weekday: hour.weekday,
        openTime: hour.active ? hour.openTime : null,
        closeTime: hour.active ? hour.closeTime : null,
        active: hour.active,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating business hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

