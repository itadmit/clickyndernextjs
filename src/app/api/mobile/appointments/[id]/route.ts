/**
 * Mobile Appointment Detail API
 * GET /api/mobile/appointments/:id - Get appointment details
 * PUT /api/mobile/appointments/:id - Update appointment (status, notes)
 * DELETE /api/mobile/appointments/:id - Cancel appointment (sets status to canceled)
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, getAuthenticatedBusiness } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { sendPushToBusinessOwner } from "@/lib/notifications/push-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
      include: {
        customer: true,
        service: true,
        staff: true,
        branch: true,
        intakeSubmissions: {
          include: {
            form: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: appointment.id,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      status: appointment.status,
      confirmationCode: appointment.confirmationCode,
      priceCents: appointment.priceCents,
      paymentStatus: appointment.paymentStatus,
      notesInternal: appointment.notesInternal,
      notesCustomer: appointment.notesCustomer,
      source: appointment.source,
      createdAt: appointment.createdAt,
      canceledAt: appointment.canceledAt,
      virtualMeetingUrl: appointment.virtualMeetingUrl,
      customer: {
        id: appointment.customer.id,
        firstName: appointment.customer.firstName,
        lastName: appointment.customer.lastName,
        phone: appointment.customer.phone,
        email: appointment.customer.email,
        notes: appointment.customer.notes,
      },
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
        durationMin: appointment.service.durationMin,
        priceCents: appointment.service.priceCents,
        color: appointment.service.color,
        description: appointment.service.description,
        isVirtual: appointment.service.isVirtual,
      },
      staff: appointment.staff
        ? {
            id: appointment.staff.id,
            name: appointment.staff.name,
            phone: appointment.staff.phone,
            calendarColor: appointment.staff.calendarColor,
          }
        : null,
      branch: appointment.branch
        ? {
            id: appointment.branch.id,
            name: appointment.branch.name,
            address: appointment.branch.address,
            phone: appointment.branch.phone,
          }
        : null,
      currency: business.currency,
    });
  } catch (error) {
    console.error("Error fetching mobile appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, notesInternal, notesCustomer } = body;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
      include: {
        customer: true,
        service: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(notesInternal !== undefined && { notesInternal }),
        ...(notesCustomer !== undefined && { notesCustomer }),
        ...(status === "canceled" && { canceledAt: new Date() }),
      },
      include: {
        customer: true,
        service: true,
        staff: true,
        branch: true,
      },
    });

    // יצירת התראה בדשבורד
    if (status === "canceled") {
      await prisma.dashboardNotification.create({
        data: {
          businessId: business.id,
          appointmentId: updatedAppointment.id,
          customerId: updatedAppointment.customerId,
          type: "cancelled_appointment",
          title: "תור בוטל",
          message: `תור של ${updatedAppointment.customer.firstName} ${updatedAppointment.customer.lastName} ל${updatedAppointment.service.name} בוטל על ידי בעל העסק`,
          read: false,
        },
      });
    }

    if (status === "completed") {
      await prisma.dashboardNotification.create({
        data: {
          businessId: business.id,
          appointmentId: updatedAppointment.id,
          customerId: updatedAppointment.customerId,
          type: "appointment_confirmed",
          title: "תור הושלם",
          message: `תור של ${updatedAppointment.customer.firstName} ${updatedAppointment.customer.lastName} ל${updatedAppointment.service.name} סומן כהושלם`,
          read: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating mobile appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
      include: {
        customer: true,
        service: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: "canceled",
        canceledAt: new Date(),
      },
      include: { customer: true, service: true },
    });

    await prisma.dashboardNotification.create({
      data: {
        businessId: business.id,
        appointmentId: updated.id,
        customerId: updated.customerId,
        type: "cancelled_appointment",
        title: "תור בוטל",
        message: `תור של ${updated.customer.firstName} ${updated.customer.lastName} ל${updated.service.name} בוטל על ידי בעל העסק`,
        read: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mobile appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
