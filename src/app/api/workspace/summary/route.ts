import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { type Region } from '@/lib/core';
import { jsonError, jsonOk } from '@/lib/http';
import { dateSchema, regionSchema } from '@/lib/validation';
import {
  filterTicketsByPlayer,
  groupByDai,
  groupDailyByRegion,
  groupByPlayer,
  groupByStatus,
  groupByType,
  playerSummaryFromDaily,
  summarizeTickets,
  summaryConfig,
  totalsFromPlayerSummary,
  type RegionScope,
} from '@/lib/workspace-server';

export const runtime = 'nodejs';

const regionScopeSchema = z.union([regionSchema, z.literal('all')]);
const playerIdSchema = z.string().uuid().optional();
const sectionSchema = z.enum(['overview', 'details', 'full']).default('full');

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile } = await requireActiveUser();
    const url = new URL(request.url);
    const date = dateSchema.parse(url.searchParams.get('date'));
    const region = regionScopeSchema.parse(url.searchParams.get('region')) as RegionScope;
    const playerId = playerIdSchema.parse(url.searchParams.get('playerId') || undefined);
    const section = sectionSchema.parse(url.searchParams.get('section') || undefined);

    const players = await supabase
      .from('players')
      .select('id,name,active')
      .eq('owner_id', user.id)
      .eq('active', true)
      .order('name');

    if (players.error) throw players.error;

    if (section === 'details') {
      const tickets = await buildTicketQuery(supabase, user.id, date, region);
      if (tickets.error) throw tickets.error;

      const scopedTickets = filterTicketsByPlayer(tickets.data || [], players.data || [], playerId);
      return jsonOk({
        byDai: groupByDai(scopedTickets),
        byStatus: groupByStatus(scopedTickets),
        byType: groupByType(scopedTickets),
      });
    }

    const [dailySummary, ticketStats] = await Promise.all([
      supabase
        .from('ticket_daily_summary')
        .select('region,player_name,so_ve,tong_xac,tong_trung,lai_lo')
        .eq('owner_id', user.id)
        .eq('message_date', date)
        .in('region', region === 'all' ? ['nam', 'trung', 'bac'] : [region]),
      buildTicketStatsQuery(supabase, user.id, date, region),
    ]);

    if (dailySummary.error) throw dailySummary.error;
    if (ticketStats.error) throw ticketStats.error;

    const playerRows = players.data || [];
    const scopedStats = filterTicketsByPlayer(ticketStats.data || [], playerRows, playerId);
    const playerName = playerId ? playerRows.find(player => player.id === playerId)?.name : '';
    const dailyRows = (dailySummary.data || []).filter(row => !playerName || row.player_name === playerName);
    const summaryRows = playerSummaryFromDaily(dailyRows);

    if (section === 'overview') {
      return jsonOk({
        profile,
        config: summaryConfig(region, date),
        players: playerRows,
        totals: totalsFromPlayerSummary(summaryRows, scopedStats),
        summary: summaryRows,
        topPlayers: summaryRows.slice(0, 5),
        byRegion: groupDailyByRegion(dailyRows),
      });
    }

    const tickets = await buildTicketQuery(supabase, user.id, date, region);
    if (tickets.error) throw tickets.error;
    const scopedTickets = filterTicketsByPlayer(tickets.data || [], playerRows, playerId);

    return jsonOk({
      profile,
      config: summaryConfig(region, date),
      players: playerRows,
      totals: summarizeTickets(scopedStats),
      summary: summaryRows,
      topPlayers: summaryRows.slice(0, 5),
      byDai: groupByDai(scopedTickets),
      byRegion: groupDailyByRegion(dailyRows),
      byStatus: groupByStatus(scopedTickets),
      byType: groupByType(scopedTickets),
    });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}

function buildTicketQuery(supabase: any, ownerId: string, date: string, region: RegionScope) {
  let query = supabase
    .from('tickets')
    .select('id,player_id,player_name,region,dai,loai,loai_label,status,xac,tien_thang')
    .eq('owner_id', ownerId)
    .eq('message_date', date);

  if (region !== 'all') {
    query = query.eq('region', region as Region);
  }

  return query;
}

function buildTicketStatsQuery(supabase: any, ownerId: string, date: string, region: RegionScope) {
  let query = supabase
    .from('tickets')
    .select('id,player_id,player_name,region,status,xac,tien_thang')
    .eq('owner_id', ownerId)
    .eq('message_date', date);

  if (region !== 'all') {
    query = query.eq('region', region as Region);
  }

  return query;
}
