/**
 * Minimal Google Calendar v3 wrapper.
 * Uses the project's existing Google OAuth client (GOOGLE_CLIENT_ID/SECRET).
 * Refreshes the access token on demand and stores the new one back to the
 * GoogleCalendarConnection row.
 */

import { prisma } from '@/lib/prisma';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CAL_BASE = 'https://www.googleapis.com/calendar/v3';

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

interface RefreshResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

async function refreshAccessToken(connectionId: string, refreshToken: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as RefreshResponse;
  await prisma.googleCalendarConnection.update({
    where: { id: connectionId },
    data: {
      accessToken: data.access_token,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });
  return data.access_token;
}

async function getValidAccessToken(connectionId: string) {
  const conn = await prisma.googleCalendarConnection.findUnique({ where: { id: connectionId } });
  if (!conn) throw new Error('GoogleCalendarConnection not found');
  const exp = conn.tokenExpiresAt?.getTime() ?? 0;
  // refresh 60s early
  if (exp - 60_000 < Date.now()) {
    return refreshAccessToken(connectionId, conn.refreshToken);
  }
  return conn.accessToken;
}

export interface GoogleEventInput {
  summary: string;
  description?: string;
  startISO: string; // RFC3339
  endISO: string;
  timeZone?: string; // e.g. 'Asia/Jerusalem'
  attendees?: { email: string; displayName?: string }[];
  conferenceData?: boolean; // create a Meet link
}

export async function createCalendarEvent(connectionId: string, calendarId: string, input: GoogleEventInput) {
  const token = await getValidAccessToken(connectionId);
  const body: any = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.startISO, timeZone: input.timeZone || 'Asia/Jerusalem' },
    end: { dateTime: input.endISO, timeZone: input.timeZone || 'Asia/Jerusalem' },
  };
  if (input.attendees) body.attendees = input.attendees;
  if (input.conferenceData) {
    body.conferenceData = { createRequest: { requestId: `clk-${Date.now()}` } };
  }
  const url = `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Calendar create failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    id_token?: string;
  };
  return data;
}

export async function fetchUserEmail(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email || null;
}
