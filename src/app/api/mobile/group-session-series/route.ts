/**
 * Mobile Group Session Series API
 * GET  /api/mobile/group-session-series — list series for the authenticated business
 * POST /api/mobile/group-session-series — create a series and generate every occurrence
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { fromZonedTime } from 'date-fns-tz';
import { addDays, parseISO, startOfDay } from 'date-fns';

const MAX_OCCURRENCES = 365; // hard cap so a runaway series can't fill the DB

function generateOccurrences(opts: {
  startDate: Date;
  endDate: Date | null;
  occurrenceCount: number | null;
  daysOfWeek: number[];
  startTime: string; // "HH:mm"
  durationMin: number;
  timezone: string;
}): { startAt: Date; endAt: Date }[] {
  const { startDate, endDate, occurrenceCount, daysOfWeek, startTime, durationMin, timezone } = opts;
  const [hStr, mStr] = startTime.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);

  const out: { startAt: Date; endAt: Date }[] = [];
  let cursor = startOfDay(startDate);
  const hardEnd = endDate
    ? startOfDay(endDate)
    : addDays(cursor, 365 * 2); // 2-year safety horizon when only count is given
  const targetCount = occurrenceCount ?? MAX_OCCURRENCES;

  while (cursor <= hardEnd && out.length < targetCount && out.length < MAX_OCCURRENCES) {
    if (daysOfWeek.includes(cursor.getDay())) {
      // Build the local wall-clock time then convert to UTC using the business tz
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      const hh = String(hours).padStart(2, '0');
      const mn = String(minutes).padStart(2, '0');
      const localIso = `${yyyy}-${mm}-${dd}T${hh}:${mn}:00`;
      const startAt = fromZonedTime(localIso, timezone);
      const endAt = new Date(startAt.getTime() + durationMin * 60000);
      out.push({ startAt, endAt });
    }
    cursor = addDays(cursor, 1);
  }

  return out;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const series = await prisma.groupSessionSeries.findMany({
      where: {
        businessId: business.id,
        ...(status && { status: status as any }),
      },
      include: {
        sessions: {
          select: { id: true, startAt: true, status: true },
          orderBy: { startAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const withMeta = await Promise.all(
      series.map(async (s) => {
        const service = await prisma.service.findUnique({
          where: { id: s.serviceId },
          select: { id: true, name: true, durationMin: true },
        });
        const staff = s.staffId
          ? await prisma.staff.findUnique({ where: { id: s.staffId }, select: { id: true, name: true } })
          : null;
        return { ...s, service, staff, sessionCount: s.sessions.length };
      })
    );

    return NextResponse.json({ series: withMeta });
  } catch (error) {
    console.error('Error listing group session series:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      serviceId,
      staffId,
      branchId,
      daysOfWeek,
      startTime,
      startDate,
      endDate,
      occurrenceCount,
      maxParticipants,
      notes,
    } = body as {
      serviceId?: string;
      staffId?: string | null;
      branchId?: string | null;
      daysOfWeek?: number[];
      startTime?: string;
      startDate?: string;
      endDate?: string | null;
      occurrenceCount?: number | null;
      maxParticipants?: number;
      notes?: string | null;
    };

    if (!serviceId || !startTime || !startDate || !daysOfWeek || daysOfWeek.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, daysOfWeek, startTime, startDate' },
        { status: 400 }
      );
    }
    if (!endDate && !occurrenceCount) {
      return NextResponse.json(
        { error: 'Provide either endDate or occurrenceCount' },
        { status: 400 }
      );
    }
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      return NextResponse.json({ error: 'startTime must be HH:mm' }, { status: 400 });
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId: business.id },
    });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (!service.isGroup) {
      return NextResponse.json({ error: 'Service is not a group service' }, { status: 400 });
    }

    const effectiveMax = maxParticipants ?? service.maxParticipants ?? 15;
    const tz = business.timezone || 'Asia/Jerusalem';

    const occurrences = generateOccurrences({
      startDate: parseISO(startDate),
      endDate: endDate ? parseISO(endDate) : null,
      occurrenceCount: occurrenceCount ?? null,
      daysOfWeek,
      startTime,
      durationMin: service.durationMin,
      timezone: tz,
    });

    if (occurrences.length === 0) {
      return NextResponse.json(
        { error: 'No occurrences would be generated — check daysOfWeek and date range' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const series = await tx.groupSessionSeries.create({
        data: {
          businessId: business.id,
          serviceId,
          staffId: staffId || null,
          branchId: branchId || null,
          daysOfWeek,
          startTime,
          startDate: parseISO(startDate),
          endDate: endDate ? parseISO(endDate) : null,
          occurrenceCount: occurrenceCount ?? null,
          maxParticipants: effectiveMax,
          notes: notes || null,
          status: 'active',
        },
      });

      await tx.groupSession.createMany({
        data: occurrences.map((o) => ({
          businessId: business.id,
          serviceId,
          staffId: staffId || null,
          branchId: branchId || null,
          seriesId: series.id,
          startAt: o.startAt,
          endAt: o.endAt,
          maxParticipants: effectiveMax,
          notes: notes || null,
          status: 'open' as const,
        })),
      });

      return series;
    });

    return NextResponse.json(
      { series: result, sessionCount: occurrences.length },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating group session series:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
