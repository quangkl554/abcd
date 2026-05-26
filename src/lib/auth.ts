import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';

export type AppProfile = {
  user_id: string;
  username: string;
  role: 'admin' | 'user';
  active: boolean;
};

export function usernameToEmail(username: string) {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  if (!clean) throw new Error('Username khong hop le');
  return `${clean}@xoso.local`;
}

export async function getCurrentUserAndProfile() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, role, active')
    .eq('user_id', userData.user.id)
    .single();

  return {
    supabase,
    user: userData.user,
    profile: profile as AppProfile | null,
  };
}

export async function requireActiveUser() {
  const ctx = await getCurrentUserAndProfile();
  if (!ctx.user) throw Object.assign(new Error('UNAUTHENTICATED'), { status: 401 });
  if (!ctx.profile || !ctx.profile.active) throw Object.assign(new Error('ACCOUNT_DISABLED'), { status: 403 });
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
  if (err.message === 'ADMIN_REQUIRED') return { status, message: 'Can quyen admin.' };
  return { status, message: err.message || 'Loi he thong.' };
}
