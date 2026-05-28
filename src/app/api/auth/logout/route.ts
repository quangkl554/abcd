import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { XOSO_SESSION_COOKIE, isMissingProfileSessionColumn } from '@/lib/auth';
import { jsonOk } from '@/lib/http';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(XOSO_SESSION_COOKIE)?.value || null;
  const { data } = await supabase.auth.getUser();

  if (data.user && sessionId) {
    try {
      const admin = createAdminClient();
      await admin
        .from('profiles')
        .update({ active_session_id: null, active_session_at: null })
        .eq('user_id', data.user.id)
        .eq('active_session_id', sessionId);
    } catch (error) {
      if (!isMissingProfileSessionColumn(error)) {
        console.error(error);
      }
      // Supabase sign-out and cookie clearing still need to happen.
    }
  }

  await supabase.auth.signOut();
  cookieStore.set(XOSO_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return jsonOk({ signedOut: true });
}
