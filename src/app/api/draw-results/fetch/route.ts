import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { drawRequestSchema } from '@/lib/validation';
import { type Region } from '@/lib/core';
import { fetchAndStoreDrawResults } from '@/lib/draw-results-store';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const input = drawRequestSchema.parse(await request.json());
    const region = input.region as Region;
    const result = await fetchAndStoreDrawResults({ supabase, ownerId: user.id, date: input.date, region });
    if (!result.ok) {
      return jsonOk({ needsManual: true, reason: result.reason, rawText: result.rawText });
    }
    return jsonOk({ needsManual: false, drawResults: result.drawResults, activeDai: result.activeDai, source: result.source });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
