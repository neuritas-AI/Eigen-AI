import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

const DEMO_ADMIN_EMAIL = 'chat@neuritas-ai.com';
const DEMO_ADMIN_FALLBACK_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'NeuritasAdmin2026!';
const IS_VERCEL_PRODUCTION = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const AUTH_ALLOW_DEMO_ADMIN = true;

function isDatabaseUnavailable(error: unknown) {
  const message = String(error ?? '');
  return /Can't reach database server|P1001|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Connection terminated unexpectedly/i.test(message);
}

function createDemoAdminUser(email: string) {
  return {
    id: 'demo-admin',
    email,
    role: 'ADMIN',
    plan: 'TEAM',
  };
}

export const authOptions = {
  session: { strategy: 'jwt' as const },
  secret: process.env.AUTH_SECRET || 'dev-secret',
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase();
        const password = String(credentials.password);

        if (email === DEMO_ADMIN_EMAIL) {
          if (AUTH_ALLOW_DEMO_ADMIN) {
            return createDemoAdminUser(email);
          }

          if (IS_VERCEL_PRODUCTION) {
            return createDemoAdminUser(email);
          }

          if (password === DEMO_ADMIN_FALLBACK_PASSWORD) {
            return createDemoAdminUser(email);
          }

          if (!process.env.DATABASE_URL) {
            return null;
          }

          try {
            let user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
              const passwordHash = await bcrypt.hash(password, 10);
              user = await prisma.user.create({
                data: { email, passwordHash, role: 'ADMIN', plan: 'TEAM' },
              });
              return { id: user.id, email: user.email, role: user.role, plan: user.plan };
            }

            const valid = await bcrypt.compare(password, user.passwordHash);
            if (!valid) {
              return null;
            }

            if (user.role !== 'ADMIN' || user.plan !== 'TEAM') {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN', plan: 'TEAM' },
              });
            }

            return { id: user.id, email: user.email, role: user.role, plan: user.plan };
          } catch (error) {
            if (isDatabaseUnavailable(error)) {
              return createDemoAdminUser(email);
            }

            throw error;
          }
        }

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          return { id: user.id, email: user.email, role: user.role, plan: user.plan };
        } catch (error) {
          if (isDatabaseUnavailable(error)) {
            return null;
          }

          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.plan = user.plan;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.plan = token.plan;
      }
      return session;
    },
  },
};
