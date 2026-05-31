import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import core, { getConfig, type Region } from '@/lib/core';
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

    let recalculatedTickets = 0;
    if (input.recalculate) {
      recalculatedTickets = await recalculatePlayerTickets({
        supabase,
        ownerId: user.id,
        playerId: data.id,
        playerName: data.name,
        date: input.recalculate.date,
        region: input.recalculate.region as Region,
        rateProfile: data.rate_profile,
      });
    }

    return jsonOk({ player: data, recalculatedTickets });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}

async function recalculatePlayerTickets(args: {
  supabase: any;
  ownerId: string;
  playerId: string;
  playerName: string;
  date: string;
  region: Region;
  rateProfile: unknown;
}) {
  const result = await args.supabase
    .from('tickets')
    .select('id,player_id,player_name,dai,loai,tien_dat,chan,so_giai,tien_thang,status,hits')
    .eq('owner_id', args.ownerId)
    .eq('message_date', args.date)
    .eq('region', args.region)
    .or(`player_id.eq.${args.playerId},and(player_id.is.null,player_name.eq.${quotePostgrestValue(args.playerName)})`);

  if (result.error) throw result.error;
  const rows = result.data || [];
  if (!rows.length) return 0;

  const cfg = getConfig(args.region);
  const rates = core.mergeRates(args.region, args.rateProfile);
  const updates = rows.map((ticket: any) => {
    const loai = String(ticket.loai || '');
    const heSoXac = Number(rates.heSoXac?.[loai] ?? cfg.heSoXacDefault[loai] ?? 0);
    const tyLeTrung = Number(rates.tyLe?.[loai] ?? cfg.tyLeDefault[loai] ?? 0);
    const daiCount = Array.isArray(ticket.dai) ? ticket.dai.length : 0;
    const tienDat = Number(ticket.tien_dat || 0);
    const xac = tienDat * Number(ticket.chan || 0) * Number(ticket.so_giai || 0) * heSoXac * daiCount;
    const hits = Array.isArray(ticket.hits) ? ticket.hits : [];
    const shouldRepriceHits = hits.length > 0 && (ticket.status === 'TRUNG' || Number(ticket.tien_thang || 0) > 0);
    const nextHits = shouldRepriceHits
      ? hits.map((hit: any) => ({ ...hit, tienThang: tienDat * tyLeTrung }))
      : hits;

    return {
      id: ticket.id,
      he_so_xac: heSoXac,
      ty_le_trung: tyLeTrung,
      xac,
      tien_thang: shouldRepriceHits
        ? nextHits.reduce((sum: number, hit: any) => sum + Number(hit.tienThang || 0), 0)
        : Number(ticket.tien_thang || 0),
      hits: nextHits,
    };
  });

  for (const update of updates) {
    const { id, ...values } = update;
    const { error } = await args.supabase
      .from('tickets')
      .update(values)
      .eq('owner_id', args.ownerId)
      .eq('id', id);
    if (error) throw error;
  }
  return updates.length;
}

function quotePostgrestValue(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
