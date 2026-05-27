create index if not exists idx_players_owner_active_name
on public.players(owner_id, active, name);

create index if not exists idx_ticket_messages_owner_date_region_player
on public.ticket_messages(owner_id, message_date, region, player_id, created_at desc);

create index if not exists idx_tickets_owner_date_region_player
on public.tickets(owner_id, message_date, region, player_id, created_at desc);

create index if not exists idx_tickets_owner_date_player
on public.tickets(owner_id, message_date, player_id);
