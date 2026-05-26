import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { createTicketMessageSchema } from '@/lib/validation';
import { parseAndStoreTicketMessage } from '@/lib/store-ticket-message';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const input = createTicketMessageSchema.parse(await request.json());
    const result = await parseAndStoreTicketMessage({
      supabase,
      ownerId: user.id,
      date: input.date,
      region: input.region,
      text: input.text,
      playerId: input.playerId || null,
    });
    return jsonOk(result, { status: 201 });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
