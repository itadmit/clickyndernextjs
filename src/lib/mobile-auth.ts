/**
 * Mobile Auth - JWT Authentication for Mobile App
 * מערכת אימות JWT נפרדת מ-NextAuth לשימוש באפליקציית המובייל
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { NextRequest } from 'next/server';

// מפתח ההצפנה - משתמש ב-NEXTAUTH_SECRET הקיים
function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not defined');
  }
  return new TextEncoder().encode(secret);
}

interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

/**
 * יצירת Access Token (7 ימים)
 */
export async function generateAccessToken(userId: string, email: string): Promise<string> {
  const secret = getJwtSecret();
  
  return new SignJWT({ userId, email, type: 'access' } as TokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setIssuer('clickynder-mobile')
    .sign(secret);
}

/**
 * יצירת Refresh Token (30 ימים)
 */
export async function generateRefreshToken(userId: string, email: string): Promise<string> {
  const secret = getJwtSecret();
  
  return new SignJWT({ userId, email, type: 'refresh' } as TokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .setIssuer('clickynder-mobile')
    .sign(secret);
}

/**
 * אימות Access Token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'clickynder-mobile',
    });

    const tokenPayload = payload as TokenPayload;
    
    if (tokenPayload.type !== 'access') {
      return null;
    }

    return tokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * אימות Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'clickynder-mobile',
    });

    const tokenPayload = payload as TokenPayload;
    
    if (tokenPayload.type !== 'refresh') {
      return null;
    }

    return tokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * התחברות משתמש מהמובייל
 */
export async function loginMobile(identifier: string, password: string): Promise<{
  success: boolean;
  error?: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      image: string | null;
    };
    business: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
    } | null;
    customerBusinesses: { id: string; name: string; slug: string; logoUrl: string | null }[];
    role: 'owner' | 'customer' | 'both' | 'none';
  };
}> {
  try {
    const isEmail = identifier.includes('@');
    
    const user = await prisma.user.findUnique({
      where: isEmail 
        ? { email: identifier }
        : { phone: identifier.replace(/[-\s]/g, '') },
      include: {
        ownedBusinesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return { success: false, error: 'משתמש לא נמצא' };
    }

    if (!user.passwordHash) {
      return { success: false, error: 'משתמש זה נרשם דרך Google. אנא התחבר דרך Google' };
    }

    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: 'סיסמה שגויה' };
    }

    const business = user.ownedBusinesses[0] || null;

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const email = user.email || '';
    const accessToken = await generateAccessToken(user.id, email);
    const refreshToken = await generateRefreshToken(user.id, email);

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

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          image: user.image,
        },
        business,
        customerBusinesses,
        role,
      },
    };
  } catch (error) {
    console.error('Mobile login error:', error);
    return { success: false, error: 'שגיאה בהתחברות' };
  }
}

/**
 * חילוץ ואימות טוקן מ-Request headers
 */
export async function authenticateRequest(req: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing authorization header' };
  }

  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return { authenticated: false, error: 'Invalid or expired token' };
  }

  return {
    authenticated: true,
    userId: payload.userId,
    email: payload.email,
  };
}

/**
 * שליפת העסק של המשתמש המאומת
 */
export async function getAuthenticatedBusiness(userId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerUserId: userId },
  });
  return business;
}
