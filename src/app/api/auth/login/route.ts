import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jsonError, jsonOk } from '@/lib/http';
import { usernameToEmail } from '@/lib/auth';

export const runtime = 'nodejs';

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, username, role, active')
      .eq('user_id', data.user.id)
      .single();

    if (!profile?.active) {
      await supabase.auth.signOut();
      return jsonError('Tai khoan da bi khoa.', 403);
    }

    return jsonOk({ profile });
  } catch (error) {
    return jsonError((error as Error).message || 'Khong dang nhap duoc.', 400);
  }
}
