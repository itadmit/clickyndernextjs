/**
 * GET /api/mobile/customers/[id]/risk - no-show risk for a single customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { computeNoShowRisk } from '@/lib/no-show-risk';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { id: customerId } = await params;
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId: business.id },
  });
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const risk = await computeNoShowRisk(business.id, customerId);
  return NextResponse.json({ risk });
}
