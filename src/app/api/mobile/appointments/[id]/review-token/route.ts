/**
 * Mobile: generate (or fetch) a review token for an appointment.
 * POST /api/mobile/appointments/[id]/review-token
 *   - returns { token, link } the manager can copy or send via WhatsApp.
 *   - idempotent: re-creating returns the existing review's token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

function generateToken(): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 24; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

const PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.clickynder.com';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { id: appointmentId } = await params;
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId: business.id },
  });
  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

  const existing = await prisma.review.findUnique({ where: { appointmentId } });
  const review = existing
    ? existing
    : await prisma.review.create({
        data: {
          businessId: business.id,
          appointmentId,
          customerId: appt.customerId,
          token: generateToken(),
          status: 'pending',
        },
      });

  return NextResponse.json({
    token: review.token,
    link: `${PUBLIC_BASE_URL}/review/${review.token}`,
    review,
  });
}
