import { authErrorResponse, requireActiveUser } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { user, profile } = await requireActiveUser();
    return jsonOk({ user: { id: user.id, email: user.email }, profile });
  } catch (error) {
    const mapped = authErrorResponse(error);
    return jsonError(mapped.message, mapped.status);
  }
}
