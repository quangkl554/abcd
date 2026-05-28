import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { checkRequestSchema } from '@/lib/validation';
import { checkTickets, summarizeTickets, type Region } from '@/lib/core';
import { dbTicketToCore, mapStatus } from '@/lib/tickets';
import { fetchAndStoreDrawResults } from '@/lib/draw-results-store';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const input = checkRequestSchema.parse(await request.json());
    const region = input.region as Region;

    const [ticketResult, drawResult] = await Promise.all([
      supabase.from('tickets').select('*').eq('owner_id', user.id).eq('message_date', input.date).eq('region', region),
      supabase.from('draw_results').select('*').eq('owner_id', user.id).eq('result_date', input.date).eq('region', region),
    ]);
    if (ticketResult.error) throw ticketResult.error;
    if (drawResult.error) throw drawResult.error;

    const tickets = ticketResult.data || [];
    let draws = drawResult.data || [];
    if (!tickets.length) return jsonOk({ checked: [], summary: [], message: 'Chua co ve de do.' });
    let autoFetched = false;
    if (!draws.length) {
      const fetched = await fetchAndStoreDrawResults({ supabase, ownerId: user.id, date: input.date, region });
      if (!fetched.ok) {
        return jsonOk({
          needsResults: true,
          checked: [],
          summary: [],
          sourceAttempts: fetched.sourceAttempts || [],
          message: `${fetched.reason || 'Chưa có kết quả xổ số.'} Hãy vào trang Kết quả để kiểm tra nguồn hoặc dán tay.`,
        });
      }
      draws = fetched.drawResults || [];
      autoFetched = true;
    }

    const drawMap = Object.fromEntries(draws.map((row: any) => [row.dai, row.prizes]));
    const checked = checkTickets(tickets.map(dbTicketToCore), drawMap, { region, activeDai: draws.map((row: any) => row.dai) });

    const checkedAt = new Date().toISOString();
    const updateRows = checked.map((ticket, index) => ({
      ...tickets[index],
      status: mapStatus(ticket.ketQua || '?'),
      tien_thang: ticket.tienThang || 0,
      ghi_chu: ticket.ghiChu || '',
      hits: ticket.hits || [],
      checked_at: checkedAt,
    }));
    const { error: updateError } = await supabase.from('tickets').upsert(updateRows, { onConflict: 'id' });
    if (updateError) throw updateError;

    return jsonOk({ checked, summary: summarizeTickets(checked), autoFetched });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
