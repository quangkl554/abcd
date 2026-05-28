import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { reparseSchema } from '@/lib/validation';
import { reparseTicketMessage } from '@/lib/store-ticket-message';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase, user } = await requireActiveUser();
    const input = reparseSchema.parse(await request.json());
    const result = await reparseTicketMessage({
      supabase,
      ownerId: user.id,
      messageId: id,
      correctedText: input.correctedText,
      issueId: input.issueId,
      sourceText: input.sourceText,
      mode: input.mode,
    });
    return jsonOk(result);
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
