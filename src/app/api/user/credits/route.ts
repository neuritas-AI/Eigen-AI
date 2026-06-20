import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMonthlyCreditLimit } from '@/lib/plan-utils';

export async function GET() {
  const session: any = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: String(session.user.email) } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const subscription = await prisma.subscription.findFirst({ where: { userId: user.id, status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } });
  const limit = getMonthlyCreditLimit(user.plan, subscription?.credits ?? null);
  const usageLogs = await prisma.usageLog.findMany({ where: { userId: user.id, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } });

  const creditsUsed = usageLogs.reduce((total, item) => total + item.creditsUsed, 0);

  return NextResponse.json({ credits: Math.max(0, limit - creditsUsed), limit });
}
