/**
 * Audience preview - given audienceType + params, return count + sample.
 * POST /api/mobile/campaigns/preview { audienceType, audienceParams }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { computeAudience, AudienceType } from '@/lib/campaigns/audience';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { audienceType = 'all', audienceParams = {} } = await req.json();
  const { customerIds, total } = await computeAudience(
    business.id,
    audienceType as AudienceType,
    audienceParams,
  );

  const sample = await prisma.customer.findMany({
    where: { id: { in: customerIds.slice(0, 10) } },
    select: { id: true, firstName: true, lastName: true, phone: true },
  });

  return NextResponse.json({ total, sample });
}
