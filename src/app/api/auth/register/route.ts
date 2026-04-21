/**
 * User Registration API
 * POST /api/auth/register
 * Phone + OTP based registration (no password)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createDefaultBusinessData } from '@/lib/create-default-business';
import { randomBytes } from 'crypto';

const registerSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  phone: z.string().min(9, 'מספר טלפון לא תקין'),
  verificationToken: z.string().min(1, 'טוקן אימות נדרש'),
  businessSlug: z.string()
    .min(3, 'כתובת אתר חייבת להכיל לפחות 3 תווים')
    .regex(/^[a-z0-9-]+$/, 'כתובת אתר יכולה להכיל רק אותיות אנגליות קטנות, מספרים ומקפים'),
  businessAddress: z.string().min(5, 'כתובת העסק חייבת להכיל לפחות 5 תווים'),
  city: z.string().min(2, 'שם העיר חייב להכיל לפחות 2 תווים'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Validate the verification token
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: validatedData.phone,
        token: validatedData.verificationToken,
        expires: { gte: new Date() },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'טוקן אימות לא תקין או פג תוקף. נא לאמת את הטלפון מחדש' },
        { status: 401 }
      );
    }

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: tokenRecord.identifier,
          token: tokenRecord.token,
        },
      },
    });

    // Find existing user by phone (created during OTP verify)
    let user = await prisma.user.findUnique({
      where: { phone: validatedData.phone },
      include: { ownedBusinesses: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'משתמש לא נמצא. נא לאמת את הטלפון מחדש' },
        { status: 400 }
      );
    }

    // Check if already has a business
    if (user.ownedBusinesses.length > 0) {
      return NextResponse.json(
        { error: 'למשתמש זה כבר יש עסק רשום' },
        { status: 400 }
      );
    }

    // Check slug availability
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: validatedData.businessSlug },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'כתובת האתר הזאת כבר תפוסה. אנא בחר כתובת אחרת' },
        { status: 400 }
      );
    }

    // Update user name and create business
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: validatedData.name,
        ownedBusinesses: {
          create: {
            name: validatedData.city,
            slug: validatedData.businessSlug,
            address: validatedData.businessAddress,
            phone: validatedData.phone,
            email: user.email || null,
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

    // Create default business data
    if (updatedUser.ownedBusinesses[0]) {
      await createDefaultBusinessData(updatedUser.ownedBusinesses[0].id, {
        name: validatedData.name,
        email: user.email || '',
        phone: validatedData.phone,
        city: validatedData.city,
        businessAddress: validatedData.businessAddress,
      });
    }

    // Create a new verification token for auto sign-in after registration
    const newToken = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        identifier: validatedData.phone,
        token: newToken,
        expires: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
      },
      business: updatedUser.ownedBusinesses[0],
      newVerificationToken: newToken,
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
