-- Reconstruct the latest support-channel runtime story for one user/channel pair.
select
  sc.id as support_channel_id,
  sc.user_id,
  sc.provider,
  sc.status as channel_status,
  sc.enabled,
  sc.external_group_id,
  sc.external_group_name,
  sc.provider_config_ref,
  sc.last_delivery_status,
  sc.last_delivery_at,
  sc.last_error_code,
  sc.last_error_message_safe,
  sc.updated_at as channel_updated_at,
  attempt.id as delivery_attempt_id,
  attempt.send_kind,
  attempt.status as attempt_status,
  attempt.message_snapshot,
  attempt.provider_message_id,
  attempt.attempted_at,
  attempt.delivered_at,
  attempt.error_code as attempt_error_code,
  attempt.error_message_safe as attempt_error_message_safe,
  attempt.raw_provider_status_ref
from public.support_channels sc
left join public.support_channel_delivery_attempts attempt
  on attempt.support_channel_id = sc.id
where sc.user_id = :'user_id'
  and sc.id = :'support_channel_id'
order by attempt.attempted_at desc nulls last;
