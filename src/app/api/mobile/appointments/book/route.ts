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
      customerPackageId,
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

    // Validate customer package (if redeeming a session). Must belong to this customer,
    // be active, have remaining sessions, not expired, and (if scoped) match the service.
    let validatedCustomerPackage = null as null | { id: string };
    if (customerPackageId) {
      const cp = await prisma.customerPackage.findFirst({
        where: { id: customerPackageId, businessId: business.id, customerId: customer.id },
        include: { package: true },
      });
      if (!cp) {
        return NextResponse.json({ error: 'Customer package not found' }, { status: 404 });
      }
      if (cp.status !== 'active') {
        return NextResponse.json({ error: 'Customer package is not active' }, { status: 400 });
      }
      if (cp.sessionsRemaining <= 0) {
        return NextResponse.json({ error: 'No sessions remaining on this package' }, { status: 400 });
      }
      if (cp.expiresAt && cp.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Package expired' }, { status: 400 });
      }
      if (cp.package.serviceId && cp.package.serviceId !== serviceId) {
        return NextResponse.json({ error: 'Package does not cover this service' }, { status: 400 });
      }
      validatedCustomerPackage = { id: cp.id };
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        branchId: branchId || null,
        serviceId,
        staffId: staffId || null,
        customerId: customer.id,
        customerPackageId: validatedCustomerPackage?.id ?? null,
        startAt,
        endAt,
        status: 'confirmed',
        priceCents: service.priceCents,
        paymentStatus: validatedCustomerPackage ? 'paid' : 'not_required',
        confirmationCode,
        source,
        virtualMeetingUrl: service.isVirtual ? service.virtualMeetingUrl : null,
      },
    });

    // Decrement the package after the appointment exists. If this drops to zero,
    // mark the customer package as fully used.
    if (validatedCustomerPackage) {
      const updated = await prisma.customerPackage.update({
        where: { id: validatedCustomerPackage.id },
        data: { sessionsRemaining: { decrement: 1 } },
        select: { sessionsRemaining: true },
      });
      if (updated.sessionsRemaining <= 0) {
        await prisma.customerPackage.update({
          where: { id: validatedCustomerPackage.id },
          data: { status: 'used' },
        });
      }
    }

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

    // Google Calendar sync (fire-and-forget; never block the booking).
    (async () => {
      try {
        const { createCalendarEvent } = await import('@/lib/google-calendar');
        // Prefer staff-specific connection, fall back to business-wide
        const conn = staffId
          ? await prisma.googleCalendarConnection.findUnique({
              where: { staffId },
            })
          : null;
        const fallback = !conn
          ? await prisma.googleCalendarConnection.findFirst({
              where: { businessId: business.id, staffId: null, syncEnabled: true },
            })
          : null;
        const connection = conn?.syncEnabled ? conn : fallback;
        if (connection) {
          await createCalendarEvent(connection.id, connection.calendarId, {
            summary: `${service.name} — ${customer.firstName} ${customer.lastName}`,
            description: `${customer.phone}${customer.email ? ` · ${customer.email}` : ''}\nClickynder #${appointment.id}`,
            startISO: startAt.toISOString(),
            endISO: endAt.toISOString(),
            timeZone: businessTz,
          });
        }
      } catch (e) {
        console.error('Google Calendar sync failed:', e);
      }
    })();

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
