import { getConfig, parseDrawResultText, type Region } from './core';
import { resultSourceUrls } from './result-sources';

type SupabaseLike = any;

export async function fetchAndStoreDrawResults(args: {
  supabase: SupabaseLike;
  ownerId: string;
  date: string;
  region: Region;
}) {
  const urls = resultSourceUrls(args.region, args.date);
  if (!urls.length) return { ok: false, needsManual: true, reason: 'Chưa cấu hình URL kết quả.', sourceAttempts: [] };

  const attempts: Array<{ source: string; ok: boolean; reason?: string }> = [];
  let rawText = '';
  for (const url of urls) {
    const fetched = await fetchDrawSource(url, args.region);
    attempts.push({ source: url, ok: fetched.ok, reason: fetched.reason });
    if (fetched.rawText) rawText = fetched.rawText;
    if (!fetched.ok || !fetched.draw) continue;

    const rows = Object.entries(fetched.draw.results).map(([dai, prizes]) => ({
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

    return { ok: true, needsManual: false, drawResults: data || [], activeDai: fetched.draw.activeDai, source: url, sourceAttempts: attempts };
  }

  const reason = attempts.length === 1
    ? attempts[0].reason || 'Không tải được nguồn kết quả tự động.'
    : `Đã thử ${attempts.length} nguồn nhưng chưa nhận đủ kết quả.`;
  return { ok: false, needsManual: true, reason, sourceAttempts: attempts, rawText };
}

async function fetchDrawSource(url: string, region: Region) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'vi-VN,vi;q=0.9,en;q=0.7',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) XosoWeb/1.0',
      },
    });
  } catch (error) {
    clearTimeout(timeout);
    if ((error as Error).name === 'AbortError') {
      return { ok: false, reason: 'Nguon ket qua phan hoi qua cham.' };
    }
    return { ok: false, reason: 'Không tải được nguồn kết quả tự động.' };
  }
  clearTimeout(timeout);

  if (!response.ok) {
    return { ok: false, reason: `URL kết quả trả HTTP ${response.status}.` };
  }

  const text = await response.text();
  const draw = parseDrawResultText(text, region);
  if (!isUsableDraw(region, draw.results)) {
    return { ok: false, reason: 'Không nhận đủ kết quả từ URL.', rawText: text.slice(0, 2000) };
  }
  return { ok: true, draw, rawText: text };
}

function isUsableDraw(region: Region, results: Record<string, Record<string, string[]>>) {
  const cfg = getConfig(region);
  const requiredKeys = cfg.prizeRows.map((row: any) => row.key);
  return Object.values(results || {}).some(prizes => requiredKeys.every((key: string) => Array.isArray(prizes[key]) && prizes[key].length > 0));
}
