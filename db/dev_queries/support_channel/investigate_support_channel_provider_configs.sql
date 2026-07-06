select
  'support_channel' as record_kind,
  sc.id::text as record_id,
  sc.user_id::text as user_id,
  sc.provider,
  sc.status,
  sc.enabled,
  sc.external_group_id,
  sc.external_group_name,
  sc.provider_config_ref,
  null::text as provider_user_id,
  null::text as provider_user_name,
  null::text as bot_id,
  null::boolean as access_token_present,
  sc.created_at,
  sc.updated_at
from public.support_channels sc
where sc.provider = 'groupme'

union all

select
  'provider_config' as record_kind,
  cfg.id::text as record_id,
  cfg.user_id::text as user_id,
  cfg.provider,
  cfg.status,
  null::boolean as enabled,
  cfg.external_group_id,
  cfg.external_group_name,
  null::text as provider_config_ref,
  cfg.provider_user_id,
  cfg.provider_user_name,
  cfg.bot_id,
  (cfg.access_token is not null and length(trim(cfg.access_token)) > 0) as access_token_present,
  cfg.created_at,
  cfg.updated_at
from public.support_channel_provider_configs cfg
where cfg.provider = 'groupme'

order by user_id, record_kind, updated_at desc;
