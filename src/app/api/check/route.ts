import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { checkRequestSchema } from '@/lib/validation';
import { checkTickets, summarizeTickets, type Region } from '@/lib/core';
import { dbTicketToCore, mapStatus } from '@/lib/tickets';

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
    const draws = drawResult.data || [];
    if (!tickets.length) return jsonOk({ checked: [], summary: [], message: 'Chua co ve de do.' });
    if (!draws.length) return jsonOk({ needsResults: true, checked: [], summary: [], message: 'Chua co ket qua xo so.' });

    const drawMap = Object.fromEntries(draws.map((row: any) => [row.dai, row.prizes]));
    const checked = checkTickets(tickets.map(dbTicketToCore), drawMap, { region, activeDai: draws.map((row: any) => row.dai) });

    await Promise.all(
      checked.map(ticket =>
        supabase
          .from('tickets')
          .update({
            status: mapStatus(ticket.ketQua || '?'),
            tien_thang: ticket.tienThang || 0,
            ghi_chu: ticket.ghiChu || '',
            hits: ticket.hits || [],
            checked_at: new Date().toISOString(),
          })
          .eq('owner_id', user.id)
          .eq('id', ticket.id),
      ),
    );

    return jsonOk({ checked, summary: summarizeTickets(checked) });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
