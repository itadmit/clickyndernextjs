/**
 * NextAuth Configuration
 * הגדרות אימות משתמשים
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';

// בדיקת משתני סביבה ל-Google OAuth
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;

// לוגים לבדיקת הגדרות
if (!googleClientId || !googleClientSecret) {
  console.warn('⚠️  Google OAuth לא מוגדר: GOOGLE_CLIENT_ID או GOOGLE_CLIENT_SECRET חסרים');
} else {
  console.log('✅ Google OAuth מוגדר:', {
    clientId: googleClientId.substring(0, 20) + '...',
    hasSecret: !!googleClientSecret,
    nextAuthUrl: nextAuthUrl || 'לא מוגדר'
  });
}

if (!nextAuthUrl) {
  console.warn('⚠️  NEXTAUTH_URL לא מוגדר - זה עלול לגרום לבעיות ב-OAuth callbacks');
}

// בניית רשימת providers
const providers: NextAuthOptions['providers'] = [
  // Google OAuth Provider - רק אם מוגדר
  ...(googleClientId && googleClientSecret ? [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ] : []),
  
  // Credentials Provider (Email/Phone & Password)
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      identifier: { label: 'אימייל או טלפון', type: 'text' },
      password: { label: 'סיסמה', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.identifier || !credentials?.password) {
        throw new Error('נא למלא אימייל/טלפון וסיסמה');
      }

      // נרמול הקלט - אימייל תמיד lowercase
      const identifier = credentials.identifier.trim();
      const isEmail = identifier.includes('@');
      
      const user = await prisma.user.findUnique({
        where: isEmail 
          ? { email: identifier.toLowerCase() }
          : { phone: identifier.replace(/[-\s]/g, '') }, // נרמול טלפון
      });

      if (!user) {
        throw new Error('משתמש לא נמצא');
      }

      if (!user.passwordHash) {
        throw new Error('משתמש זה נרשם דרך Google. אנא התחבר דרך Google');
      }

      const isPasswordValid = await compare(
        credentials.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new Error('סיסמה שגויה');
      }

      // עדכון זמן התחברות אחרון
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

        return {
          id: user.id,
          email: user.email || '',
          name: user.name || '',
        };
    },
  }),
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      // אם זה התחברות דרך Google
      if (account?.provider === 'google') {
        try {
          console.log('🔐 Google sign in attempt:', {
            email: user.email,
            name: user.name,
            accountId: account.providerAccountId,
            hasAccessToken: !!account.access_token
          });

          if (!user.email) {
            console.error('❌ No email from Google');
            return false;
          }

          // נרמול אימייל - תמיד lowercase
          const normalizedEmail = user.email.toLowerCase().trim();

          // בדוק אם המשתמש כבר קיים
          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { ownedBusinesses: true },
          });

          if (existingUser) {
            // בדוק אם יש כבר Google Account מקושר
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser.id,
                provider: 'google',
                providerAccountId: account.providerAccountId,
              },
            });

            // אם אין Account מקושר, צור אותו
            if (!existingAccount) {
              console.log('🔗 Linking Google account to existing user');
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
              console.log('✅ Google account linked successfully');
            }

            // עדכן את זמן ההתחברות
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { 
                lastLoginAt: new Date(),
                // עדכן name אם לא קיים
                ...(user.name && !existingUser.name && { name: user.name }),
                // עדכן image אם לא קיים
                ...(user.image && !existingUser.image && { image: user.image }),
              },
            });
            
            if (existingUser.ownedBusinesses.length > 0) {
              console.log('✅ Google sign in successful - existing user with business');
              return true;
            } else {
              console.log('✅ Google sign in successful - existing user without business, will redirect to register');
              // נאפשר לו להתחבר - ה-redirect יעשה ב-dashboard/layout או ב-session callback
              return true;
            }
          }

          // אם המשתמש לא קיים, נאפשר ל-Adapter ליצור אותו
          // PrismaAdapter ייצור את המשתמש ואת ה-Account אוטומטית
          console.log('✅ Google sign in successful - new user, will be created by adapter');
          // משתמש חדש יוצר - נשמור מידע ב-session כדי לדעת שהוא חדש
          return true;
        } catch (error) {
          console.error('❌ Error in Google sign in callback:', error);
          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              stack: error.stack
            });
          }
          // במקרה של שגיאה, תן ל-Adapter לנסות בכל זאת
          // רק אם זו שגיאה קריטית, נחזיר false
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || null;
        token.name = user.name || null;
        
        // בדיקה אם המשתמש הוא Super Admin
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { isSuperAdmin: true },
          });
          token.isSuperAdmin = dbUser?.isSuperAdmin || false;
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
          token.isSuperAdmin = false;
        }
      }
      
      // אם זו התחברות Google, שמור מידע נוסף
      if (account?.provider === 'google') {
        token.provider = 'google';
        console.log('📝 JWT callback - Google account:', {
          userId: user?.id,
          email: user?.email,
          hasAccount: !!account
        });
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string | null;
        session.user.name = token.name as string | null;
        (session.user as any).isSuperAdmin = token.isSuperAdmin || false;
        
        // בדוק אם יש עסק למשתמש
        if (token.id) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: token.id as string },
              include: { 
                ownedBusinesses: true,
                accounts: {
                  where: { provider: 'google' },
                  select: { provider: true }
                }
              },
            });
            (session.user as any).hasBusiness = (user?.ownedBusinesses.length || 0) > 0;
            // שמור אם המשתמש התחבר דרך Google (שימושי לטיפול ב-redirect)
            (session.user as any).isGoogleUser = (user?.accounts.length || 0) > 0;
          } catch (error) {
            console.error('Error fetching user business in session:', error);
            (session.user as any).hasBusiness = false;
            (session.user as any).isGoogleUser = false;
          }
        }
      }
      return session;
    },
  },
};

