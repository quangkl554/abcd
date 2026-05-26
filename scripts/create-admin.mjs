import { createClient } from '@supabase/supabase-js';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey || !password || url.includes('PASTE_') || serviceKey.includes('PASTE_') || password.includes('PASTE_')) {
  console.error('Missing .env.local values. Fill NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ADMIN_PASSWORD.');
  process.exit(1);
}

if (!/^https?:\/\//i.test(url)) {
  console.error('Invalid NEXT_PUBLIC_SUPABASE_URL. It must look like https://your-project-ref.supabase.co');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = `${username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '')}@xoso.local`;
const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { username },
});

if (createError && !String(createError.message || '').toLowerCase().includes('already')) {
  console.error(createError.message);
  process.exit(1);
}

let userId = created?.user?.id;
if (!userId) {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error(listError.message);
    process.exit(1);
  }
  userId = users.users.find(user => user.email === email)?.id;
}

if (!userId) {
  console.error(`Could not resolve auth user for ${username}.`);
  process.exit(1);
}

const { error: profileError } = await supabase
  .from('profiles')
  .upsert(
    {
      user_id: userId,
      username: username.trim().toLowerCase(),
      role: 'admin',
      active: true,
    },
    { onConflict: 'user_id' },
  );

if (profileError) {
  console.error(profileError.message);
  process.exit(1);
}

console.log(`Admin ready: ${username}`);
