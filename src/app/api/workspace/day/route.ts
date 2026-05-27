import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { dateSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile } = await requireActiveUser();
    const url = new URL(request.url);
    const date = dateSchema.parse(url.searchParams.get('date'));

    const [players, tickets] = await Promise.all([
      supabase
        .from('players')
        .select('id,name,active,rate_profile,created_at')
        .eq('owner_id', user.id)
        .eq('active', true)
        .order('name'),
      supabase
        .from('tickets')
        .select('id,ticket_message_id,player_id,player_name,region,dai,loai,loai_label,so_list,tien_dat,xac,status,tien_thang,ghi_chu,source_text,created_at')
        .eq('owner_id', user.id)
        .eq('message_date', date)
        .order('created_at', { ascending: false }),
    ]);

    if (players.error) throw players.error;
    if (tickets.error) throw tickets.error;

    return jsonOk({
      profile,
      config: {
        region: 'all',
        regionName: 'Cả ngày',
        activeDai: [],
      },
      players: players.data || [],
      tickets: tickets.data || [],
      drawResults: [],
      summary: summarizeDbTickets(tickets.data || []),
    });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}

function summarizeDbTickets(tickets: any[]) {
  const byPlayer = new Map<string, { playerId: string | null; playerName: string; soVe: number; tongXac: number; tongTrung: number; laiLo: number }>();
  for (const ticket of tickets) {
    const key = ticket.player_id || ticket.player_name || 'Khach';
    const row = byPlayer.get(key) || { playerId: ticket.player_id || null, playerName: ticket.player_name || 'Khach', soVe: 0, tongXac: 0, tongTrung: 0, laiLo: 0 };
    row.soVe += 1;
    row.tongXac += Number(ticket.xac || 0);
    row.tongTrung += Number(ticket.tien_thang || 0);
    row.laiLo = row.tongTrung - row.tongXac;
    byPlayer.set(key, row);
  }
  return [...byPlayer.values()];
}
