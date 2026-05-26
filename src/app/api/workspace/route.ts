import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { dateSchema, regionSchema } from '@/lib/validation';
import { getActiveDai, getConfig, type Region } from '@/lib/core';
import { parseWorkDate } from '@/lib/dates';
import { resultSourceUrl } from '@/lib/result-sources';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile } = await requireActiveUser();
    const url = new URL(request.url);
    const date = dateSchema.parse(url.searchParams.get('date'));
    const region = regionSchema.parse(url.searchParams.get('region')) as Region;

    const [players, messages, tickets, issues, drawResults] = await Promise.all([
      supabase.from('players').select('*').eq('owner_id', user.id).order('name'),
      supabase.from('ticket_messages').select('*').eq('owner_id', user.id).eq('message_date', date).eq('region', region).order('created_at', { ascending: false }),
      supabase.from('tickets').select('*').eq('owner_id', user.id).eq('message_date', date).eq('region', region).order('created_at', { ascending: false }),
      supabase.from('parse_issues').select('*').eq('owner_id', user.id).eq('message_date', date).eq('region', region).order('created_at', { ascending: false }),
      supabase.from('draw_results').select('*').eq('owner_id', user.id).eq('result_date', date).eq('region', region).order('dai'),
    ]);

    for (const result of [players, messages, tickets, issues, drawResults]) {
      if (result.error) throw result.error;
    }

    const cfg = getConfig(region);
    return jsonOk({
      profile,
      config: {
        region,
        regionName: cfg.name,
        daiList: cfg.daiList,
        prizeRows: cfg.prizeRows,
        heSoXacDefault: cfg.heSoXacDefault,
        tyLeDefault: cfg.tyLeDefault,
        activeDai: getActiveDai(region, parseWorkDate(date)),
        resultSourceUrl: resultSourceUrl(region),
      },
      players: players.data || [],
      messages: messages.data || [],
      tickets: tickets.data || [],
      issues: issues.data || [],
      drawResults: drawResults.data || [],
      summary: summarizeDbTickets(tickets.data || []),
    });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}

function summarizeDbTickets(tickets: any[]) {
  const byPlayer = new Map<string, { playerName: string; soVe: number; tongXac: number; tongTrung: number; laiLo: number }>();
  for (const ticket of tickets) {
    const key = ticket.player_name || 'Khach';
    const row = byPlayer.get(key) || { playerName: key, soVe: 0, tongXac: 0, tongTrung: 0, laiLo: 0 };
    row.soVe += 1;
    row.tongXac += Number(ticket.xac || 0);
    row.tongTrung += Number(ticket.tien_thang || 0);
    row.laiLo = row.tongTrung - row.tongXac;
    byPlayer.set(key, row);
  }
  return [...byPlayer.values()];
}
