/**
 * Mobile Google Calendar integration management.
 * GET    /api/mobile/integrations/google-calendar - list connections (business + staff)
 * DELETE /api/mobile/integrations/google-calendar?id=<connectionId>  - disconnect
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const conns = await prisma.googleCalendarConnection.findMany({
    where: { businessId: business.id },
    include: { staff: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({
    connections: conns.map((c) => ({
      id: c.id,
      googleEmail: c.googleEmail,
      calendarId: c.calendarId,
      syncEnabled: c.syncEnabled,
      staff: c.staff,
      createdAt: c.createdAt,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.googleCalendarConnection.findFirst({
    where: { id, businessId: business.id },
  });
  if (!existing) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });

  await prisma.googleCalendarConnection.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
