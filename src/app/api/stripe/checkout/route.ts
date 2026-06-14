import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

export async function POST() {
  const session: any = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    url: '/pricing',
    message: 'Stripe checkout is not configured yet. Please use the pricing page to review available plans.',
  });
}
