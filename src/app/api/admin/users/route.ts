import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const session: any = await auth();
  const isAdmin = (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.email === 'chat@neuritas-ai.com';

  if (!session?.user || !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, role: true, plan: true, createdAt: true },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  try {
    const session: any = await auth();
    const isAdmin = (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.email === 'chat@neuritas-ai.com';

    if (!session?.user || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = typeof body.role === 'string' && body.role ? body.role : 'USER';
    const plan = typeof body.plan === 'string' && body.plan ? body.plan : 'FREE';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    try {
      const user = await prisma.user.create({
        data: { email, passwordHash, role, plan },
        select: { id: true, email: true, role: true, plan: true },
      });

      return NextResponse.json({ ok: true, user }, { status: 201 });
    } catch (prismaError) {
      const fallback = await supabase.from('User').insert([
        { id: crypto.randomUUID(), email, passwordHash, role, plan, createdAt: new Date().toISOString() },
      ]).select('id, email, role, plan').single();

      if (fallback.error || !fallback.data) {
        throw prismaError;
      }

      return NextResponse.json({ ok: true, user: fallback.data, source: 'supabase' }, { status: 201 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isDatabaseIssue = /Can't reach database server|P1001|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Connection terminated unexpectedly/i.test(message);

    console.error('Failed to create user:', error);

    return NextResponse.json(
      {
        error: isDatabaseIssue
          ? 'Database connection failed. Update the Supabase user table schema and retry.'
          : 'Unable to create user right now.',
      },
      { status: 500 },
    );
  }
}
