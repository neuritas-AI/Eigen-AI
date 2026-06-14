import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const session: any = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const profileName = typeof body.profileName === 'string' ? body.profileName : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const profileImage = typeof body.profileImage === 'string' ? body.profileImage : '';

    const user = await prisma.user.findUnique({ where: { email: String(session.user.email) } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: any = {};
    if (typeof profileName === 'string') {
      updates.profileName = profileName.trim() || null;
    }

    if (typeof profileImage === 'string') {
      updates.profileImage = profileImage.trim() || null;
    }

    if (typeof password === 'string' && password.trim()) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, profileName: updates.profileName ?? user.profileName, profileImage: updates.profileImage ?? user.profileImage } });
    } catch (prismaError) {
      const fallback = await supabase
        .from('User')
        .update({
          profileName: typeof updates.profileName === 'string' ? updates.profileName : user.profileName,
          profileImage: typeof updates.profileImage === 'string' ? updates.profileImage : user.profileImage,
        })
        .eq('email', user.email)
        .select('id, email, profileName, profileImage')
        .single();

      if (fallback.error || !fallback.data) {
        throw prismaError;
      }

      return NextResponse.json({ ok: true, user: fallback.data });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isDatabaseIssue = /Can't reach database server|P1001|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Connection terminated unexpectedly|column .* does not exist/i.test(message);

    console.error('Failed to update profile:', error);

    return NextResponse.json(
      {
        error: isDatabaseIssue
          ? 'Profile update failed because the Supabase user table is missing the profile fields. Run the SQL update in Supabase and retry.'
          : 'Unable to update profile right now.',
      },
      { status: 500 },
    );
  }
}
