/**
 * Google OAuth callback. Exchanges the code, looks up the business via the
 * mobile JWT carried in `state`, and persists a GoogleCalendarConnection.
 * Then renders a tiny "you're connected" HTML so the user can close the
 * browser and return to the app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, fetchUserEmail } from '@/lib/google-calendar';
import { verifyAccessToken } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.clickynder.com';

function html(title: string, body: string) {
  return new NextResponse(
    `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>body{font-family:system-ui,'Noto Sans Hebrew',sans-serif;background:#f7f7f8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:#fff;border-radius:24px;padding:32px;max-width:420px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.05)}h1{color:#0F172A;font-size:22px}p{color:#64748B}.btn{display:inline-block;background:#4F46E5;color:#fff;padding:12px 24px;border-radius:13px;text-decoration:none;margin-top:12px;font-weight:600}</style></head><body><div class="card">${body}</div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code || !stateRaw) {
    return html('שגיאה', `<h1>החיבור נכשל</h1><p>${error || 'חסרים פרמטרים'}</p>`);
  }

  let parsed: { token: string; staffId?: string };
  try {
    parsed = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
  } catch {
    return html('שגיאה', '<h1>state לא תקין</h1>');
  }

  const payload = await verifyAccessToken(parsed.token);
  if (!payload) {
    return html('שגיאה', '<h1>החיבור נכשל</h1><p>טוקן לא תקין</p>');
  }
  const business = await prisma.business.findFirst({ where: { ownerUserId: payload.userId } });
  if (!business) {
    return html('שגיאה', '<h1>החיבור נכשל</h1><p>עסק לא נמצא</p>');
  }

  const redirectUri = `${APP_URL}/api/integrations/google-calendar/callback`;
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code, redirectUri);
  } catch (e) {
    return html('שגיאה', `<h1>החיבור נכשל</h1><p>${(e as Error).message}</p>`);
  }

  if (!tokens.refresh_token) {
    return html(
      'שגיאה',
      '<h1>חסר refresh token</h1><p>נסה שוב — ודא שאישרת את ההרשאות בכל החלונות.</p>',
    );
  }

  const email = (await fetchUserEmail(tokens.access_token)) || '';

  // Validate staffId belongs to business
  const staffId = parsed.staffId
    ? (await prisma.staff.findFirst({ where: { id: parsed.staffId, businessId: business.id } }))?.id ?? null
    : null;

  // Upsert: one connection per staffId (or one business-wide where staffId is null)
  if (staffId) {
    await prisma.googleCalendarConnection.upsert({
      where: { staffId },
      create: {
        businessId: business.id,
        staffId,
        googleEmail: email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      update: {
        googleEmail: email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        syncEnabled: true,
      },
    });
  } else {
    // business-wide: find existing where staffId is null
    const existing = await prisma.googleCalendarConnection.findFirst({
      where: { businessId: business.id, staffId: null },
    });
    if (existing) {
      await prisma.googleCalendarConnection.update({
        where: { id: existing.id },
        data: {
          googleEmail: email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          scope: tokens.scope,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          syncEnabled: true,
        },
      });
    } else {
      await prisma.googleCalendarConnection.create({
        data: {
          businessId: business.id,
          googleEmail: email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          scope: tokens.scope,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      });
    }
  }

  return html(
    'מחובר!',
    `<h1>חיבור הצליח 🎉</h1><p>חשבון Google Calendar (${email}) חובר. תורים חדשים יסונכרנו אוטומטית.</p><p>אפשר לסגור את החלון ולחזור לאפליקציה.</p>`,
  );
}
