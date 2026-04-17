/**
 * User Registration API
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail } from '@/lib/notifications/email-service';
import { createDefaultBusinessData } from '@/lib/create-default-business';

const registerSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים').optional(), // אופציונלי למשתמשי Google
  phone: z.string().min(9, 'מספר טלפון לא תקין').optional(), // אופציונלי למשתמשי Google - יושלם בדף ההשלמה
  businessSlug: z.string()
    .min(3, 'כתובת אתר חייבת להכיל לפחות 3 תווים')
    .regex(/^[a-z0-9-]+$/, 'כתובת אתר יכולה להכיל רק אותיות אנגליות קטנות, מספרים ומקפים'),
  businessAddress: z.string().min(5, 'כתובת העסק חייבת להכיל לפחות 5 תווים'),
  city: z.string().min(2, 'שם העיר חייב להכיל לפחות 2 תווים'),
}).refine((data) => {
  // אם יש סיסמה, היא חייבת להיות לפחות 6 תווים
  if (data.password) {
    return data.password.length >= 6;
  }
  return true; // אם אין סיסמה (משתמש Google), זה בסדר
}, {
  message: 'סיסמה חייבת להכיל לפחות 6 תווים',
  path: ['password'],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // ולידציה
    const validatedData = registerSchema.parse(body);

    // נרמול אימייל - תמיד lowercase
    validatedData.email = validatedData.email.toLowerCase().trim();

    // בדיקה אם המשתמש כבר קיים
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      // בדוק אם יש לו Google account דרך PrismaAdapter
      // PrismaAdapter שומר accounts בטבלת Account נפרדת
      const googleAccount = await (prisma as any).account?.findFirst({
        where: { 
          userId: existingUser.id,
          provider: 'google'
        }
      }).catch(() => null);

      // אם למשתמש יש Google account, עדכן אותו עם הטלפון והעסק
      if (googleAccount) {
        // עדכן את הטלפון אם חסר
        if (!existingUser.phone && validatedData.phone) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { phone: validatedData.phone },
          });
        }
        
        // בדוק אם יש עסק, אם לא - יצור אותו
        let business = await prisma.business.findFirst({
          where: { ownerUserId: existingUser.id },
        });

        if (!business) {
          // בדוק אם ה-slug כבר קיים
          const existingBusiness = await prisma.business.findUnique({
            where: { slug: validatedData.businessSlug },
          });

          if (existingBusiness) {
            return NextResponse.json(
              { error: 'כתובת האתר הזאת כבר תפוסה. אנא בחר כתובת אחרת' },
              { status: 400 }
            );
          }

          // יצור עסק
          business = await prisma.business.create({
            data: {
              ownerUserId: existingUser.id,
              name: validatedData.city,
              slug: validatedData.businessSlug,
              address: validatedData.businessAddress,
              phone: validatedData.phone || null,
              email: validatedData.email,
              timezone: 'Asia/Jerusalem',
              locale: 'he-IL',
              showStaff: true,
              showBranches: false,
              onlinePaymentEnabled: false,
              templateStyle: 'modern',
              primaryColor: '#3b82f6',
              secondaryColor: '#758dff',
              backgroundColorStart: '#dbeafe',
              backgroundColorEnd: '#faf5ff',
              font: 'Noto Sans Hebrew',
            },
          });

          // יצירת נתונים בסיסיים (כמו בהרשמה רגילה)
          await createDefaultBusinessData(business.id, validatedData);
        }

        return NextResponse.json({
          success: true,
          user: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
          },
          business: business,
        });
      }

      return NextResponse.json(
        { error: 'משתמש עם אימייל זה כבר קיים' },
        { status: 400 }
      );
    }

    // הצפנת סיסמה (רק אם יש סיסמה)
    const passwordHash = validatedData.password 
      ? await hash(validatedData.password, 12) 
      : null;

    // בדיקה אם ה-slug כבר קיים
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: validatedData.businessSlug },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'כתובת האתר הזאת כבר תפוסה. אנא בחר כתובת אחרת' },
        { status: 400 }
      );
    }

    // יצירת משתמש ועסק בטרנזקציה
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        ...(passwordHash && { passwordHash }), // הוסף רק אם יש סיסמה
        ownedBusinesses: {
          create: {
            name: validatedData.city, // שם העיר כשם העסק
            slug: validatedData.businessSlug,
            address: validatedData.businessAddress,
            phone: validatedData.phone || null, // טלפון מפרטי המשתמש
            email: validatedData.email, // אימייל מפרטי המשתמש
            timezone: 'Asia/Jerusalem',
            locale: 'he-IL',
            showStaff: true,
            showBranches: false,
            onlinePaymentEnabled: false,
            templateStyle: 'modern',
            primaryColor: '#3b82f6',
            secondaryColor: '#758dff',
            backgroundColorStart: '#dbeafe',
            backgroundColorEnd: '#faf5ff',
            font: 'Noto Sans Hebrew',
          },
        },
      },
      include: {
        ownedBusinesses: true,
      },
    });

    // יצירת הנתונים הבסיסיים (כולל תבניות התראה)
    if (user.ownedBusinesses[0]) {
      await createDefaultBusinessData(user.ownedBusinesses[0].id, validatedData);
    }

    // שליחת מייל ברוכים הבאים עם פרטי התחברות
    try {
      const dashboardUrl = `${process.env.NEXTAUTH_URL || 'https://clickynder.co.il'}/dashboard`;
      const bookingUrl = `${process.env.NEXTAUTH_URL || 'https://clickynder.co.il'}/${validatedData.businessSlug}`;
      const loginUrl = `${process.env.NEXTAUTH_URL || 'https://clickynder.co.il'}/auth/signin`;
      
      const welcomeEmailHtml = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ברוכים הבאים ל-Clickynder</title>
</head>
<body style="font-family: 'Noto Sans Hebrew', 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; direction: rtl; text-align: right;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px; direction: rtl;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">ברוכים הבאים!</h1>
      <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 18px;">החשבון שלך נוצר בהצלחה</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px; direction: rtl; text-align: right;">
      <p style="font-size: 18px; color: #333; margin-top: 0; direction: rtl; text-align: right;">שלום <strong>${validatedData.name}</strong>,</p>
      <p style="font-size: 16px; color: #666; line-height: 1.7; direction: rtl; text-align: right;">תודה שהצטרפת ל-Clickynder! אנחנו שמחים שבחרת בנו לניהול התורים שלך.</p>

      <!-- Login Details Box -->
      <div style="background: linear-gradient(135deg, #f8f9fe 0%, #fff5ff 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-right: 4px solid #667eea; direction: rtl; text-align: right;">
        <h2 style="color: #667eea; margin-top: 0; font-size: 20px; margin-bottom: 20px; direction: rtl; text-align: right;">פרטי ההתחברות שלך:</h2>
        <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px; direction: rtl; text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #666; direction: rtl; text-align: right;">אימייל:</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; color: #333; font-weight: bold; direction: rtl; text-align: right;">${validatedData.email}</p>
        </div>
        <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px; direction: rtl; text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #666; direction: rtl; text-align: right;">סיסמה:</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; color: #333; font-weight: bold; direction: rtl; text-align: right;">הסיסמה שהזנת בעת ההרשמה</p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #999; direction: rtl; text-align: right;">שכחת? השתמש באיפוס סיסמה</p>
        </div>
        <div style="background: white; border-radius: 8px; padding: 15px; direction: rtl; text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #666; direction: rtl; text-align: right;">כתובת דף התורים שלך:</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; color: #667eea; font-weight: bold; word-break: break-all; direction: ltr; text-align: left;">${bookingUrl}</p>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
          כניסה למערכת
        </a>
      </div>

      <!-- Mobile Apps Section -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #333; margin-top: 0; font-size: 18px; text-align: center; margin-bottom: 20px;">הורד את האפליקציה</h3>
        <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 20px;">נהל את התורים שלך בקלות מכל מקום</p>
        
        <div style="display: table; width: 100%; margin-top: 20px;">
          <!-- App Store -->
          <div style="display: table-cell; width: 50%; padding: 0 5px; text-align: center; vertical-align: top;">
            <a href="https://apps.apple.com/app/clickynder" style="display: inline-block; text-decoration: none;">
              <div style="background: white; border: 2px solid #e5e7eb; border-radius: 10px; padding: 15px; transition: all 0.3s;">
                <div style="color: #667eea; font-size: 24px; font-weight: bold; margin-bottom: 8px;">iOS</div>
                <div style="color: #333; font-size: 14px; font-weight: bold; margin-bottom: 4px;">App Store</div>
                <div style="color: #666; font-size: 12px;">עבור iPhone</div>
              </div>
            </a>
          </div>
          
          <!-- Google Play -->
          <div style="display: table-cell; width: 50%; padding: 0 5px; text-align: center; vertical-align: top;">
            <a href="https://play.google.com/store/apps/details?id=com.clickynder" style="display: inline-block; text-decoration: none;">
              <div style="background: white; border: 2px solid #e5e7eb; border-radius: 10px; padding: 15px; transition: all 0.3s;">
                <div style="color: #667eea; font-size: 24px; font-weight: bold; margin-bottom: 8px;">Android</div>
                <div style="color: #333; font-size: 14px; font-weight: bold; margin-bottom: 4px;">Google Play</div>
                <div style="color: #666; font-size: 12px;">עבור Android</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Features List -->
      <div style="margin: 30px 0; direction: rtl; text-align: right;">
        <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; direction: rtl; text-align: right;">מה אפשר לעשות עכשיו?</h3>
        <ul style="list-style: none; padding: 0; margin: 0; direction: rtl; text-align: right;">
          <li style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; direction: rtl; text-align: right;">
            <span style="color: #667eea; font-size: 18px; margin-left: 10px;">•</span>
            <span style="color: #666; font-size: 15px;">התאמה אישית של דף התורים</span>
          </li>
          <li style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; direction: rtl; text-align: right;">
            <span style="color: #667eea; font-size: 18px; margin-left: 10px;">•</span>
            <span style="color: #666; font-size: 15px;">הוספת שירותים ומחירים</span>
          </li>
          <li style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; direction: rtl; text-align: right;">
            <span style="color: #667eea; font-size: 18px; margin-left: 10px;">•</span>
            <span style="color: #666; font-size: 15px;">ניהול צוות העובדים</span>
          </li>
          <li style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; direction: rtl; text-align: right;">
            <span style="color: #667eea; font-size: 18px; margin-left: 10px;">•</span>
            <span style="color: #666; font-size: 15px;">הגדרת תזכורות אוטומטיות</span>
          </li>
          <li style="padding: 12px 0; direction: rtl; text-align: right;">
            <span style="color: #667eea; font-size: 18px; margin-left: 10px;">•</span>
            <span style="color: #666; font-size: 15px;">מעקב אחר נתונים וסטטיסטיקות</span>
          </li>
        </ul>
      </div>

      <!-- Support Section -->
      <div style="background: #fff9e6; border-radius: 10px; padding: 20px; margin: 30px 0; border-right: 3px solid #ffd700; direction: rtl; text-align: right;">
        <h3 style="color: #856404; margin-top: 0; font-size: 16px; margin-bottom: 10px; direction: rtl; text-align: right;">צריך עזרה?</h3>
        <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6; direction: rtl; text-align: right;">
          הצוות שלנו כאן לעזור! פנה אלינו בכל שאלה או בעיה והיינו שמחים לסייע.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; direction: rtl;">
      <p style="color: #999; font-size: 13px; margin: 0 0 10px 0; direction: rtl; text-align: center;">
        <strong style="color: #667eea; font-size: 16px;">Clickynder</strong><br/>
        מערכת ניהול תורים חכמה ופשוטה
      </p>
      <p style="color: #999; font-size: 12px; margin: 10px 0 0 0; direction: rtl; text-align: center;">
        הודעה זו נשלחה אוטומטית, אין צורך להשיב
      </p>
    </div>
  </div>
</body>
</html>`;

      await sendEmail({
        to: validatedData.email,
        subject: 'ברוכים הבאים ל-Clickynder - החשבון שלך מוכן!',
        body: `שלום ${validatedData.name},

תודה שהצטרפת ל-Clickynder!

פרטי ההתחברות שלך:
אימייל: ${validatedData.email}
דף התורים שלך: ${bookingUrl}

כניסה למערכת: ${loginUrl}

הורד את האפליקציה:
App Store: https://apps.apple.com/app/clickynder
Google Play: https://play.google.com/store/apps/details?id=com.clickynder

בברכה,
צוות Clickynder`,
        html: welcomeEmailHtml,
      });

      console.log('Welcome email sent to:', validatedData.email);
    } catch (emailError) {
      // לא נכשיל את הרישום אם המייל נכשל
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      business: user.ownedBusinesses[0],
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת החשבון' },
      { status: 500 }
    );
  }
}

