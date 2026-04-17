/**
 * Webhook לקבלת עדכוני סטטוס מ-True Story
 * POST /api/webhooks/rappelsend
 * (הנתיב נשמר לתאימות לאחור)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('True Story webhook received:', body);

    const { message_id, status, mobile, timestamp } = body;

    if (message_id) {
      await prisma.notification.updateMany({
        where: {
          providerMessageId: message_id,
        },
        data: {
          status: status === 'delivered' ? 'sent' : 'failed',
          sentAt: timestamp ? new Date(timestamp) : new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('Error processing True Story webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
