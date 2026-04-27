/**
 * Start Google Calendar OAuth.
 * GET /api/integrations/google-calendar/connect?token=<JWT>&staffId=<optional>
 *
 * The mobile app passes its bearer token + optional staffId in the URL so that
 * the callback can attribute the resulting connection to the right business.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_CALENDAR_SCOPE } from '@/lib/google-calendar';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.clickynder.com';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const staffId = searchParams.get('staffId') || '';
  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  const redirectUri = `${APP_URL}/api/integrations/google-calendar/callback`;
  // state encodes the JWT + staffId so the callback can resolve the business
  const state = Buffer.from(JSON.stringify({ token, staffId })).toString('base64url');

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent', // ensure we always get a refresh_token
    scope: `${GOOGLE_CALENDAR_SCOPE} email`,
    state,
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
