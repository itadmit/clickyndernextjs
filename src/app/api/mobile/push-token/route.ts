/**
 * Push Token API
 * POST /api/mobile/push-token - Register/update push token
 * DELETE /api/mobile/push-token - Unregister push token
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const { token, platform, deviceName } = body;

    if (!token || !platform) {
      return NextResponse.json(
        { error: 'token and platform are required' },
        { status: 400 }
      );
    }

    // Upsert - אם הטוקן קיים, עדכן אותו; אחרת צור חדש
    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      create: {
        userId: auth.userId!,
        token,
        platform,
        deviceName: deviceName || null,
        active: true,
      },
      update: {
        userId: auth.userId!,
        platform,
        deviceName: deviceName || null,
        active: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      id: pushToken.id,
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    return NextResponse.json(
      { error: 'Failed to register push token' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'token is required' },
        { status: 400 }
      );
    }

    // השבתת הטוקן
    await prisma.pushToken.updateMany({
      where: {
        token,
        userId: auth.userId!,
      },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return NextResponse.json(
      { error: 'Failed to unregister push token' },
      { status: 500 }
    );
  }
}
