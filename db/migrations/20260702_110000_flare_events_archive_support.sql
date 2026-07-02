alter table public.flare_events
add column if not exists archived_at timestamp with time zone;

create index if not exists idx_flare_events_user_archived_created_at
    on public.flare_events (user_id, archived_at, created_at desc);
