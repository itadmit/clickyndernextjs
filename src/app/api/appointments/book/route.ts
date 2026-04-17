/**
 * Book Appointment API
 * POST /api/appointments/book - Create a new appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateConfirmationCode, addMinutes } from '@/lib/utils';
import { sendBookingConfirmation } from '@/lib/notifications/notification-service';
import { sendPushToBusinessOwner } from '@/lib/notifications/push-service';
import {
  formatTimeInZone,
  getEarliestBookableUtc,
  weekdayInTimeZone,
  zonedWallTimeToUtc,
} from '@/lib/slot-zoned-time';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      branchId,
      serviceId,
      staffId,
      date,
      time,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      groupSessionId,
    } = body;

    // Validate required fields
    if (!businessId || !serviceId || !date || !time || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.businessId !== businessId) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { slotPolicy: true },
    });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    const businessTz = business.timezone || 'Asia/Jerusalem';
    const minAdvanceHours = business.slotPolicy?.minimumAdvanceBookingHours ?? 2;
    const earliestBookable = getEarliestBookableUtc(minAdvanceHours);

    // Handle group session booking
    if (groupSessionId) {
      const groupSession = await prisma.groupSession.findUnique({
        where: { id: groupSessionId },
      });

      if (!groupSession || groupSession.status !== 'open') {
        return NextResponse.json({ error: 'הסשן הקבוצתי לא זמין' }, { status: 409 });
      }

      if (groupSession.businessId !== businessId || groupSession.serviceId !== serviceId) {
        return NextResponse.json({ error: 'הסשן הקבוצתי לא זמין' }, { status: 409 });
      }

      if (groupSession.startAt < earliestBookable) {
        return NextResponse.json(
          { error: `יש לקבוע תור לפחות ${minAdvanceHours} שעות מראש` },
          { status: 400 }
        );
      }

      if (groupSession.currentCount >= groupSession.maxParticipants) {
        return NextResponse.json({ error: 'הסשן מלא' }, { status: 409 });
      }

      // Find or create customer
      let customer = await prisma.customer.findFirst({
        where: { businessId, phone: customerPhone },
      });

      if (!customer) {
        const [firstName, ...lastNameParts] = customerName.split(' ');
        customer = await prisma.customer.create({
          data: {
            businessId,
            firstName,
            lastName: lastNameParts.join(' ') || firstName,
            phone: customerPhone,
            email: customerEmail,
            notes,
          },
        });
      }

      const confirmationCode = generateConfirmationCode();

      const [appointment] = await prisma.$transaction([
        prisma.appointment.create({
          data: {
            businessId,
            branchId: groupSession.branchId,
            serviceId: groupSession.serviceId,
            staffId: groupSession.staffId,
            customerId: customer.id,
            groupSessionId,
            startAt: groupSession.startAt,
            endAt: groupSession.endAt,
            status: 'confirmed',
            priceCents: service.priceCents,
            paymentStatus: 'not_required',
            confirmationCode,
            notesCustomer: notes,
            source: 'public',
          },
        }),
        prisma.groupSession.update({
          where: { id: groupSessionId },
          data: {
            currentCount: { increment: 1 },
            ...(groupSession.currentCount + 1 >= groupSession.maxParticipants && { status: 'full' }),
          },
        }),
      ]);

      const periodMonth = new Date(groupSession.startAt.getFullYear(), groupSession.startAt.getMonth(), 1);
      await prisma.usageCounter.upsert({
        where: { businessId_periodMonth: { businessId, periodMonth } },
        create: { businessId, periodMonth, appointmentsCount: 1 },
        update: { appointmentsCount: { increment: 1 } },
      });

      sendBookingConfirmation(appointment.id).catch(console.error);

      await prisma.dashboardNotification.create({
        data: {
          businessId,
          appointmentId: appointment.id,
          customerId: customer.id,
          type: 'new_appointment',
          title: 'הרשמה חדשה לסשן קבוצתי',
          message: `${customerName} נרשם/ה ל${service.name}`,
          read: false,
        },
      });

      sendPushToBusinessOwner(
        businessId,
        '👥 הרשמה חדשה לסשן קבוצתי!',
        `${customerName} נרשם/ה ל${service.name}`,
        { type: 'new_appointment', appointmentId: appointment.id }
      ).catch(console.error);

      return NextResponse.json({
        success: true,
        confirmationCode,
        appointmentId: appointment.id,
      });
    }

    // --- Standard (non-group) booking below ---

    const startAt = zonedWallTimeToUtc(date, time, businessTz);
    const endAt = addMinutes(startAt, service.durationMin + (service.bufferAfterMin || 0));

    if (startAt < earliestBookable) {
      return NextResponse.json(
        { error: `יש לקבוע תור לפחות ${minAdvanceHours} שעות מראש` },
        { status: 400 }
      );
    }

    // Check for business-wide time-off (holidays)
    const businessTimeOff = await prisma.timeOff.findFirst({
      where: {
        businessId,
        scope: 'business',
        startAt: { lte: endAt },
        endAt: { gte: startAt },
      },
    });

    if (businessTimeOff) {
      return NextResponse.json(
        { error: 'העסק לא פעיל בתאריך זה' },
        { status: 409 }
      );
    }

    if (branchId) {
      const branchTimeOff = await prisma.timeOff.findFirst({
        where: {
          branchId,
          scope: 'branch',
          startAt: { lte: endAt },
          endAt: { gte: startAt },
        },
      });

      if (branchTimeOff) {
        return NextResponse.json(
          { error: 'הסניף לא פעיל בתאריך זה' },
          { status: 409 }
        );
      }
    }

    if (staffId) {
      const staffTimeOff = await prisma.timeOff.findFirst({
        where: {
          staffId,
          scope: 'staff',
          startAt: { lte: endAt },
          endAt: { gte: startAt },
        },
      });

      if (staffTimeOff) {
        return NextResponse.json(
          { error: 'העובד אינו זמין בתאריך זה' },
          { status: 409 }
        );
      }

      const dayOfWeek = weekdayInTimeZone(startAt, businessTz);
      const appointmentTime = formatTimeInZone(startAt, businessTz);
      const appointmentEndTime = formatTimeInZone(endAt, businessTz);

      const conflictingBreak = await prisma.staffBreak.findFirst({
        where: {
          staffId,
          weekday: dayOfWeek,
          active: true,
          AND: [
            { startTime: { lt: appointmentEndTime } },
            { endTime: { gt: appointmentTime } },
          ],
        },
      });

      if (conflictingBreak) {
        return NextResponse.json(
          { error: 'העובד בהפסקה בשעה זו' },
          { status: 409 }
        );
      }
    }

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        businessId,
        ...(staffId && { staffId }),
        status: {
          notIn: ['canceled'],
        },
        OR: [
          {
            AND: [
              { startAt: { lte: startAt } },
              { endAt: { gt: startAt } },
            ],
          },
          {
            AND: [
              { startAt: { lt: endAt } },
              { endAt: { gte: endAt } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'השעה הזו כבר תפוסה, אנא בחר שעה אחרת' },
        { status: 409 }
      );
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        businessId,
        phone: customerPhone,
      },
    });

    if (!customer) {
      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      customer = await prisma.customer.create({
        data: {
          businessId,
          firstName,
          lastName,
          phone: customerPhone,
          email: customerEmail,
          notes,
        },
      });
    }

    // Create appointment
    const confirmationCode = generateConfirmationCode();
    
    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        branchId,
        serviceId,
        staffId,
        customerId: customer.id,
        startAt,
        endAt,
        status: 'confirmed',
        priceCents: service.priceCents,
        paymentStatus: 'not_required',
        confirmationCode,
        notesCustomer: notes,
        source: 'public',
      },
    });

    // Update usage counter
    const periodMonth = new Date(startAt.getFullYear(), startAt.getMonth(), 1);
    await prisma.usageCounter.upsert({
      where: {
        businessId_periodMonth: {
          businessId,
          periodMonth,
        },
      },
      create: {
        businessId,
        periodMonth,
        appointmentsCount: 1,
      },
      update: {
        appointmentsCount: {
          increment: 1,
        },
      },
    });

    // Send confirmation notifications (async)
    sendBookingConfirmation(appointment.id).catch((error) => {
      console.error('Error sending booking confirmation:', error);
    });

    // Create dashboard notification
    await prisma.dashboardNotification.create({
      data: {
        businessId,
        appointmentId: appointment.id,
        customerId: customer.id,
        type: 'new_appointment',
        title: 'תור חדש נקבע',
        message: `${customerName} קבע תור ל${service.name} בתאריך ${new Date(startAt).toLocaleDateString('he-IL')} בשעה ${time}`,
        read: false,
      },
    });

    // Send push notification to business owner
    sendPushToBusinessOwner(
      businessId,
      '📅 תור חדש נקבע!',
      `${customerName} קבע תור ל${service.name} בתאריך ${new Date(startAt).toLocaleDateString('he-IL')} בשעה ${time}`,
      { type: 'new_appointment', appointmentId: appointment.id }
    ).catch((error) => {
      console.error('Error sending push notification:', error);
    });

    return NextResponse.json({
      success: true,
      confirmationCode,
      appointmentId: appointment.id,
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת התור' },
      { status: 500 }
    );
  }
}

