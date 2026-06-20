import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session: any = await auth();
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.email === 'chat@neuritas-ai.com';
  if (!session?.user || !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const models = await prisma.modelProvider.findMany({ orderBy: { priority: 'asc' } });
  return NextResponse.json({ models });
}

export async function PATCH(request: Request) {
  const session: any = await auth();
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.email === 'chat@neuritas-ai.com';
  if (!session?.user || !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const key = typeof body.key === 'string' ? body.key : '';
  const active = typeof body.active === 'boolean' ? body.active : undefined;
  const priority = typeof body.priority === 'number' ? body.priority : undefined;
  const pricePerMsg = typeof body.pricePerMsg === 'number' ? body.pricePerMsg : undefined;

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  const data: any = {};
  if (active !== undefined) data.active = active;
  if (priority !== undefined) data.priority = priority;
  if (pricePerMsg !== undefined) data.pricePerMsg = pricePerMsg;

  const model = await prisma.modelProvider.update({ where: { key }, data });
  return NextResponse.json({ model });
}
