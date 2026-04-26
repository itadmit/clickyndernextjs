/**
 * Public Reviews API
 * GET  /api/public/reviews/[token] - fetch the review context (business, service, staff, etc.)
 * POST /api/public/reviews/[token] - customer submits rating + comment
 *
 * No auth — the token is the credential. Once submitted, further POSTs are rejected.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const review = await prisma.review.findUnique({
    where: { token },
    include: {
      business: { select: { id: true, name: true, logoUrl: true, slug: true } },
      customer: { select: { firstName: true, lastName: true } },
      appointment: {
        select: {
          startAt: true,
          service: { select: { name: true } },
          staff: { select: { name: true } },
        },
      },
    },
  });
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  return NextResponse.json({
    business: review.business,
    customer: review.customer,
    appointment: review.appointment,
    alreadySubmitted: !!review.submittedAt,
    rating: review.rating,
    comment: review.comment,
    submittedAt: review.submittedAt,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const review = await prisma.review.findUnique({ where: { token } });
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  if (review.submittedAt) {
    return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
  }

  const { rating, comment } = await req.json();
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1..5' }, { status: 400 });
  }

  const updated = await prisma.review.update({
    where: { token },
    data: {
      rating,
      comment: comment ? String(comment).trim() : null,
      submittedAt: new Date(),
      status: 'published',
    },
  });

  return NextResponse.json({
    success: true,
    rating: updated.rating,
    submittedAt: updated.submittedAt,
  });
}
