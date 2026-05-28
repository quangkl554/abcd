import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { type Region } from '@/lib/core';
import { jsonError, jsonOk } from '@/lib/http';
import { dateSchema, regionSchema } from '@/lib/validation';
import { attachTicketSourceLines, groupByPlayer, regionConfig } from '@/lib/workspace-server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile } = await requireActiveUser();
    const url = new URL(request.url);
    const date = dateSchema.parse(url.searchParams.get('date'));
    const region = regionSchema.parse(url.searchParams.get('region')) as Region;

    const [players, messages, tickets, issues] = await Promise.all([
      supabase
        .from('players')
        .select('id,name,active,rate_profile,created_at')
        .eq('owner_id', user.id)
        .eq('active', true)
        .order('name'),
      supabase
        .from('ticket_messages')
        .select('id,created_at,player_id,player_name,raw_text')
        .eq('owner_id', user.id)
        .eq('message_date', date)
        .eq('region', region)
        .order('created_at', { ascending: false }),
      supabase
        .from('tickets')
        .select('id,ticket_message_id,player_id,player_name,dai,loai,loai_label,so_list,tien_dat,xac,status,tien_thang,ghi_chu,source_text,created_at')
        .eq('owner_id', user.id)
        .eq('message_date', date)
        .eq('region', region)
        .order('created_at', { ascending: false }),
      supabase
        .from('parse_issues')
        .select('id,ticket_message_id,status,warning,line_no,source_text,created_at')
        .eq('owner_id', user.id)
        .eq('message_date', date)
        .eq('region', region)
        .order('created_at', { ascending: false }),
    ]);

    for (const result of [players, messages, tickets, issues]) {
      if (result.error) throw result.error;
    }

    const ticketRows = attachTicketSourceLines(tickets.data || [], messages.data || []);

    return jsonOk({
      profile,
      config: regionConfig(region, date),
      players: players.data || [],
      messages: (messages.data || []).map(({ raw_text: _rawText, ...message }) => message),
      tickets: ticketRows,
      issues: issues.data || [],
      summary: groupByPlayer(ticketRows),
    });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
