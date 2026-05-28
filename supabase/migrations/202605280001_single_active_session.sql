alter table public.profiles
  add column if not exists active_session_id text,
  add column if not exists active_session_at timestamptz;

create index if not exists idx_profiles_active_session_id
on public.profiles(active_session_id);
