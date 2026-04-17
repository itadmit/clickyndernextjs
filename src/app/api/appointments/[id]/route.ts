import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendPushToBusinessOwner } from '@/lib/notifications/push-service';
import { checkAndOfferWaitlist } from '@/lib/waitlist-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: {
        ownerUserId: session.user.id,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
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
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...appointment,
      business: {
        currency: business.currency,
      },
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: {
        ownerUserId: session.user.id,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, notesInternal, notesCustomer, skipPolicyCheck } = body;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Cancellation policy enforcement
    let cancellationFee = null;
    if (status === 'canceled' && business.cancellationPolicyEnabled && !skipPolicyCheck) {
      const hoursUntilAppointment = (appointment.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilAppointment < business.cancellationDeadlineHours) {
        const feePercentage = business.cancellationFeePercentage || 0;
        if (feePercentage > 0 && appointment.priceCents) {
          cancellationFee = Math.round(appointment.priceCents * feePercentage / 100);
        }
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(notesInternal !== undefined && { notesInternal }),
        ...(notesCustomer !== undefined && { notesCustomer }),
        ...(status === 'canceled' && { canceledAt: new Date() }),
      },
      include: {
        customer: true,
        service: true,
        staff: true,
        branch: true,
      },
    });

    // Create dashboard notification for canceled appointment
    if (status === 'canceled') {
      await prisma.dashboardNotification.create({
        data: {
          businessId: business.id,
          appointmentId: updatedAppointment.id,
          customerId: updatedAppointment.customerId,
          type: 'cancelled_appointment',
          title: 'תור בוטל',
          message: `תור של ${updatedAppointment.customer.firstName} ${updatedAppointment.customer.lastName} ל${updatedAppointment.service.name} בוטל`,
          read: false,
        },
      });

      sendPushToBusinessOwner(
        business.id,
        '❌ תור בוטל',
        `תור של ${updatedAppointment.customer.firstName} ${updatedAppointment.customer.lastName} ל${updatedAppointment.service.name} בוטל`,
        { type: 'cancelled_appointment', appointmentId: updatedAppointment.id }
      ).catch((err) => console.error('Push error:', err));

      // If group session, decrement count
      if (updatedAppointment.groupSessionId) {
        await prisma.groupSession.update({
          where: { id: updatedAppointment.groupSessionId },
          data: {
            currentCount: { decrement: 1 },
            status: 'open',
          },
        });
      }

      checkAndOfferWaitlist(business.id, updatedAppointment.serviceId, updatedAppointment.staffId).catch(console.error);
    }

    return NextResponse.json({ ...updatedAppointment, cancellationFee });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: {
        ownerUserId: session.user.id,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Soft delete by setting status to canceled
    const deletedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
      include: {
        customer: true,
        service: true,
      },
    });

    // Create dashboard notification
    await prisma.dashboardNotification.create({
      data: {
        businessId: business.id,
        appointmentId: deletedAppointment.id,
        customerId: deletedAppointment.customerId,
        type: 'cancelled_appointment',
        title: 'תור נמחק',
        message: `תור של ${deletedAppointment.customer.firstName} ${deletedAppointment.customer.lastName} ל${deletedAppointment.service.name} נמחק`,
        read: false,
      },
    });

    sendPushToBusinessOwner(
      business.id,
      '🗑️ תור נמחק',
      `תור של ${deletedAppointment.customer.firstName} ${deletedAppointment.customer.lastName} ל${deletedAppointment.service.name} נמחק`,
      { type: 'cancelled_appointment', appointmentId: deletedAppointment.id }
    ).catch((err) => console.error('Push error:', err));

    if (deletedAppointment.groupSessionId) {
      await prisma.groupSession.update({
        where: { id: deletedAppointment.groupSessionId },
        data: { currentCount: { decrement: 1 }, status: 'open' },
      });
    }

    checkAndOfferWaitlist(business.id, deletedAppointment.serviceId, appointment.staffId).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}

