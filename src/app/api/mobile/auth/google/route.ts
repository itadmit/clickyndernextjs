/**
 * Mobile Google Auth API
 * POST /api/mobile/auth/google
 * Accepts a Google ID token, verifies it, finds/creates the user, returns JWT tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken } from '@/lib/mobile-auth';

interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: string;
  name: string;
  picture: string;
  aud: string;
  iss: string;
  exp: string;
}

const ALLOWED_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_IOS_CLIENT_ID,
].filter(Boolean) as string[];

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!res.ok) return null;

    const data: GoogleTokenInfo = await res.json();

    if (ALLOWED_CLIENT_IDS.length > 0 && !ALLOWED_CLIENT_IDS.includes(data.aud)) {
      console.error('[Google Auth] Token audience mismatch. Got:', data.aud, 'Allowed:', ALLOWED_CLIENT_IDS);
      return null;
    }

    if (data.email_verified !== 'true') {
      console.error('[Google Auth] Email not verified');
      return null;
    }

    return data;
  } catch (err) {
    console.error('[Google Auth] Token verification failed:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: 'חסר Google ID token' },
        { status: 400 }
      );
    }

    const googleUser = await verifyGoogleIdToken(idToken);
    if (!googleUser) {
      return NextResponse.json(
        { error: 'טוקן Google לא תקין' },
        { status: 401 }
      );
    }

    // Find existing user by email
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: {
        accounts: {
          where: { provider: 'google' },
        },
        ownedBusinesses: {
          select: { id: true, name: true, slug: true, logoUrl: true },
          take: 1,
        },
      },
    });

    if (user) {
      // Link Google account if not linked yet
      if (user.accounts.length === 0) {
        await prisma.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: googleUser.sub,
          },
        });
      }

      // Update profile picture & last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          image: user.image || googleUser.picture,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Create new user + Google account
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture,
          emailVerified: new Date(),
          lastLoginAt: new Date(),
          accounts: {
            create: {
              type: 'oauth',
              provider: 'google',
              providerAccountId: googleUser.sub,
            },
          },
        },
        include: {
          accounts: { where: { provider: 'google' } },
          ownedBusinesses: {
            select: { id: true, name: true, slug: true, logoUrl: true },
            take: 1,
          },
        },
      });
    }

    const business = user.ownedBusinesses[0] || null;
    const email = user.email || googleUser.email;

    const accessToken = await generateAccessToken(user.id, email);
    const refreshToken = await generateRefreshToken(user.id, email);

    // Auto-link existing Customer records by email
    if (user.email) {
      await prisma.customer.updateMany({
        where: { email: user.email, userId: null },
        data: { userId: user.id },
      });
    }

    const customerRecords = await prisma.customer.findMany({
      where: { userId: user.id },
      include: {
        business: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
    });
    const customerBusinesses = customerRecords.map((c) => c.business);

    let role: 'owner' | 'customer' | 'both' | 'none' = 'none';
    if (business && customerBusinesses.length > 0) role = 'both';
    else if (business) role = 'owner';
    else if (customerBusinesses.length > 0) role = 'customer';

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isSuperAdmin: (user as any).isSuperAdmin ?? false,
      },
      business,
      customerBusinesses,
      role,
    });
  } catch (error) {
    console.error('[Google Auth] Error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהתחברות עם Google' },
      { status: 500 }
    );
  }
}
