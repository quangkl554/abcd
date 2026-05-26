import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';

export const runtime = 'nodejs';

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase, user } = await requireActiveUser();
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
