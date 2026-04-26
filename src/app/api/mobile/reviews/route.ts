/**
 * Mobile Reviews API (admin)
 * GET /api/mobile/reviews - List reviews for the business
 *   ?status=pending|published|hidden|all (default: all submitted)
 *   ?minRating=1-5
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const minRating = searchParams.get('minRating');

  const where: any = { businessId: business.id };
  if (status && ['pending', 'published', 'hidden'].includes(status)) {
    where.status = status;
  } else {
    // default: only submitted reviews (published or hidden)
    where.submittedAt = { not: null };
  }
  if (minRating) {
    where.rating = { gte: parseInt(minRating, 10) };
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      appointment: {
        select: {
          id: true, startAt: true, endAt: true,
          service: { select: { id: true, name: true } },
          staff: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
  });

  // Aggregate stats
  const submitted = reviews.filter((r) => r.submittedAt && r.rating != null);
  const avg = submitted.length
    ? submitted.reduce((s, r) => s + (r.rating ?? 0), 0) / submitted.length
    : 0;
  const distribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: submitted.filter((r) => r.rating === rating).length,
  }));

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      submittedAt: r.submittedAt,
      createdAt: r.createdAt,
      publicResponse: r.publicResponse,
      responseAt: r.responseAt,
      customer: r.customer,
      appointment: r.appointment,
      token: r.token,
    })),
    stats: { count: submitted.length, average: Math.round(avg * 10) / 10, distribution },
  });
}
