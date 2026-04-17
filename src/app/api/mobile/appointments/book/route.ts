/**
 * Mobile Book Appointment API
 * POST /api/mobile/appointments/book - Create a new appointment from mobile app
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { generateConfirmationCode, addMinutes } from '@/lib/utils';
import { sendBookingConfirmation } from '@/lib/notifications/notification-service';
import { sendPushToBusinessOwner } from '@/lib/notifications/push-service';
import { getEarliestBookableUtc, zonedWallTimeToUtc } from '@/lib/slot-zoned-time';

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
      date,
      time,
      customerId,
      customer: customerInput,
      source = 'admin',
    } = body;

    if (!serviceId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!customerId && (!customerInput?.firstName || !customerInput?.phone)) {
      return NextResponse.json(
        { error: 'Missing customer info: provide customerId or customer object with firstName and phone' },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.businessId !== business.id) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const slotPolicy = await prisma.slotPolicy.findUnique({
      where: { businessId: business.id },
    });
    const businessTz = business.timezone || 'Asia/Jerusalem';
    const minAdvanceHours = slotPolicy?.minimumAdvanceBookingHours ?? 2;
    const earliestBookable = getEarliestBookableUtc(minAdvanceHours);

    const startAt = zonedWallTimeToUtc(date, time, businessTz);
    const endAt = addMinutes(startAt, service.durationMin + (service.bufferAfterMin || 0));

    if (startAt < earliestBookable) {
      return NextResponse.json(
        { error: `יש לקבוע תור לפחות ${minAdvanceHours} שעות מראש` },
        { status: 400 }
      );
    }

    const businessTimeOff = await prisma.timeOff.findFirst({
      where: {
        businessId: business.id,
        scope: 'business',
        startAt: { lte: endAt },
        endAt: { gte: startAt },
      },
    });

    if (businessTimeOff) {
      return NextResponse.json({ error: 'העסק לא פעיל בתאריך זה' }, { status: 409 });
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
        return NextResponse.json({ error: 'העובד אינו זמין בתאריך זה' }, { status: 409 });
      }
    }

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        ...(staffId && { staffId }),
        status: { notIn: ['canceled'] },
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

    let customer;
    if (customerId) {
      customer = await prisma.customer.findFirst({
        where: { id: customerId, businessId: business.id },
      });
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
    } else {
      customer = await prisma.customer.findFirst({
        where: {
          businessId: business.id,
          phone: customerInput.phone,
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            businessId: business.id,
            firstName: customerInput.firstName,
            lastName: customerInput.lastName || customerInput.firstName,
            phone: customerInput.phone,
            email: customerInput.email || null,
          },
        });
      }
    }

    const confirmationCode = generateConfirmationCode();
    const customerName = customer.firstName + ' ' + customer.lastName;

    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        branchId: branchId || null,
        serviceId,
        staffId: staffId || null,
        customerId: customer.id,
        startAt,
        endAt,
        status: 'confirmed',
        priceCents: service.priceCents,
        paymentStatus: 'not_required',
        confirmationCode,
        source,
      },
    });

    await prisma.usageCounter.upsert({
      where: {
        businessId_periodMonth: {
          businessId: business.id,
          periodMonth: new Date(startAt.getFullYear(), startAt.getMonth(), 1),
        },
      },
      create: {
        businessId: business.id,
        periodMonth: new Date(startAt.getFullYear(), startAt.getMonth(), 1),
        appointmentsCount: 1,
      },
      update: {
        appointmentsCount: { increment: 1 },
      },
    });

    sendBookingConfirmation(appointment.id).catch((error) => {
      console.error('Error sending booking confirmation:', error);
    });

    await prisma.dashboardNotification.create({
      data: {
        businessId: business.id,
        appointmentId: appointment.id,
        customerId: customer.id,
        type: 'new_appointment',
        title: 'תור חדש נוצר',
        message: customerName + ' - ' + service.name + ' בתאריך ' + new Date(startAt).toLocaleDateString('he-IL') + ' בשעה ' + time,
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      confirmationCode,
      appointmentId: appointment.id,
    });
  } catch (error) {
    console.error('Error booking mobile appointment:', error);
    return NextResponse.json({ error: 'אירעה שגיאה ביצירת התור' }, { status: 500 });
  }
}
