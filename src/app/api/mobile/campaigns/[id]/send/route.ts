/**
 * Send a campaign.
 * POST /api/mobile/campaigns/[id]/send
 *   Computes the audience again at send-time, creates CampaignRecipient rows,
 *   then iterates and sends via ibot-chat (WhatsApp). Email/SMS not yet wired.
 *
 * Note: this is a synchronous loop. For very large audiences we'd push to a
 * queue (QStash/cron) instead — fine for MVP. We sleep 200ms between sends to
 * avoid the vendor's "no high parallel volume" guideline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { computeAudience, AudienceType } from '@/lib/campaigns/audience';
import { sendWhatsAppMessage } from '@/lib/notifications/rappelsend';

function renderMessage(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, businessId: business.id },
  });
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  if (campaign.status !== 'draft') {
    return NextResponse.json({ error: 'Campaign already sent or canceled' }, { status: 400 });
  }
  if (campaign.channel !== 'whatsapp') {
    return NextResponse.json({ error: 'Only WhatsApp channel is supported right now' }, { status: 400 });
  }

  const audience = await computeAudience(
    business.id,
    campaign.audienceType as AudienceType,
    (campaign.audienceParams as any) ?? {},
  );
  if (audience.customerIds.length === 0) {
    return NextResponse.json({ error: 'No recipients match the audience' }, { status: 400 });
  }

  const customers = await prisma.customer.findMany({
    where: { id: { in: audience.customerIds } },
    select: { id: true, firstName: true, lastName: true, phone: true },
  });

  // Mark campaign as sending and create recipient rows
  await prisma.$transaction([
    prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'sending',
        totalRecipients: customers.length,
        sentCount: 0,
        failedCount: 0,
      },
    }),
    prisma.campaignRecipient.createMany({
      data: customers.map((c) => ({ campaignId: campaign.id, customerId: c.id, status: 'pending' })),
    }),
  ]);

  let sent = 0;
  let failed = 0;
  for (const c of customers) {
    if (!c.phone) {
      failed++;
      continue;
    }
    const personalized = renderMessage(campaign.message, {
      firstName: c.firstName,
      lastName: c.lastName,
      businessName: business.name,
    });
    const res = await sendWhatsAppMessage(c.phone, personalized);
    if (res.success) {
      sent++;
      await prisma.campaignRecipient.updateMany({
        where: { campaignId: campaign.id, customerId: c.id },
        data: { status: 'sent', sentAt: new Date() },
      });
    } else {
      failed++;
      await prisma.campaignRecipient.updateMany({
        where: { campaignId: campaign.id, customerId: c.id },
        data: { status: 'failed', errorMessage: res.error || 'unknown' },
      });
    }
    await sleep(200); // pace
  }

  const updated = await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: 'sent',
      sentAt: new Date(),
      sentCount: sent,
      failedCount: failed,
    },
  });

  return NextResponse.json({ campaign: updated, sent, failed });
}
