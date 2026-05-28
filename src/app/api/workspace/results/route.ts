import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { type Region } from '@/lib/core';
import { jsonError, jsonOk } from '@/lib/http';
import { dateSchema, regionSchema } from '@/lib/validation';
import { groupByPlayer, regionConfig, summarizeTickets } from '@/lib/workspace-server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile } = await requireActiveUser();
    const url = new URL(request.url);
    const date = dateSchema.parse(url.searchParams.get('date'));
    const region = regionSchema.parse(url.searchParams.get('region')) as Region;

    const [tickets, initialDrawResults] = await Promise.all([
      supabase
        .from('tickets')
        .select('id,player_id,player_name,status,xac,tien_thang')
        .eq('owner_id', user.id)
        .eq('message_date', date)
        .eq('region', region),
      supabase
        .from('draw_results')
        .select('id,dai,source,prizes')
        .eq('owner_id', user.id)
        .eq('result_date', date)
        .eq('region', region)
        .order('dai'),
    ]);

    if (tickets.error) throw tickets.error;
    if (initialDrawResults.error) throw initialDrawResults.error;

    const ticketRows = tickets.data || [];
    const drawResults = initialDrawResults.data || [];

    return jsonOk({
      profile,
      config: regionConfig(region, date),
      drawResults,
      totals: summarizeTickets(ticketRows),
      summary: groupByPlayer(ticketRows),
      autoFetchAttempted: false,
      needsManual: false,
      fetchReason: '',
      sourceAttempts: [],
    });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
