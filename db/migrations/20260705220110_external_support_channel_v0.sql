-- External Support Channel V0 DB foundation
-- Source: docs/00_product/flare_external_support_channel_v0.md
--
-- Product rules supported here:
-- - one active/enabled external support channel per user
-- - provider-agnostic model, with groupme as the only V0 provider
-- - selected external group/destination is stored per user
-- - saved setup-time message is stored; no per-send custom message required
-- - test and real sends are recorded separately
-- - failed external delivery can be recorded accurately
-- - provider secrets are not stored directly in mobile-readable channel rows

create extension if not exists pgcrypto;

create table if not exists public.support_channels (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  provider text not null,
  status text not null default 'disabled',
  enabled boolean not null default false,

  external_group_id text,
  external_group_name text,

  -- Safe opaque reference only. Do not store raw provider tokens here.
  provider_config_ref text,

  default_message text not null,

  last_delivery_status text,
  last_delivery_at timestamptz,
  last_error_code text,
  last_error_message_safe text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint support_channels_provider_check
    check (provider in ('groupme')),

  constraint support_channels_status_check
    check (status in ('disabled', 'connected', 'reconnect_required', 'disconnected')),

  constraint support_channels_default_message_nonempty_check
    check (length(trim(default_message)) > 0),

  constraint support_channels_external_group_when_enabled_check
    check (
      enabled = false
      or (
        status = 'connected'
        and external_group_id is not null
        and length(trim(external_group_id)) > 0
      )
    )
);

create unique index if not exists support_channels_one_enabled_per_user_idx
  on public.support_channels (user_id)
  where enabled = true;

create index if not exists support_channels_user_id_idx
  on public.support_channels (user_id);

create index if not exists support_channels_provider_idx
  on public.support_channels (provider);

create index if not exists support_channels_status_idx
  on public.support_channels (status);

create index if not exists support_channels_updated_at_idx
  on public.support_channels (updated_at desc);

create table if not exists public.support_channel_delivery_attempts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  support_channel_id uuid references public.support_channels(id) on delete set null,

  -- Nullable for test flare or if local flare event storage is introduced/linked later.
  flare_event_id uuid,

  provider text not null,
  send_kind text not null,

  destination_id text,
  destination_name text,

  -- Exact message attempted. This is required for auditability and retry/debug clarity.
  message_snapshot text not null,

  status text not null default 'pending',

  provider_message_id text,

  attempted_at timestamptz not null default now(),
  delivered_at timestamptz,

  error_code text,
  error_message_safe text,

  -- Optional safe reference to backend/provider diagnostics.
  -- Do not store raw provider secrets, raw token payloads, or unsafe response bodies here.
  raw_provider_status_ref text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint support_channel_delivery_attempts_provider_check
    check (provider in ('groupme')),

  constraint support_channel_delivery_attempts_send_kind_check
    check (send_kind in ('test', 'real')),

  constraint support_channel_delivery_attempts_status_check
    check (status in ('pending', 'sent', 'failed', 'blocked')),

  constraint support_channel_delivery_attempts_message_nonempty_check
    check (length(trim(message_snapshot)) > 0),

  constraint support_channel_delivery_attempts_delivered_status_check
    check (
      (status = 'sent' and delivered_at is not null)
      or status <> 'sent'
    ),

  constraint support_channel_delivery_attempts_error_status_check
    check (
      status not in ('failed', 'blocked')
      or error_code is not null
      or error_message_safe is not null
    )
);

create index if not exists support_channel_delivery_attempts_user_id_idx
  on public.support_channel_delivery_attempts (user_id);

create index if not exists support_channel_delivery_attempts_channel_id_idx
  on public.support_channel_delivery_attempts (support_channel_id);

create index if not exists support_channel_delivery_attempts_provider_idx
  on public.support_channel_delivery_attempts (provider);

create index if not exists support_channel_delivery_attempts_send_kind_idx
  on public.support_channel_delivery_attempts (send_kind);

create index if not exists support_channel_delivery_attempts_status_idx
  on public.support_channel_delivery_attempts (status);

create index if not exists support_channel_delivery_attempts_attempted_at_idx
  on public.support_channel_delivery_attempts (attempted_at desc);

create index if not exists support_channel_delivery_attempts_user_recent_idx
  on public.support_channel_delivery_attempts (user_id, attempted_at desc);

create or replace function public.set_external_support_channel_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists support_channels_set_updated_at on public.support_channels;
create trigger support_channels_set_updated_at
before update on public.support_channels
for each row
execute function public.set_external_support_channel_updated_at();

drop trigger if exists support_channel_delivery_attempts_set_updated_at on public.support_channel_delivery_attempts;
create trigger support_channel_delivery_attempts_set_updated_at
before update on public.support_channel_delivery_attempts
for each row
execute function public.set_external_support_channel_updated_at();

alter table public.support_channels enable row level security;
alter table public.support_channel_delivery_attempts enable row level security;

grant select, insert, update, delete on table public.support_channels to authenticated;
grant select, insert on table public.support_channel_delivery_attempts to authenticated;
grant all privileges on table public.support_channels to service_role;
grant all privileges on table public.support_channel_delivery_attempts to service_role;
revoke all on table public.support_channels from anon;
revoke all on table public.support_channel_delivery_attempts from anon;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'support_channels'
      and policyname = 'support_channels_select_own'
  ) then
    create policy support_channels_select_own
      on public.support_channels
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'support_channels'
      and policyname = 'support_channels_insert_own'
  ) then
    create policy support_channels_insert_own
      on public.support_channels
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'support_channels'
      and policyname = 'support_channels_update_own'
  ) then
    create policy support_channels_update_own
      on public.support_channels
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'support_channels'
      and policyname = 'support_channels_delete_own'
  ) then
    create policy support_channels_delete_own
      on public.support_channels
      for delete
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'support_channel_delivery_attempts'
      and policyname = 'support_channel_delivery_attempts_select_own'
  ) then
    create policy support_channel_delivery_attempts_select_own
      on public.support_channel_delivery_attempts
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'support_channel_delivery_attempts'
      and policyname = 'support_channel_delivery_attempts_insert_own'
  ) then
    create policy support_channel_delivery_attempts_insert_own
      on public.support_channel_delivery_attempts
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

comment on table public.support_channels is
  'External Support Channel V0 user-owned provider-agnostic support channel configuration. GroupMe is the only V0 provider.';

comment on column public.support_channels.provider_config_ref is
  'Opaque backend-only provider credential/config reference. Must not contain raw provider tokens or secrets.';

comment on table public.support_channel_delivery_attempts is
  'Append-only-ish external support channel delivery attempts for test and real flare sends.';

comment on column public.support_channel_delivery_attempts.message_snapshot is
  'Exact message attempted for this delivery. Test and real sends must remain distinguishable by send_kind and message text.';

comment on column public.support_channel_delivery_attempts.raw_provider_status_ref is
  'Safe backend/provider diagnostic reference only. Do not store raw secrets, token payloads, stack traces, or unsafe provider responses.';
