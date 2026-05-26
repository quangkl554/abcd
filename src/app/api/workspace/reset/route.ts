import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { dateSchema, regionSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const body = await request.json();
    const scope = body.scope === 'all' ? 'all' : 'day-region';
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
