/**
 * Mobile: create a checkout payment link for upgrading the subscription.
 * POST /api/mobile/subscriptions/checkout { packageCode }
 *   Returns { paymentUrl } the mobile client should open in an in-app browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { generatePaymentLink } from '@/lib/payplus-service';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { packageCode } = await req.json();
  if (!packageCode) return NextResponse.json({ error: 'packageCode is required' }, { status: 400 });

  const pkg = await prisma.package.findUnique({ where: { code: packageCode } });
  if (!pkg || pkg.priceCents === 0) {
    return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://www.clickynder.com';
  const amount = pkg.priceCents / 100;

  const result = await generatePaymentLink({
    amount,
    description: `מנוי Clickinder - ${pkg.name}`,
    businessId: business.id,
    packageCode: pkg.code,
    customerEmail: business.email || undefined,
    customerName: business.name,
    successUrl: `${baseUrl}/mobile-payment-return?status=success`,
    callbackUrl: `${baseUrl}/api/subscriptions/webhook`,
  });

  if (result.results?.status === 'success' || result.data?.payment_page_link) {
    return NextResponse.json({ paymentUrl: result.data.payment_page_link });
  }

  console.error('PayPlus generateLink unexpected response:', result);
  return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
}
