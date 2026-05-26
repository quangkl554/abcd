import { type NextRequest } from 'next/server';
import { authErrorResponse, requireAdmin, usernameToEmail } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { adminUserCreateSchema, adminUserPatchSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { admin } = await requireAdmin();
    const { data, error } = await admin
      .from('profiles')
      .select('user_id, username, role, active, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return jsonOk({ users: data || [] });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAdmin();
    const input = adminUserCreateSchema.parse(await request.json());
    const email = usernameToEmail(input.username);
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { username: input.username },
    });
    if (createError || !created.user) throw createError || new Error('Khong tao duoc user.');

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .insert({
        user_id: created.user.id,
        username: input.username.trim().toLowerCase(),
        role: input.role,
        active: input.active,
      })
      .select('user_id, username, role, active, created_at')
      .single();

    if (profileError) throw profileError;
    return jsonOk({ user: profile }, { status: 201 });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin } = await requireAdmin();
    const input = adminUserPatchSchema.parse(await request.json());

    if (input.password) {
      const { error } = await admin.auth.admin.updateUserById(input.userId, { password: input.password });
      if (error) throw error;
    }

    const updates: Record<string, unknown> = {};
    if (input.role) updates.role = input.role;
    if (typeof input.active === 'boolean') updates.active = input.active;

    let profile = null;
    if (Object.keys(updates).length) {
      const { data, error } = await admin
        .from('profiles')
        .update(updates)
        .eq('user_id', input.userId)
        .select('user_id, username, role, active, updated_at')
        .single();
      if (error) throw error;
      profile = data;
    }

    return jsonOk({ user: profile, passwordUpdated: Boolean(input.password) });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
