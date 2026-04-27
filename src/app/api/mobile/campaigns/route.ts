/**
 * Marketing campaigns - list / create.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { computeAudience, AudienceType } from '@/lib/campaigns/audience';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const campaigns = await prisma.campaign.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const body = await req.json();
  const {
    name, channel = 'whatsapp', message,
    audienceType = 'all', audienceParams = {},
  } = body;

  if (!name || !message) {
    return NextResponse.json({ error: 'name and message are required' }, { status: 400 });
  }

  // Pre-compute the audience size so the manager sees it on creation
  const { total } = await computeAudience(business.id, audienceType as AudienceType, audienceParams);

  const campaign = await prisma.campaign.create({
    data: {
      businessId: business.id,
      name,
      channel,
      message,
      audienceType,
      audienceParams,
      status: 'draft',
      totalRecipients: total,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
