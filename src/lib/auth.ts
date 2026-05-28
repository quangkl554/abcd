import { cookies } from 'next/headers';
import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';

export const XOSO_SESSION_COOKIE = 'xoso_session_id';

export type AppProfile = {
  user_id: string;
  username: string;
  role: 'admin' | 'user';
  active: boolean;
  active_session_id?: string | null;
  active_session_at?: string | null;
};

export function usernameToEmail(username: string) {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  if (!clean) throw new Error('Username khong hop le');
  return `${clean}@xoso.local`;
}

export function isMissingProfileSessionColumn(error: unknown) {
  const err = error as { message?: string; code?: string; details?: string };
  const text = `${err?.message || ''} ${err?.details || ''}`.toLowerCase();
  return (
    (text.includes('active_session_id') || text.includes('active_session_at')) &&
    (text.includes('schema cache') || text.includes('column') || err?.code === 'PGRST204')
  );
}

export async function getCurrentUserAndProfile() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(XOSO_SESSION_COOKIE)?.value || null;
  let user: { id: string; email?: string | null } | null = null;

  const { data: claimsData } = await supabase.auth.getClaims();
  if (claimsData?.claims?.sub) {
    user = {
      id: claimsData.claims.sub,
      email: typeof claimsData.claims.email === 'string' ? claimsData.claims.email : null,
    };
  } else {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return { supabase, user: null, profile: null, sessionId };
    user = userData.user;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return {
    supabase,
    user,
    profile: profile as AppProfile | null,
    sessionId,
  };
}

export async function requireActiveUser() {
  const ctx = await getCurrentUserAndProfile();
  if (!ctx.user) throw Object.assign(new Error('UNAUTHENTICATED'), { status: 401 });
  if (!ctx.profile || !ctx.profile.active) throw Object.assign(new Error('ACCOUNT_DISABLED'), { status: 403 });
  if (ctx.profile.active_session_id && ctx.profile.active_session_id !== ctx.sessionId) {
    throw Object.assign(new Error('SESSION_REPLACED'), { status: 401 });
  }
  return ctx as typeof ctx & { user: NonNullable<typeof ctx.user>; profile: AppProfile };
}

export async function requireAdmin() {
  const ctx = await requireActiveUser();
  if (ctx.profile.role !== 'admin') throw Object.assign(new Error('ADMIN_REQUIRED'), { status: 403 });
  return { ...ctx, admin: createAdminClient() };
}

export function authErrorResponse(error: unknown) {
  const err = error as Error & { status?: number };
  const status = err.status || 500;
  if (err.message === 'UNAUTHENTICATED') return { status, message: 'Vui long dang nhap.' };
  if (err.message === 'ACCOUNT_DISABLED') return { status, message: 'Tai khoan da bi khoa.' };
  if (err.message === 'SESSION_REPLACED') return { status, message: 'Tai khoan nay da dang nhap o noi khac.' };
  if (err.message === 'ADMIN_REQUIRED') return { status, message: 'Can quyen admin.' };
  return { status, message: err.message || 'Loi he thong.' };
}
