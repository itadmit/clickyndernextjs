/**
 * Offer waitlist spot
 * POST /api/waitlist/[id]/offer - Offer a freed slot to waitlist entry + send WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/notifications/rappelsend';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: params.id },
      include: { customer: true, service: true, business: true },
    });

    if (!entry || entry.status !== 'waiting') {
      return NextResponse.json({ error: 'Entry not found or not waiting' }, { status: 404 });
    }

    const defaultMessage = `שלום ${entry.customer.firstName}! התפנה מקום ל${entry.service.name} ב${entry.business.name}. צור/י קשר בהקדם לקביעת תור.`;

    await sendWhatsAppMessage(entry.customer.phone, message || defaultMessage);

    await prisma.waitlistEntry.update({
      where: { id: params.id },
      data: {
        status: 'offered',
        offeredAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error offering waitlist spot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
