/**
 * Backfill notification templates for existing businesses
 * POST /api/admin/backfill-templates
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createDefaultNotificationTemplates } from '@/lib/notifications/default-templates';

export async function POST() {
  try {
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true },
    });

    let created = 0;
    let skipped = 0;

    for (const biz of businesses) {
      const count = await prisma.notificationTemplate.count({
        where: { businessId: biz.id },
      });

      if (count === 0) {
        await createDefaultNotificationTemplates(biz.id);
        created++;
        console.log(`Created templates for: ${biz.name} (${biz.id})`);
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      total: businesses.length,
      created,
      skipped,
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({ error: 'Failed to backfill' }, { status: 500 });
  }
}
