select
  'plan' as record_kind,
  plan.id as plan_id,
  plan.user_id,
  plan.title as plan_title,
  plan.status as plan_status,
  plan.updated_at as plan_updated_at,
  action.id as action_id,
  action.legacy_behavior_pattern_id,
  action.source_template_key,
  action.title as action_title,
  action.position as action_position,
  action.status as action_status,
  null::uuid as run_id,
  null::text as run_status,
  null::uuid as run_action_id,
  null::text as run_action_outcome,
  null::text as checkpoint_status
from public.flare_plans plan
left join public.flare_plan_actions action
  on action.plan_id = plan.id
where plan.user_id = :'user_id'

union all

select
  'run' as record_kind,
  run.source_plan_id as plan_id,
  event.user_id,
  null::text as plan_title,
  null::text as plan_status,
  run.updated_at as plan_updated_at,
  run_action.source_action_id as action_id,
  null::uuid as legacy_behavior_pattern_id,
  run_action.source_template_key,
  run_action.title as action_title,
  run_action.position as action_position,
  null::text as action_status,
  run.id as run_id,
  run.status as run_status,
  run_action.id as run_action_id,
  run_action.outcome as run_action_outcome,
  checkpoint.status as checkpoint_status
from public.flare_plan_runs run
join public.flare_events event
  on event.id = run.flare_event_id
left join public.flare_plan_run_actions run_action
  on run_action.run_id = run.id
left join public.flare_plan_run_checkpoints checkpoint
  on checkpoint.run_id = run.id
where event.user_id = :'user_id'
order by record_kind, plan_updated_at desc nulls last, action_position nulls last, run_id nulls last;
