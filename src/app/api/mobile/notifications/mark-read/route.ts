/**
 * Mobile Mark Notifications Read API
 * POST /api/mobile/notifications/mark-read
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // סמן הכל כנקרא
      await prisma.dashboardNotification.updateMany({
        where: {
          businessId: business.id,
          read: false,
        },
        data: { read: true },
      });
    } else if (notificationId) {
      // סמן התראה ספציפית
      await prisma.dashboardNotification.updateMany({
        where: {
          id: notificationId,
          businessId: business.id,
        },
        data: { read: true },
      });
    } else {
      return NextResponse.json(
        { error: 'notificationId or markAll is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications' },
      { status: 500 }
    );
  }
}
