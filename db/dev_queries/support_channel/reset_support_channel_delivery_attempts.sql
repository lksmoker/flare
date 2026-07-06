-- Remove delivery-attempt history for repeated dev-only spike testing.
delete from public.support_channel_delivery_attempts
where user_id = :'user_id'
  and (
    support_channel_id = :'support_channel_id'
    or :'support_channel_id' is null
  );
