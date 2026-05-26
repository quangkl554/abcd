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
      .order('name', { ascending: true });
    if (error) throw error;
    return jsonOk({ players: data || [] });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const input = playerCreateSchema.parse(await request.json());
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
