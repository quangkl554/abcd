import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { deleteTicketMessageScope } from '@/lib/store-ticket-message';

export const runtime = 'nodejs';

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase, user } = await requireActiveUser();
    const body = await readOptionalJson(_request);
    if (body && (body.ticketId || body.sourceText || typeof body.sourceLineNo === 'number')) {
      const result = await deleteTicketMessageScope({
        supabase,
        ownerId: user.id,
        messageId: id,
        ticketId: typeof body.ticketId === 'string' ? body.ticketId : undefined,
        sourceText: typeof body.sourceText === 'string' ? body.sourceText : undefined,
        sourceLineNo: typeof body.sourceLineNo === 'number' ? body.sourceLineNo : null,
        playerId: typeof body.playerId === 'string' ? body.playerId : null,
        playerName: typeof body.playerName === 'string' ? body.playerName : null,
        region: typeof body.region === 'string' ? body.region : null,
      });
      return jsonOk(result);
    }

    const { data, error } = await supabase
      .from('ticket_messages')
      .delete()
      .eq('owner_id', user.id)
      .eq('id', id)
      .select('id')
      .single();
    if (error) throw error;
    return jsonOk({ deleted: data });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}

async function readOptionalJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
