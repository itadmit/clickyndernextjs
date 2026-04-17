import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushToBusinessOwner } from '@/lib/notifications/push-service';
import { sendAppointmentReminder, sendMultiChannelNotification } from '@/lib/notifications/notification-service';
import { sendWhatsAppMessage } from '@/lib/notifications/rappelsend';

/**
 * Cron job לשליחת תזכורות והתראות
 * 
 * צריך להפעיל כל 15 דקות או כל שעה
 * 
 * דוגמה עם crontab (להריץ כל 15 דקות):
 * curl -X POST https://clickynder.com/api/cron/send-reminders -H "Authorization: Bearer YOUR_SECRET_KEY"
 */
export async function POST(req: NextRequest) {
  try {
    // אימות (להגנה על ה-endpoint)
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_KEY;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      reminders: 0,
      confirmations: 0,
      errors: 0,
    };

    // 1. מצא כל העסקים עם הגדרות תזכורות
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { reminderEnabled: true },
          { confirmationEnabled: true },
        ],
      },
      select: {
        id: true,
        name: true,
        reminderEnabled: true,
        reminderHoursBefore: true,
        confirmationEnabled: true,
        confirmationHoursBefore: true,
      },
    });

    for (const business of businesses) {
      try {
        // 2. תזכורות רגילות
        if (business.reminderEnabled) {
          const reminderTime = new Date(now);
          reminderTime.setHours(reminderTime.getHours() + business.reminderHoursBefore);

          // מצא תורים שצריכים תזכורת
          const appointmentsForReminder = await prisma.appointment.findMany({
            where: {
              businessId: business.id,
              status: 'confirmed',
              startAt: {
                gte: reminderTime,
                lte: new Date(reminderTime.getTime() + 60 * 60 * 1000), // תוך שעה מהזמן המתוזמן
              },
            },
            include: {
              customer: true,
              service: true,
              staff: true,
              branch: true,
              business: true,
              notifications: {
                where: {
                  event: 'booking_reminder',
                  sentAt: {
                    gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // ב-24 שעות האחרונות
                  },
                },
              },
            },
          });

          // סנן תורים שכבר נשלחה להם תזכורת לאחרונה
          const filteredAppointments = appointmentsForReminder.filter(
            (apt) => apt.notifications.length === 0
          );

          // שלח תזכורת לכל תור
          for (const appointment of filteredAppointments) {
            try {
              const sent = await sendAppointmentReminder(appointment.id);
              
              if (sent) {
                const aptTime = appointment.startAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
                const aptDate = appointment.startAt.toLocaleDateString('he-IL');
                sendPushToBusinessOwner(
                  business.id,
                  '⏰ תזכורת - תור בקרוב',
                  `ל${appointment.customer.firstName} ${appointment.customer.lastName} יש תור ל${appointment.service.name} ב-${aptDate} ${aptTime}`,
                  { type: 'reminder', appointmentId: appointment.id }
                ).catch((err) => console.error('Push reminder error:', err));

                results.reminders++;
                console.log(`✅ Reminder sent for appointment ${appointment.id}`);
              } else {
                console.warn(`⚠️ Reminder not sent for appointment ${appointment.id}`);
              }
            } catch (error) {
              console.error(`❌ Failed to send reminder for appointment ${appointment.id}:`, error);
              results.errors++;
            }
          }
        }

        // 3. אישורי הגעה
        if (business.confirmationEnabled) {
          const confirmationTime = new Date(now);
          confirmationTime.setHours(confirmationTime.getHours() + business.confirmationHoursBefore);

          // מצא תורים שצריכים אישור הגעה
          const appointmentsForConfirmation = await prisma.appointment.findMany({
            where: {
              businessId: business.id,
              status: 'confirmed',
              startAt: {
                gte: confirmationTime,
                lte: new Date(confirmationTime.getTime() + 60 * 60 * 1000), // תוך שעה
              },
            },
            include: {
              customer: true,
              service: true,
              staff: true,
              branch: true,
              business: true,
              confirmations: {
                where: {
                  createdAt: {
                    gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          });

          // סנן תורים שכבר נשלחה להם בקשת אישור
          const filteredConfirmations = appointmentsForConfirmation.filter(
            (apt) => apt.confirmations.length === 0
          );

          // שלח בקשת אישור לכל תור
          for (const appointment of filteredConfirmations) {
            try {
              // צור token אישור
              const confirmationToken = `conf_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
              
              // יצירת רשומת אישור
              const confirmation = await prisma.appointmentConfirmation.create({
                data: {
                  appointmentId: appointment.id,
                  confirmationToken,
                  expiresAt: new Date(appointment.startAt.getTime() - 60 * 60 * 1000), // שעה לפני התור
                },
              });

              // שלח הודעת אישור
              const baseUrl = process.env.NEXTAUTH_URL || 'https://clickynder.com';
              const confirmLink = `${baseUrl}/confirm-attendance/${confirmationToken}?action=confirm`;
              const cancelLink = `${baseUrl}/confirm-attendance/${confirmationToken}?action=cancel`;

              // שלח הודעה עם הלינקים
              const channels: ('whatsapp' | 'sms' | 'email')[] = [];
              const recipient: { phone?: string; email?: string } = {};

              if (appointment.customer.phone) {
                channels.push('whatsapp');
                recipient.phone = appointment.customer.phone;
              }

              if (appointment.customer.email) {
                channels.push('email');
                recipient.email = appointment.customer.email;
              }

              if (channels.length > 0) {
                const variables = {
                  business_name: appointment.business.name,
                  customer_name: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
                  service_name: appointment.service.name,
                  staff_name: appointment.staff?.name || '',
                  branch_name: appointment.branch?.name || '',
                  appointment_date: appointment.startAt.toLocaleDateString('he-IL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                  appointment_time: appointment.startAt.toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  confirm_link: confirmLink,
                  cancel_link: cancelLink,
                };

                // קבל את התבנית
                const template = await prisma.notificationTemplate.findFirst({
                  where: {
                    businessId: business.id,
                    channel: 'whatsapp',
                    event: 'appointment_confirmation',
                  },
                });

                if (channels.length > 0) {
                  await sendMultiChannelNotification(
                    business.id,
                    'appointment_confirmation' as any,
                    channels,
                    recipient,
                    variables,
                    appointment.id,
                    appointment.customerId
                  );
                  results.confirmations++;
                  console.log(`✅ Confirmation request sent for appointment ${appointment.id}`);
                }
              }
            } catch (error) {
              console.error(`❌ Failed to send confirmation for appointment ${appointment.id}:`, error);
              results.errors++;
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing business ${business.id}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint למידע על ה-cron
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Reminders Cron Job Endpoint',
    usage: 'POST with Authorization: Bearer YOUR_SECRET_KEY',
    schedule: 'Run every 15-60 minutes',
    example: 'curl -X POST https://clickynder.com/api/cron/send-reminders -H "Authorization: Bearer YOUR_SECRET_KEY"',
  });
}

