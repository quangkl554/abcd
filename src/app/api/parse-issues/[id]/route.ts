import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { parseIssuePatchSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase, user } = await requireActiveUser();
    const input = parseIssuePatchSchema.parse(await request.json());
    const { data: issue, error: issueFindError } = await supabase
      .from('parse_issues')
      .select('id,ticket_message_id,source_text')
      .eq('owner_id', user.id)
      .eq('id', id)
      .single();
    if (issueFindError) throw issueFindError;

    let query = supabase
      .from('parse_issues')
      .update({
        status: input.status,
        resolved_at: input.status === 'open' ? null : new Date().toISOString(),
      })
      .eq('owner_id', user.id)
      .eq('ticket_message_id', issue.ticket_message_id);
    query = issue.source_text ? query.eq('source_text', issue.source_text) : query.eq('id', id);
    const { data, error } = await query.select('*');
    if (error) throw error;
    return jsonOk({ issue: data?.[0] || null, issues: data || [] });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
