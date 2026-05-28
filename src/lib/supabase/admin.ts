import { createClient } from '@supabase/supabase-js';

let adminClientInstance: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (adminClientInstance) return adminClientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase admin environment variables');
  
  adminClientInstance = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  return adminClientInstance;
}
