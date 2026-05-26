import { type NextRequest } from 'next/server';
import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';
import { dateSchema, regionSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await requireActiveUser();
    const body = await request.json();
    if (body.confirm !== 'XOA KQ') return jsonError('Cần xác nhận bằng chữ XOA KQ.', 400);
    const date = dateSchema.parse(body.date);
    const region = regionSchema.parse(body.region);

    const { error } = await supabase
      .from('draw_results')
      .delete()
      .eq('owner_id', user.id)
      .eq('result_date', date)
      .eq('region', region);
    if (error) throw error;

    return jsonOk({ date, region });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status || 400);
  }
}
