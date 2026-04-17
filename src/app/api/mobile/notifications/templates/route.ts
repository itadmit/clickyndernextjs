/**
 * Mobile Notification Templates API
 * GET  /api/mobile/notifications/templates - List all notification templates for the business
 * POST /api/mobile/notifications/templates - Create default templates if none exist
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const templates = await prisma.notificationTemplate.findMany({
      where: { businessId: business.id },
      orderBy: [{ channel: 'asc' }, { event: 'asc' }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching mobile notification templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification templates' },
      { status: 500 }
    );
  }
}

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

    const existingCount = await prisma.notificationTemplate.count({
      where: { businessId: business.id },
    });

    if (existingCount > 0) {
      return NextResponse.json(
        { error: 'Templates already exist for this business' },
        { status: 400 }
      );
    }

    const { createDefaultNotificationTemplates } = await import(
      '@/lib/notifications/default-templates'
    );

    await createDefaultNotificationTemplates(business.id);

    const templates = await prisma.notificationTemplate.findMany({
      where: { businessId: business.id },
      orderBy: [{ channel: 'asc' }, { event: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      count: templates.length,
      templates,
      message: `נוצרו ${templates.length} תבניות ברירת מחדל בהצלחה`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating mobile notification templates:', error);
    return NextResponse.json(
      { error: 'Failed to create notification templates' },
      { status: 500 }
    );
  }
}
