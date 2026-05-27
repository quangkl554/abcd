import { getConfig, parseDrawResultText, type Region } from './core';
import { resultSourceUrl } from './result-sources';

type SupabaseLike = any;

export async function fetchAndStoreDrawResults(args: {
  supabase: SupabaseLike;
  ownerId: string;
  date: string;
  region: Region;
}) {
  const url = resultSourceUrl(args.region);
  if (!url) return { ok: false, needsManual: true, reason: 'Chưa cấu hình URL kết quả.' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 XosoWeb/1.0',
      },
    });
  } catch {
    return { ok: false, needsManual: true, reason: 'Không tải được nguồn kết quả tự động.' };
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    return { ok: false, needsManual: true, reason: `URL kết quả trả HTTP ${response.status}.` };
  }

  const text = await response.text();
  const draw = parseDrawResultText(text, args.region);
  if (!isUsableDraw(args.region, draw.results)) {
    return { ok: false, needsManual: true, reason: 'Không nhận đủ kết quả từ URL.', rawText: text.slice(0, 2000) };
  }

  const rows = Object.entries(draw.results).map(([dai, prizes]) => ({
    owner_id: args.ownerId,
    result_date: args.date,
    region: args.region,
    dai,
    prizes,
    source: url,
    fetched_at: new Date().toISOString(),
  }));

  const { data, error } = await args.supabase
    .from('draw_results')
    .upsert(rows, { onConflict: 'owner_id,result_date,region,dai' })
    .select('*');
  if (error) throw error;

  return { ok: true, needsManual: false, drawResults: data || [], activeDai: draw.activeDai, source: url };
}

function isUsableDraw(region: Region, results: Record<string, Record<string, string[]>>) {
  const cfg = getConfig(region);
  const requiredKeys = cfg.prizeRows.map((row: any) => row.key);
  return Object.values(results || {}).some(prizes => requiredKeys.every((key: string) => Array.isArray(prizes[key]) && prizes[key].length > 0));
}
