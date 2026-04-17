/**
 * Available Slots API
 * GET /api/appointments/slots - Get available time slots
 * For group services: returns open group sessions with availability
 * For regular services: returns standard time slots
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addMinutes, format, parse } from 'date-fns';
import {
  getEarliestBookableUtc,
  weekdayInTimeZone,
  zonedWallTimeToUtc,
} from '@/lib/slot-zoned-time';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    const staffId = searchParams.get('staffId');
    const branchId = searchParams.get('branchId');

    if (!businessId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        timezone: true,
        slotPolicy: { select: { minimumAdvanceBookingHours: true } },
      },
    });
    const businessTz = business?.timezone || 'Asia/Jerusalem';
    const minAdvanceHours = business?.slotPolicy?.minimumAdvanceBookingHours ?? 2;
    const earliestBookable = getEarliestBookableUtc(minAdvanceHours);

    // For group services, return open group sessions instead of time slots
    if (service.isGroup) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const groupSessions = await prisma.groupSession.findMany({
        where: {
          businessId,
          serviceId,
          startAt: { gte: startOfDay, lte: endOfDay },
          status: 'open',
          ...(staffId && { staffId }),
          ...(branchId && { branchId }),
        },
        include: {
          staff: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { startAt: 'asc' },
      });

      const sessions = groupSessions
        .filter((gs) => gs.startAt >= earliestBookable)
        .map((gs) => ({
          id: gs.id,
          startAt: gs.startAt.toISOString(),
          endAt: gs.endAt.toISOString(),
          time: format(gs.startAt, 'HH:mm'),
          maxParticipants: gs.maxParticipants,
          currentCount: gs.currentCount,
          availableSpots: gs.maxParticipants - gs.currentCount,
          staff: gs.staff,
          branch: gs.branch,
          notes: gs.notes,
        }));

      return NextResponse.json({
        slots: [],
        groupSessions: sessions,
        isGroup: true,
        minimumAdvanceBookingHours: minAdvanceHours,
      });
    }

    // --- Standard (non-group) slot logic below ---

    const anchorNoon = zonedWallTimeToUtc(date, '12:00', businessTz);
    const dayOfWeek = weekdayInTimeZone(anchorNoon, businessTz);
    const businessHours = await prisma.businessHours.findUnique({
      where: {
        businessId_weekday: {
          businessId,
          weekday: dayOfWeek,
        },
      },
    });

    if (!businessHours || !businessHours.active || !businessHours.openTime || !businessHours.closeTime) {
      return NextResponse.json({ slots: [] });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const businessTimeOff = await prisma.timeOff.findFirst({
      where: {
        businessId,
        scope: 'business',
        startAt: { lte: endOfDay },
        endAt: { gte: startOfDay },
      },
    });

    if (businessTimeOff) {
      return NextResponse.json({ slots: [], reason: 'holiday', message: businessTimeOff.reason || 'העסק לא פעיל בתאריך זה' });
    }

    if (branchId) {
      const branchTimeOff = await prisma.timeOff.findFirst({
        where: {
          branchId,
          scope: 'branch',
          startAt: { lte: endOfDay },
          endAt: { gte: startOfDay },
        },
      });

      if (branchTimeOff) {
        return NextResponse.json({ slots: [], reason: 'branch_closed', message: branchTimeOff.reason || 'הסניף סגור בתאריך זה' });
      }
    }

    if (staffId) {
      const staffTimeOff = await prisma.timeOff.findFirst({
        where: {
          staffId,
          scope: 'staff',
          startAt: { lte: endOfDay },
          endAt: { gte: startOfDay },
        },
      });

      if (staffTimeOff) {
        return NextResponse.json({ slots: [], reason: 'staff_unavailable', message: 'העובד לא זמין בתאריך זה' });
      }
    }

    let staffBreaks: { startTime: string; endTime: string }[] = [];
    if (staffId) {
      staffBreaks = await prisma.staffBreak.findMany({
        where: {
          staffId,
          weekday: dayOfWeek,
          active: true,
        },
        select: {
          startTime: true,
          endTime: true,
        },
      });
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        ...(staffId && { staffId }),
        startAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ['canceled'],
        },
      },
    });

    const slots: string[] = [];
    const openTime = parse(businessHours.openTime, 'HH:mm', new Date(date));
    const closeTime = parse(businessHours.closeTime, 'HH:mm', new Date(date));
    
    let currentSlot = openTime;
    while (currentSlot < closeTime) {
      const slotEnd = addMinutes(currentSlot, service.durationMin);
      
      if (slotEnd <= closeTime) {
        const slotTimeStr = format(currentSlot, 'HH:mm');
        const slotEndTimeStr = format(slotEnd, 'HH:mm');

        const isOnBreak = staffBreaks.some((b) => {
          return slotTimeStr < b.endTime && slotEndTimeStr > b.startTime;
        });

        if (!isOnBreak) {
          const isAvailable = !existingAppointments.some((appointment) => {
            const appointmentStart = new Date(appointment.startAt);
            const appointmentEnd = new Date(appointment.endAt);
            
            return (
              (currentSlot >= appointmentStart && currentSlot < appointmentEnd) ||
              (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
              (currentSlot <= appointmentStart && slotEnd >= appointmentEnd)
            );
          });

          if (isAvailable) {
            const slotStartUtc = zonedWallTimeToUtc(date, slotTimeStr, businessTz);
            if (slotStartUtc >= earliestBookable) {
              slots.push(slotTimeStr);
            }
          }
        }
      }

      currentSlot = addMinutes(currentSlot, 15);
    }

    // Add waitlist info if service has waitlist enabled and no slots
    const waitlistEnabled = service.waitlistEnabled && slots.length === 0;

    return NextResponse.json({
      slots,
      isGroup: false,
      waitlistEnabled,
      minimumAdvanceBookingHours: minAdvanceHours,
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
