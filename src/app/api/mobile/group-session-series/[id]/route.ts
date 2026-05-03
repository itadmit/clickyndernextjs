/**
 * Mobile Group Session Series — single resource
 * GET    /api/mobile/group-session-series/[id]
 * PATCH  /api/mobile/group-session-series/[id]   — update notes/status (active|paused|ended)
 * DELETE /api/mobile/group-session-series/[id]?cascade=future|all
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

async function loadOwnedSeries(seriesId: string, businessId: string) {
  return prisma.groupSessionSeries.findFirst({
    where: { id: seriesId, businessId },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const { id } = await ctx.params;
    const series = await prisma.groupSessionSeries.findFirst({
      where: { id, businessId: business.id },
      include: {
        sessions: {
          include: { service: true, staff: true },
          orderBy: { startAt: 'asc' },
        },
      },
    });
    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

    const service = await prisma.service.findUnique({
      where: { id: series.serviceId },
      select: { id: true, name: true, durationMin: true, maxParticipants: true },
    });
    const staff = series.staffId
      ? await prisma.staff.findUnique({ where: { id: series.staffId }, select: { id: true, name: true } })
      : null;

    return NextResponse.json({ series: { ...series, service, staff } });
  } catch (error) {
    console.error('Error fetching group session series:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const { id } = await ctx.params;
    const series = await loadOwnedSeries(id, business.id);
    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

    const body = await req.json();
    const { status, notes } = body as { status?: 'active' | 'paused' | 'ended'; notes?: string | null };

    const updated = await prisma.groupSessionSeries.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ series: updated });
  } catch (error) {
    console.error('Error updating group session series:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const { id } = await ctx.params;
    const series = await loadOwnedSeries(id, business.id);
    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const cascade = searchParams.get('cascade'); // "future" | "all" | null

    await prisma.$transaction(async (tx) => {
      if (cascade === 'all') {
        await tx.groupSession.deleteMany({ where: { seriesId: id, businessId: business.id } });
      } else if (cascade === 'future') {
        await tx.groupSession.deleteMany({
          where: { seriesId: id, businessId: business.id, startAt: { gte: new Date() } },
        });
      }
      await tx.groupSessionSeries.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting group session series:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
