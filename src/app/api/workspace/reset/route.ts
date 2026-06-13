import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { dateSchema, regionSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const body = await request.json();
    const scope = body.scope === 'all' ? 'all' : body.scope === 'player-day-region' ? 'player-day-region' : 'day-region';
    if (body.confirm !== 'XOA TAT CA') return jsonError('Can xac nhan bang chu XOA TAT CA.', 400);

    if (scope === 'all') {
      await deleteForUser(supabase, user.id, 'parse_issues');
      await deleteForUser(supabase, user.id, 'tickets');
      await deleteForUser(supabase, user.id, 'ticket_messages');
      await deleteForUser(supabase, user.id, 'draw_results');
      return jsonOk({ scope });
    }

    const date = dateSchema.parse(body.date);
    const region = regionSchema.parse(body.region);

    if (scope === 'player-day-region') {
      const player = await resolveResetPlayer(supabase, user.id, {
        playerId: typeof body.playerId === 'string' ? body.playerId : null,
        playerName: typeof body.playerName === 'string' ? body.playerName : null,
      });
      if (!player) return jsonError('Chua chon khach de xoa du lieu.', 400);
      const deleted = await deletePlayerDayRegion(supabase, user.id, date, region, player);
      return jsonOk({ scope, date, region, player, deleted });
    }

    await deleteForUser(supabase, user.id, 'parse_issues', date, region, 'message_date');
    await deleteForUser(supabase, user.id, 'tickets', date, region, 'message_date');
    await deleteForUser(supabase, user.id, 'ticket_messages', date, region, 'message_date');
    await deleteForUser(supabase, user.id, 'draw_results', date, region, 'result_date');
    return jsonOk({ scope, date, region });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}

async function deleteForUser(supabase: any, ownerId: string, table: string, date?: string, region?: string, dateColumn = 'message_date') {
  let query = supabase.from(table).delete().eq('owner_id', ownerId);
  if (date) query = query.eq(dateColumn, date);
  if (region) query = query.eq('region', region);
  const { error } = await query;
  if (error) throw error;
}

async function resolveResetPlayer(
  supabase: any,
  ownerId: string,
  input: { playerId?: string | null; playerName?: string | null },
) {
  const playerId = input.playerId?.trim();
  const playerName = input.playerName?.trim();
  if (!playerId && !playerName) return null;

  let query = supabase
    .from('players')
    .select('id,name')
    .eq('owner_id', ownerId)
    .limit(1);

  if (playerId) query = query.eq('id', playerId);
  else query = query.eq('name', playerName);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (data) return { id: data.id as string, name: data.name as string };
  return playerName ? { id: playerId || '', name: playerName } : null;
}

async function deletePlayerDayRegion(
  supabase: any,
  ownerId: string,
  date: string,
  region: string,
  player: { id: string; name: string },
) {
  let messageQuery = supabase
    .from('ticket_messages')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('message_date', date)
    .eq('region', region);
  messageQuery = applyPlayerFilter(messageQuery, player);

  const { data: messages, error: messagesError } = await messageQuery;
  if (messagesError) throw messagesError;

  const messageIds = (messages || []).map((message: { id: string }) => message.id);
  const issues = messageIds.length
    ? await deleteSelected(supabase
      .from('parse_issues')
      .delete()
      .eq('owner_id', ownerId)
      .in('ticket_message_id', messageIds))
    : 0;

  const ticketsByMessage = messageIds.length
    ? await deleteSelected(supabase
      .from('tickets')
      .delete()
      .eq('owner_id', ownerId)
      .eq('message_date', date)
      .eq('region', region)
      .in('ticket_message_id', messageIds))
    : 0;

  let ticketsByPlayerQuery = supabase
    .from('tickets')
    .delete()
    .eq('owner_id', ownerId)
    .eq('message_date', date)
    .eq('region', region);
  ticketsByPlayerQuery = applyPlayerFilter(ticketsByPlayerQuery, player);
  const ticketsByPlayer = await deleteSelected(ticketsByPlayerQuery);

  const ticketMessages = messageIds.length
    ? await deleteSelected(supabase
      .from('ticket_messages')
      .delete()
      .eq('owner_id', ownerId)
      .in('id', messageIds))
    : 0;

  return {
    parseIssues: issues,
    tickets: ticketsByMessage + ticketsByPlayer,
    ticketMessages,
  };
}

function applyPlayerFilter(query: any, player: { id: string; name: string }) {
  if (player.id) {
    return query.or(`player_id.eq.${player.id},and(player_id.is.null,player_name.eq.${quotePostgrestValue(player.name)})`);
  }
  return query.eq('player_name', player.name);
}

async function deleteSelected(query: any) {
  const { data, error } = await query.select('id');
  if (error) throw error;
  return data?.length || 0;
}

function quotePostgrestValue(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
