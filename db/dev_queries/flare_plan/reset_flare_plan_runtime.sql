delete from public.flare_plan_idempotency_keys
where user_id = :'user_id';

delete from public.flare_plan_runs
where flare_event_id in (
  select id
  from public.flare_events
  where user_id = :'user_id'
);

delete from public.flare_plan_actions
where plan_id in (
  select id
  from public.flare_plans
  where user_id = :'user_id'
);

delete from public.flare_plans
where user_id = :'user_id';
