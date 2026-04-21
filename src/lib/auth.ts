/**
 * NextAuth Configuration
 * אימות משתמשים באמצעות טלפון + OTP בוואטסאפ
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

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
  providers: [
    CredentialsProvider({
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'טלפון', type: 'text' },
        verificationToken: { label: 'טוקן אימות', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.verificationToken) {
          throw new Error('מספר טלפון וטוקן אימות נדרשים');
        }

        const phone = credentials.phone.trim();
        const token = credentials.verificationToken;

        // Validate the verification token
        const verificationRecord = await prisma.verificationToken.findFirst({
          where: {
            identifier: phone,
            token,
            expires: { gte: new Date() },
          },
        });

        if (!verificationRecord) {
          throw new Error('טוקן אימות לא תקין או פג תוקף');
        }

        // Delete the used token
        await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: verificationRecord.identifier,
              token: verificationRecord.token,
            },
          },
        });

        // Find the user by phone
        const user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user) {
          throw new Error('משתמש לא נמצא');
        }

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
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || null;
        token.name = user.name || null;

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

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string | null;
        session.user.name = token.name as string | null;
        (session.user as any).isSuperAdmin = token.isSuperAdmin || false;

        if (token.id) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: token.id as string },
              include: { ownedBusinesses: true },
            });
            (session.user as any).hasBusiness = (user?.ownedBusinesses.length || 0) > 0;
          } catch (error) {
            console.error('Error fetching user business in session:', error);
            (session.user as any).hasBusiness = false;
          }
        }
      }
      return session;
    },
  },
};
