import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { manualDrawSchema } from '@/lib/validation';
import { parseDrawResultText, type Region } from '@/lib/core';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const input = manualDrawSchema.parse(await request.json());
    const region = input.region as Region;
    const results = input.results || parseDrawResultText(input.text || '', region).results;

    const rows = Object.entries(results).map(([dai, prizes]) => ({
      owner_id: user.id,
      result_date: input.date,
      region,
      dai,
      prizes,
      source: input.text ? 'manual_text' : 'manual_form',
      fetched_at: new Date().toISOString(),
    }));

    if (!rows.length) return jsonError('Khong co ket qua de luu.', 400);

    const { data, error } = await supabase
      .from('draw_results')
      .upsert(rows, { onConflict: 'owner_id,result_date,region,dai' })
      .select('*');
    if (error) throw error;

    return jsonOk({ drawResults: data || [] });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
