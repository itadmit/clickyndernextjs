import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePaymentLink } from '@/lib/payplus-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageCode } = await req.json();
    if (!packageCode) {
      return NextResponse.json({ error: 'packageCode is required' }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerUserId: session.user.id },
    });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const pkg = await prisma.package.findUnique({
      where: { code: packageCode },
    });
    if (!pkg || pkg.priceCents === 0) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://clickynder.com';
    const amount = pkg.priceCents / 100;

    const result = await generatePaymentLink({
      amount,
      description: `מנוי Clickinder - ${pkg.name}`,
      businessId: business.id,
      packageCode: pkg.code,
      customerEmail: session.user.email || undefined,
      customerName: session.user.name || undefined,
      successUrl: `${baseUrl}/dashboard/subscription`,
      callbackUrl: `${baseUrl}/api/subscriptions/webhook`,
    });

    if (result.results?.status === 'success' || result.data?.payment_page_link) {
      return NextResponse.json({
        paymentUrl: result.data.payment_page_link,
      });
    }

    console.error('PayPlus generateLink unexpected response:', result);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
