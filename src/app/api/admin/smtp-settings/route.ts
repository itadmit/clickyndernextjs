/**
 * Admin API: Email Settings Management (Resend)
 * GET /api/admin/smtp-settings - קבלת הגדרות Resend
 * POST /api/admin/smtp-settings - שמירת הגדרות Resend
 * PUT /api/admin/smtp-settings - בדיקת חיבור Resend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { testResendConnection } from '@/lib/notifications/email-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as any)?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['resend_api_key', 'resend_from_name', 'resend_from_email']
        }
      }
    });

    const settingsObj: Record<string, string> = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    const hasApiKey = !!settingsObj['resend_api_key'] || !!process.env.RESEND_API_KEY;
    const maskedKey = settingsObj['resend_api_key']
      ? settingsObj['resend_api_key'].substring(0, 8) + '...'
      : process.env.RESEND_API_KEY
        ? process.env.RESEND_API_KEY.substring(0, 8) + '...'
        : '';

    return NextResponse.json({
      resend_from_name: settingsObj['resend_from_name'] || 'Clickynder',
      resend_from_email: settingsObj['resend_from_email'] || 'noreply@clickynder.com',
      hasApiKey,
      maskedKey,
    });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as any)?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { resend_api_key, resend_from_name, resend_from_email } = body;

    const settingsToSave = [
      { key: 'resend_from_name', value: String(resend_from_name || 'Clickynder'), description: 'Resend From Name' },
      { key: 'resend_from_email', value: String(resend_from_email || 'noreply@clickynder.com'), description: 'Resend From Email' },
    ];

    for (const setting of settingsToSave) {
      await prisma.systemSettings.upsert({
        where: { key: setting.key },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          isEncrypted: false,
        },
        update: {
          value: setting.value,
          description: setting.description,
        },
      });
    }

    if (resend_api_key) {
      await prisma.systemSettings.upsert({
        where: { key: 'resend_api_key' },
        create: {
          key: 'resend_api_key',
          value: resend_api_key,
          description: 'Resend API Key',
          isEncrypted: false,
        },
        update: {
          value: resend_api_key,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving email settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as any)?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const result = await testResendConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing Resend:', error);
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    );
  }
}
