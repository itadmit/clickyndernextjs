/**
 * Validate Coupon (public)
 * POST /api/coupons/validate
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { businessId, code } = await req.json();

    if (!businessId || !code) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        businessId,
        code: code.toUpperCase(),
        active: true,
      },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'קוד קופון לא תקין' });
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json({ valid: false, error: 'הקופון עדיין לא בתוקף' });
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return NextResponse.json({ valid: false, error: 'הקופון פג תוקף' });
    }
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: 'הקופון מוצה' });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
