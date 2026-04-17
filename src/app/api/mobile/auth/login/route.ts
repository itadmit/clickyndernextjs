/**
 * Mobile Login API
 * POST /api/mobile/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginMobile } from '@/lib/mobile-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'נא למלא אימייל/טלפון וסיסמה' },
        { status: 400 }
      );
    }

    const result = await loginMobile(identifier, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}
