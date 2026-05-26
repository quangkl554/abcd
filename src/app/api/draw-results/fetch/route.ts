import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { drawRequestSchema } from '@/lib/validation';
import { getConfig, parseDrawResultText, type Region } from '@/lib/core';
import { resultSourceUrl } from '@/lib/result-sources';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const input = drawRequestSchema.parse(await request.json());
    const region = input.region as Region;
    const url = resultSourceUrl(region);
    if (!url) return jsonOk({ needsManual: true, reason: 'Chua cau hinh URL ket qua.' });

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return jsonOk({ needsManual: true, reason: `URL ket qua tra HTTP ${response.status}.` });
    }

    const text = await response.text();
    const draw = parseDrawResultText(text, region);
    if (!isUsableDraw(region, draw.results)) {
      return jsonOk({ needsManual: true, reason: 'Khong nhan duoc ket qua tu URL.', rawText: text.slice(0, 2000) });
    }

    const rows = Object.entries(draw.results).map(([dai, prizes]) => ({
      owner_id: user.id,
      result_date: input.date,
      region,
      dai,
      prizes,
      source: url,
      fetched_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('draw_results')
      .upsert(rows, { onConflict: 'owner_id,result_date,region,dai' })
      .select('*');
    if (error) throw error;

    return jsonOk({ needsManual: false, drawResults: data || [], activeDai: draw.activeDai });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}

function isUsableDraw(region: Region, results: Record<string, Record<string, string[]>>) {
  const cfg = getConfig(region);
  const requiredKeys = cfg.prizeRows.map((row: any) => row.key);
  return Object.values(results || {}).some(prizes => requiredKeys.every((key: string) => Array.isArray(prizes[key]) && prizes[key].length > 0));
}
