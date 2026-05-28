create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  role text not null default 'user' check (role in ('admin', 'user')),
  active boolean not null default true,
  active_session_id text,
  active_session_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  aliases text[] not null default '{}',
  rate_profile jsonb not null default '{"heSoXac":{},"tyLe":{}}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  message_date date not null,
  region text not null check (region in ('nam', 'trung', 'bac')),
  player_id uuid references public.players(id) on delete set null,
  player_name text,
  raw_text text not null,
  parse_json jsonb not null,
  warnings text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'reparsed', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ticket_message_id uuid references public.ticket_messages(id) on delete cascade,
  message_date date not null,
  player_id uuid references public.players(id) on delete set null,
  player_name text not null,
  region text not null check (region in ('nam', 'trung', 'bac')),
  dai text[] not null,
  loai text not null,
  loai_label text,
  so_list text[] not null,
  tien_dat numeric not null,
  chan numeric not null,
  so_giai numeric not null,
  he_so_xac numeric not null,
  ty_le_trung numeric not null,
  xac numeric not null,
  source_text text,
  status text not null default '?' check (status in ('?', 'TRUNG', 'Truot', 'Chua co KQ')),
  tien_thang numeric not null default 0,
  ghi_chu text not null default '',
  hits jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  checked_at timestamptz
);

create table if not exists public.parse_issues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ticket_message_id uuid references public.ticket_messages(id) on delete cascade,
  message_date date not null,
  region text not null check (region in ('nam', 'trung', 'bac')),
  warning text not null,
  line_no integer,
  source_text text,
  corrected_text text,
  status text not null default 'open' check (status in ('open', 'resolved', 'ignored')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.draw_results (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  result_date date not null,
  region text not null check (region in ('nam', 'trung', 'bac')),
  dai text not null,
  prizes jsonb not null,
  source text not null default 'manual',
  fetched_at timestamptz not null default now(),
  unique (owner_id, result_date, region, dai)
);

create index if not exists idx_players_owner on public.players(owner_id);
create index if not exists idx_profiles_active_session_id on public.profiles(active_session_id);
create index if not exists idx_ticket_messages_owner_date_region on public.ticket_messages(owner_id, message_date, region);
create index if not exists idx_tickets_owner_date_region on public.tickets(owner_id, message_date, region);
create index if not exists idx_tickets_owner_player on public.tickets(owner_id, player_name);
create index if not exists idx_parse_issues_owner_status on public.parse_issues(owner_id, status);
create index if not exists idx_draw_results_owner_date_region on public.draw_results(owner_id, result_date, region);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_players_touch on public.players;
create trigger trg_players_touch before update on public.players
for each row execute function public.touch_updated_at();

drop trigger if exists trg_ticket_messages_touch on public.ticket_messages;
create trigger trg_ticket_messages_touch before update on public.ticket_messages
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.tickets enable row level security;
alter table public.parse_issues enable row level security;
alter table public.draw_results enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "players_owner_all" on public.players;
create policy "players_owner_all"
on public.players for all to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "ticket_messages_owner_all" on public.ticket_messages;
create policy "ticket_messages_owner_all"
on public.ticket_messages for all to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "tickets_owner_all" on public.tickets;
create policy "tickets_owner_all"
on public.tickets for all to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "parse_issues_owner_all" on public.parse_issues;
create policy "parse_issues_owner_all"
on public.parse_issues for all to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "draw_results_owner_all" on public.draw_results;
create policy "draw_results_owner_all"
on public.draw_results for all to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create or replace view public.ticket_daily_summary as
select
  owner_id,
  message_date,
  region,
  player_name,
  count(*) as so_ve,
  coalesce(sum(xac), 0) as tong_xac,
  coalesce(sum(tien_thang), 0) as tong_trung,
  coalesce(sum(tien_thang), 0) - coalesce(sum(xac), 0) as lai_lo
from public.tickets
group by owner_id, message_date, region, player_name;
