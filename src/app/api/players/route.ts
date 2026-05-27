import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { playerCreateSchema, playerPatchSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { supabase, user } = await requireActiveUser();
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('owner_id', user.id)
      .eq('active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return jsonOk({ players: data || [] });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) return jsonError('Thiếu khách cần xóa.', 400);

    const { data, error } = await supabase
      .from('players')
      .update({ active: false })
      .eq('owner_id', user.id)
      .eq('id', id)
      .select('id,name,active')
      .single();
    if (error) throw error;
    return jsonOk({ player: data });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const input = playerCreateSchema.parse(await request.json());
    const existing = await supabase
      .from('players')
      .select('*')
      .eq('owner_id', user.id)
      .eq('name', input.name)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      const { data, error } = await supabase
        .from('players')
        .update({
          active: true,
          aliases: input.aliases || existing.data.aliases || [],
          rate_profile: input.rateProfile || existing.data.rate_profile || { heSoXac: {}, tyLe: {} },
        })
        .eq('owner_id', user.id)
        .eq('id', existing.data.id)
        .select('*')
        .single();
      if (error) throw error;
      return jsonOk({ player: data }, { status: 201 });
    }
    const { data, error } = await supabase
      .from('players')
      .insert({
        owner_id: user.id,
        name: input.name,
        aliases: input.aliases || [],
        rate_profile: input.rateProfile || { heSoXac: {}, tyLe: {} },
      })
      .select('*')
      .single();
    if (error) throw error;
    return jsonOk({ player: data }, { status: 201 });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const input = playerPatchSchema.parse(await request.json());
    const updates: Record<string, unknown> = {};
    if (input.name) updates.name = input.name;
    if (input.aliases) updates.aliases = input.aliases;
    if (input.rateProfile) updates.rate_profile = input.rateProfile;
    if (typeof input.active === 'boolean') updates.active = input.active;

    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('owner_id', user.id)
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw error;
    return jsonOk({ player: data });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
