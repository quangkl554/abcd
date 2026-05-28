import { type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError, jsonOk } from '@/lib/http';
import { XOSO_SESSION_COOKIE, isMissingProfileSessionColumn, usernameToEmail } from '@/lib/auth';

export const runtime = 'nodejs';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (error || !data.user) return jsonError('Sai tai khoan hoac mat khau.', 401);

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();
    if (profileError) throw profileError;

    if (!profile?.active) {
      await supabase.auth.signOut();
      return jsonError('Tai khoan da bi khoa.', 403);
    }

    const sessionId = randomUUID();
    let responseProfile = profile;
    const { data: updatedProfile, error: sessionError } = await admin
      .from('profiles')
      .update({
        active_session_id: sessionId,
        active_session_at: new Date().toISOString(),
      })
      .eq('user_id', data.user.id)
      .select('*')
      .single();
    if (sessionError) {
      if (!isMissingProfileSessionColumn(sessionError)) throw sessionError;
    } else {
      responseProfile = updatedProfile;
    }

    const cookieStore = await cookies();
    cookieStore.set(XOSO_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return jsonOk({ profile: responseProfile, sessionGuardEnabled: !sessionError });
  } catch (error) {
    return jsonError((error as Error).message || 'Khong dang nhap duoc.', 400);
  }
}
