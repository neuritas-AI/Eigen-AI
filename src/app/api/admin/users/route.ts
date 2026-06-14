import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const user = await prisma.user.create({
      data: { email, passwordHash, role, plan },
      select: { id: true, email: true, role: true, plan: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Unable to create user right now.' }, { status: 500 });
  }
}
