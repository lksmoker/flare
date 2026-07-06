-- External Support Channel V0 backend-only provider config storage
-- Source: docs/00_product/flare_external_support_channel_v0.md
--
-- Product rules supported here:
-- - GroupMe OAuth access tokens remain backend-only
-- - support_channels.provider_config_ref stays opaque and token-free
-- - provisioning can safely resolve bot config by backend reference

create table if not exists public.support_channel_provider_configs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null default 'authorized',

  -- Backend-only provider credential. Never expose through mobile/user APIs.
  access_token text not null,

  provider_user_id text,
  provider_user_name text,

  bot_id text,
  external_group_id text,
  external_group_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint support_channel_provider_configs_provider_check
    check (provider in ('groupme')),

  constraint support_channel_provider_configs_status_check
    check (status in ('authorized', 'provisioned')),

  constraint support_channel_provider_configs_access_token_nonempty_check
    check (length(trim(access_token)) > 0)
);

create index if not exists support_channel_provider_configs_user_id_idx
  on public.support_channel_provider_configs (user_id);

create index if not exists support_channel_provider_configs_provider_idx
  on public.support_channel_provider_configs (provider);

create index if not exists support_channel_provider_configs_status_idx
  on public.support_channel_provider_configs (status);

create index if not exists support_channel_provider_configs_updated_at_idx
  on public.support_channel_provider_configs (updated_at desc);

drop trigger if exists support_channel_provider_configs_set_updated_at on public.support_channel_provider_configs;
create trigger support_channel_provider_configs_set_updated_at
before update on public.support_channel_provider_configs
for each row
execute function public.set_external_support_channel_updated_at();

alter table public.support_channel_provider_configs enable row level security;

grant all privileges on table public.support_channel_provider_configs to service_role;
revoke all on table public.support_channel_provider_configs from authenticated;
revoke all on table public.support_channel_provider_configs from anon;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'support_channel_provider_configs'
      and policyname = 'support_channel_provider_configs_service_role_all'
  ) then
    create policy support_channel_provider_configs_service_role_all
      on public.support_channel_provider_configs
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

comment on table public.support_channel_provider_configs is
  'Backend-only GroupMe provider authorization and bot provisioning records for External Support Channel V0.';

comment on column public.support_channel_provider_configs.access_token is
  'Backend-only GroupMe access token. Never expose through user-facing APIs, logs, or support_channels rows.';
