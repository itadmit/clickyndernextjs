import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMultiChannelNotification } from '@/lib/notifications/notification-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const confirmation = await prisma.appointmentConfirmation.findUnique({
      where: { confirmationToken: params.token },
      include: {
        appointment: {
          include: {
            customer: true,
            service: true,
            staff: true,
            branch: true,
            business: { select: { id: true, name: true, primaryColor: true } },
          },
        },
      },
    });

    if (!confirmation) {
      return NextResponse.json({ error: 'בקשת אישור לא נמצאה' }, { status: 404 });
    }

    if (new Date() > confirmation.expiresAt) {
      await prisma.appointmentConfirmation.update({
        where: { id: confirmation.id },
        data: { status: 'expired' },
      });
      return NextResponse.json({ error: 'בקשת האישור פגת תוקף', expired: true }, { status: 410 });
    }

    const apt = confirmation.appointment;

    return NextResponse.json({
      status: confirmation.status,
      appointment: {
        date: apt.startAt,
        formattedDate: apt.startAt.toLocaleDateString('he-IL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        time: apt.startAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        serviceName: apt.service.name,
        staffName: apt.staff?.name || null,
        branchName: apt.branch?.name || null,
        customerName: `${apt.customer.firstName} ${apt.customer.lastName}`,
      },
      business: {
        name: apt.business.name,
        primaryColor: apt.business.primaryColor || '#0284c7',
      },
    });
  } catch (error) {
    console.error('Error fetching confirmation:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת הנתונים' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { action } = await req.json();

    const confirmation = await prisma.appointmentConfirmation.findUnique({
      where: { confirmationToken: params.token },
      include: {
        appointment: {
          include: {
            customer: true,
            service: true,
            staff: true,
            branch: true,
            business: true,
          },
        },
      },
    });

    if (!confirmation) {
      return NextResponse.json({ error: 'בקשת אישור לא נמצאה' }, { status: 404 });
    }

    if (new Date() > confirmation.expiresAt) {
      await prisma.appointmentConfirmation.update({
        where: { id: confirmation.id },
        data: { status: 'expired' },
      });
      return NextResponse.json({ error: 'בקשת האישור פגת תוקף' }, { status: 410 });
    }

    if (confirmation.status !== 'pending') {
      return NextResponse.json({ error: 'בקשת האישור כבר טופלה' }, { status: 400 });
    }

    const apt = confirmation.appointment;
    const appointmentInfo = {
      date: apt.startAt,
      formattedDate: apt.startAt.toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      time: apt.startAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      serviceName: apt.service.name,
      staffName: apt.staff?.name || null,
      businessName: apt.business.name,
    };

    if (action === 'confirm') {
      await prisma.appointmentConfirmation.update({
        where: { id: confirmation.id },
        data: { status: 'confirmed', confirmedAt: new Date() },
      });

      await prisma.dashboardNotification.create({
        data: {
          businessId: apt.businessId,
          appointmentId: apt.id,
          customerId: apt.customerId,
          type: 'appointment_confirmed',
          title: '✅ לקוח אישר הגעה',
          message: `${apt.customer.firstName} ${apt.customer.lastName} אישר/ה הגעה לתור ב-${apt.startAt.toLocaleDateString('he-IL')}`,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'confirmed',
        message: 'תודה! אישרת את הגעתך לתור',
        appointment: appointmentInfo,
      });
    } else if (action === 'cancel') {
      await prisma.$transaction([
        prisma.appointmentConfirmation.update({
          where: { id: confirmation.id },
          data: { status: 'canceled', canceledAt: new Date() },
        }),
        prisma.appointment.update({
          where: { id: apt.id },
          data: { status: 'canceled', canceledAt: new Date() },
        }),
        prisma.dashboardNotification.create({
          data: {
            businessId: apt.businessId,
            appointmentId: apt.id,
            customerId: apt.customerId,
            type: 'appointment_canceled',
            title: '❌ לקוח ביטל תור',
            message: `${apt.customer.firstName} ${apt.customer.lastName} ביטל/ה תור ל-${apt.startAt.toLocaleDateString('he-IL')}`,
          },
        }),
      ]);

      // שליחת הודעת ביטול ללקוח
      try {
        const cancelChannels: ('whatsapp' | 'sms' | 'email')[] = [];
        const cancelRecipient: { phone?: string; email?: string } = {};
        if (apt.customer.phone) {
          cancelChannels.push('whatsapp');
          cancelRecipient.phone = apt.customer.phone;
        }
        if (apt.customer.email) {
          cancelChannels.push('email');
          cancelRecipient.email = apt.customer.email;
        }
        if (cancelChannels.length > 0) {
          await sendMultiChannelNotification(
            apt.businessId,
            'booking_canceled',
            cancelChannels,
            cancelRecipient,
            {
              customer_name: `${apt.customer.firstName} ${apt.customer.lastName}`,
              business_name: apt.business.name,
              service_name: apt.service.name,
              staff_name: apt.staff?.name || '',
              appointment_date: apt.startAt.toLocaleDateString('he-IL'),
              appointment_time: apt.startAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            },
            apt.id,
            apt.customerId
          );
        }
      } catch (e) {
        console.error('Failed to send cancel notification:', e);
      }

      return NextResponse.json({
        success: true,
        action: 'canceled',
        message: 'התור בוטל בהצלחה',
        appointment: appointmentInfo,
      });
    }

    return NextResponse.json({ error: 'פעולה לא חוקית' }, { status: 400 });
  } catch (error) {
    console.error('Error handling attendance confirmation:', error);
    return NextResponse.json({ error: 'שגיאה בעיבוד הבקשה' }, { status: 500 });
  }
}
