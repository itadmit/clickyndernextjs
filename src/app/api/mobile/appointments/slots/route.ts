/**
 * Mobile Available Slots API
 * GET /api/mobile/appointments/slots - Get available time slots
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { addMinutes, format, parse } from 'date-fns';
import {
  getEarliestBookableUtc,
  weekdayInTimeZone,
  zonedWallTimeToUtc,
} from '@/lib/slot-zoned-time';

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
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    const staffId = searchParams.get('staffId');
    const branchId = searchParams.get('branchId');

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: serviceId, date' },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const slotPolicy = await prisma.slotPolicy.findUnique({
      where: { businessId: business.id },
    });
    const businessTz = business.timezone || 'Asia/Jerusalem';
    const minAdvanceHours = slotPolicy?.minimumAdvanceBookingHours ?? 2;
    const earliestBookable = getEarliestBookableUtc(minAdvanceHours);

    const anchorNoon = zonedWallTimeToUtc(date, '12:00', businessTz);
    const dayOfWeek = weekdayInTimeZone(anchorNoon, businessTz);
    const businessHours = await prisma.businessHours.findUnique({
      where: {
        businessId_weekday: {
          businessId: business.id,
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
        businessId: business.id,
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
        businessId: business.id,
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

    return NextResponse.json({ slots, minimumAdvanceBookingHours: minAdvanceHours });
  } catch (error) {
    console.error('Error fetching mobile slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}
