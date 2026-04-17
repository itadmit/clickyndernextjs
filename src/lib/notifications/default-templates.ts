/**
 * Default Notification Templates
 * יצירת תבניות התראה ברירת מחדל לעסק חדש
 */

import { prisma } from '@/lib/prisma';

export async function createDefaultNotificationTemplates(businessId: string) {
  const existing = await prisma.notificationTemplate.count({ where: { businessId } });
  if (existing > 0) return;

  const whatsappTemplates = [
    {
      businessId,
      channel: 'whatsapp' as const,
      event: 'booking_confirmed' as const,
      subject: null,
      body: `שלום {customer_name}! 👋\n\nהתור שלך אושר בהצלחה! 🎉\n\n📅 תאריך: {appointment_date}\n🕒 שעה: {appointment_time}\n💈 שירות: {service_name}\n👤 מטפל/ת: {staff_name}\n🏢 {business_name}\n\nנשמח לראותך! 😊`,
      active: true,
    },
    {
      businessId,
      channel: 'whatsapp' as const,
      event: 'booking_reminder' as const,
      subject: null,
      body: `היי {customer_name}! 🔔\n\nתזכורת: יש לך תור מחר!\n\n📅 תאריך: {appointment_date}\n🕒 שעה: {appointment_time}\n💈 שירות: {service_name}\n👤 מטפל/ת: {staff_name}\n\n👉 לאישור או ביטול התור:\n{confirm_link}\n\nנתראה! 🙂\n{business_name}`,
      active: true,
    },
    {
      businessId,
      channel: 'whatsapp' as const,
      event: 'booking_canceled' as const,
      subject: null,
      body: `שלום {customer_name},\n\nהתור שלך בוטל בהצלחה.\n\n📅 תאריך שבוטל: {appointment_date}\n🕒 שעה: {appointment_time}\n💈 שירות: {service_name}\n\nאנחנו כאן אם תרצה לקבוע תור חדש 😊\n\n{business_name}`,
      active: true,
    },
    {
      businessId,
      channel: 'whatsapp' as const,
      event: 'booking_rescheduled' as const,
      subject: null,
      body: `שלום {customer_name}! 📅\n\nהתור שלך עודכן בהצלחה!\n\nמועד חדש:\n📅 תאריך: {appointment_date}\n🕒 שעה: {appointment_time}\n💈 שירות: {service_name}\n👤 מטפל/ת: {staff_name}\n\nנתראה! 🙂\n{business_name}`,
      active: true,
    },
    {
      businessId,
      channel: 'whatsapp' as const,
      event: 'admin_new_booking' as const,
      subject: null,
      body: `🔔 תור חדש התקבל!\n\n👤 לקוח: {customer_name}\n📅 תאריך: {appointment_date}\n🕒 שעה: {appointment_time}\n💈 שירות: {service_name}\n👨‍💼 מטפל/ת: {staff_name}\n\n{business_name}`,
      active: true,
    },
    {
      businessId,
      channel: 'whatsapp' as const,
      event: 'appointment_edit_request' as const,
      subject: null,
      body: `היי {customer_name}! 📝\n\nיש לנו בקשה לשינוי בתור שלך:\n\n🔴 מועד ישן:\n📅 {old_date}\n🕒 {old_time}\n\n🟢 מועד חדש מוצע:\n📅 {new_date}\n🕒 {new_time}\n💈 שירות: {service_name}\n👤 מטפל/ת: {staff_name}\n\n⏰ לחץ על הקישור לאישור או דחיה:\n{confirmation_link}\n\n{business_name}`,
      active: true,
    },
  ];

  const emailTemplates = [
    {
      businessId,
      channel: 'email' as const,
      event: 'booking_confirmed' as const,
      subject: 'אישור תור - {business_name}',
      body: buildEmailTemplate(
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        '✅ התור אושר בהצלחה!',
        '#667eea',
        'שלום <strong>{customer_name}</strong>,',
        'התור שלך אושר בהצלחה! נשמח לראותך.',
        '#f8f9fa',
        'פרטי התור:',
        true,
      ),
      active: false,
    },
    {
      businessId,
      channel: 'email' as const,
      event: 'booking_reminder' as const,
      subject: '🔔 תזכורת לתור מחר - {business_name}',
      body: buildEmailTemplate(
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        '🔔 תזכורת לתור',
        '#856404',
        'היי <strong>{customer_name}</strong>,',
        'רצינו להזכיר לך שיש לך תור מחר!',
        '#fff3cd',
        'פרטי התור:',
        true,
      ),
      active: false,
    },
    {
      businessId,
      channel: 'email' as const,
      event: 'booking_canceled' as const,
      subject: 'ביטול תור - {business_name}',
      body: buildEmailTemplate(
        'linear-gradient(135deg, #868f96 0%, #596164 100%)',
        'ביטול תור',
        '#868f96',
        'שלום <strong>{customer_name}</strong>,',
        'התור שלך בוטל בהצלחה.',
        '#f8f9fa',
        'פרטי התור שבוטל:',
        false,
      ),
      active: false,
    },
    {
      businessId,
      channel: 'email' as const,
      event: 'booking_rescheduled' as const,
      subject: 'שינוי מועד תור - {business_name}',
      body: buildEmailTemplate(
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        '📅 התור עודכן!',
        '#0c5460',
        'שלום <strong>{customer_name}</strong>,',
        'התור שלך עודכן בהצלחה למועד חדש.',
        '#d1ecf1',
        'המועד החדש:',
        true,
      ),
      active: false,
    },
    {
      businessId,
      channel: 'email' as const,
      event: 'admin_new_booking' as const,
      subject: '🔔 תור חדש התקבל - {business_name}',
      body: buildEmailTemplate(
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        '🔔 תור חדש!',
        '#155724',
        'התקבל תור חדש במערכת:',
        '',
        '#d4edda',
        'פרטי התור:',
        true,
        true,
      ),
      active: false,
    },
  ];

  await prisma.notificationTemplate.createMany({
    data: [...whatsappTemplates, ...emailTemplates],
  });
}

function buildEmailTemplate(
  headerGradient: string,
  headerTitle: string,
  accentColor: string,
  greeting: string,
  subGreeting: string,
  boxBg: string,
  boxTitle: string,
  showStaff: boolean,
  showCustomer: boolean = false,
): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Noto Sans Hebrew', 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0; direction: rtl; text-align: right;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); direction: rtl;">
    <div style="background: ${headerGradient}; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">${headerTitle}</h1>
    </div>
    <div style="padding: 30px; direction: rtl; text-align: right;">
      <p style="font-size: 18px; color: #333; direction: rtl; text-align: right;">${greeting}</p>
      ${subGreeting ? `<p style="font-size: 16px; color: #666; line-height: 1.6; direction: rtl; text-align: right;">${subGreeting}</p>` : ''}
      <div style="background: ${boxBg}; border-radius: 8px; padding: 20px; margin: 20px 0; direction: rtl; text-align: right;">
        <h2 style="color: ${accentColor}; margin-top: 0; font-size: 20px; direction: rtl; text-align: right;">${boxTitle}</h2>
        ${showCustomer ? '<p style="margin: 10px 0; font-size: 16px; direction: rtl; text-align: right;"><strong>👤 לקוח:</strong> {customer_name}</p>' : ''}
        <p style="margin: 10px 0; font-size: 16px; direction: rtl; text-align: right;"><strong>📅 תאריך:</strong> {appointment_date}</p>
        <p style="margin: 10px 0; font-size: 16px; direction: rtl; text-align: right;"><strong>🕒 שעה:</strong> {appointment_time}</p>
        <p style="margin: 10px 0; font-size: 16px; direction: rtl; text-align: right;"><strong>💈 שירות:</strong> {service_name}</p>
        ${showStaff ? '<p style="margin: 10px 0; font-size: 16px; direction: rtl; text-align: right;"><strong>👤 מטפל/ת:</strong> {staff_name}</p>' : ''}
      </div>
      <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; direction: rtl;">
        {business_name}<br/>הודעה זו נשלחה אוטומטית, אין צורך להשיב
      </p>
    </div>
  </div>
</body>
</html>`;
}
