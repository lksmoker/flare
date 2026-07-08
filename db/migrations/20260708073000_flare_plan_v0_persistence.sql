create extension if not exists pgcrypto;

create table public.flare_plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null default 'Flare Plan',
    description text,
    status text not null default 'active',
    archived_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint flare_plans_title_not_blank check (length(btrim(title)) between 1 and 120),
    constraint flare_plans_description_length_check check (
        description is null or length(btrim(description)) <= 300
    ),
    constraint flare_plans_status_check check (status in ('active', 'archived')),
    constraint flare_plans_archive_state_check check (
        (status = 'active' and archived_at is null)
        or (status = 'archived' and archived_at is not null)
    )
);

create table public.flare_plan_starter_templates (
    id uuid primary key default gen_random_uuid(),
    template_key text not null,
    title text not null,
    description text,
    category text not null,
    category_label text not null,
    display_position integer not null,
    status text not null default 'active',
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint flare_plan_starter_templates_template_key_not_blank check (length(btrim(template_key)) > 0),
    constraint flare_plan_starter_templates_title_not_blank check (length(btrim(title)) between 1 and 120),
    constraint flare_plan_starter_templates_description_length_check check (
        description is null or length(btrim(description)) <= 300
    ),
    constraint flare_plan_starter_templates_category_not_blank check (length(btrim(category)) > 0),
    constraint flare_plan_starter_templates_category_label_not_blank check (length(btrim(category_label)) > 0),
    constraint flare_plan_starter_templates_display_position_positive_check check (display_position >= 1),
    constraint flare_plan_starter_templates_status_check check (status in ('active', 'inactive')),
    constraint flare_plan_starter_templates_template_key_key unique (template_key)
);

create table public.flare_plan_actions (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.flare_plans(id) on delete cascade,
    source_template_key text,
    legacy_behavior_pattern_id uuid references public.behavior_patterns(id) on delete set null,
    title text not null,
    description text,
    position integer not null,
    status text not null default 'active',
    archived_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint flare_plan_actions_source_template_key_not_blank check (
        source_template_key is null or length(btrim(source_template_key)) > 0
    ),
    constraint flare_plan_actions_title_not_blank check (length(btrim(title)) between 1 and 120),
    constraint flare_plan_actions_description_length_check check (
        description is null or length(btrim(description)) <= 300
    ),
    constraint flare_plan_actions_position_positive_check check (position >= 1),
    constraint flare_plan_actions_status_check check (status in ('active', 'archived')),
    constraint flare_plan_actions_archive_state_check check (
        (status = 'active' and archived_at is null)
        or (status = 'archived' and archived_at is not null)
    )
);

create table public.flare_plan_runs (
    id uuid primary key default gen_random_uuid(),
    flare_event_id uuid not null references public.flare_events(id) on delete cascade,
    source_plan_id uuid references public.flare_plans(id) on delete set null,
    status text not null default 'offered',
    offered_at timestamp with time zone not null default now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint flare_plan_runs_status_check check (
        status in ('offered', 'declined', 'in_progress', 'completed', 'ended_early')
    ),
    constraint flare_plan_runs_lifecycle_check check (
        (status = 'offered' and started_at is null and completed_at is null and ended_at is null)
        or (status = 'declined' and started_at is null and completed_at is null and ended_at is not null)
        or (status = 'in_progress' and started_at is not null and completed_at is null and ended_at is null)
        or (status = 'completed' and started_at is not null and completed_at is not null and ended_at is null)
        or (status = 'ended_early' and started_at is not null and completed_at is null and ended_at is not null)
    )
);

create table public.flare_plan_run_actions (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null references public.flare_plan_runs(id) on delete cascade,
    source_action_id uuid references public.flare_plan_actions(id) on delete set null,
    source_template_key text,
    title text not null,
    description text,
    position integer not null,
    outcome text not null default 'pending',
    responded_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint flare_plan_run_actions_source_template_key_not_blank check (
        source_template_key is null or length(btrim(source_template_key)) > 0
    ),
    constraint flare_plan_run_actions_title_not_blank check (length(btrim(title)) between 1 and 120),
    constraint flare_plan_run_actions_description_length_check check (
        description is null or length(btrim(description)) <= 300
    ),
    constraint flare_plan_run_actions_position_positive_check check (position >= 1),
    constraint flare_plan_run_actions_outcome_check check (
        outcome in ('pending', 'done', 'skipped', 'not_reached')
    ),
    constraint flare_plan_run_actions_response_state_check check (
        (
            outcome in ('done', 'skipped')
            and responded_at is not null
        )
        or (
            outcome in ('pending', 'not_reached')
            and responded_at is null
        )
    )
);

create table public.flare_plan_run_checkpoints (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null references public.flare_plan_runs(id) on delete cascade,
    status text not null default 'not_offered',
    response text,
    next_choice text,
    responded_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint flare_plan_run_checkpoints_run_id_key unique (run_id),
    constraint flare_plan_run_checkpoints_status_check check (
        status in ('not_offered', 'pending', 'completed', 'skipped')
    ),
    constraint flare_plan_run_checkpoints_response_check check (
        response is null or response in ('better', 'about_the_same', 'worse', 'not_sure')
    ),
    constraint flare_plan_run_checkpoints_next_choice_check check (
        next_choice is null
        or next_choice in (
            'continue_on_my_own',
            'contact_someone',
            'send_another_support_signal',
            'end_flare_event'
        )
    ),
    constraint flare_plan_run_checkpoints_state_check check (
        (status = 'not_offered' and response is null and next_choice is null and responded_at is null)
        or (status = 'pending' and response is null and next_choice is null and responded_at is null)
        or (status = 'completed' and response is not null and responded_at is not null)
        or (status = 'skipped' and response is null and next_choice is null and responded_at is not null)
    )
);

create table public.flare_plan_idempotency_keys (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    operation text not null,
    target_resource text not null,
    idempotency_key text not null,
    request_fingerprint text not null,
    response_status integer,
    response_body jsonb not null default '{}'::jsonb,
    completed_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint flare_plan_idempotency_keys_operation_not_blank check (length(btrim(operation)) > 0),
    constraint flare_plan_idempotency_keys_target_resource_not_blank check (length(btrim(target_resource)) > 0),
    constraint flare_plan_idempotency_keys_key_not_blank check (length(btrim(idempotency_key)) > 0),
    constraint flare_plan_idempotency_keys_request_fingerprint_not_blank check (
        length(btrim(request_fingerprint)) > 0
    ),
    constraint flare_plan_idempotency_keys_response_body_object_check check (
        jsonb_typeof(response_body) = 'object'
    ),
    constraint flare_plan_idempotency_keys_response_status_positive_check check (
        response_status is null or response_status between 100 and 599
    ),
    constraint flare_plan_idempotency_keys_completed_state_check check (
        (completed_at is null and response_status is null)
        or completed_at is not null
    ),
    constraint flare_plan_idempotency_keys_scope_key unique (
        user_id,
        operation,
        target_resource,
        idempotency_key
    )
);

create unique index idx_flare_plans_one_active_per_user
    on public.flare_plans (user_id)
    where status = 'active' and archived_at is null;

create index idx_flare_plans_user_created_at
    on public.flare_plans (user_id, created_at desc);

create unique index idx_flare_plan_starter_templates_category_position
    on public.flare_plan_starter_templates (category, display_position);

create index idx_flare_plan_starter_templates_active_order
    on public.flare_plan_starter_templates (category, display_position)
    where status = 'active';

create index idx_flare_plan_actions_plan_created_at
    on public.flare_plan_actions (plan_id, created_at desc);

create unique index idx_flare_plan_actions_active_position
    on public.flare_plan_actions (plan_id, position)
    where status = 'active' and archived_at is null;

create unique index idx_flare_plan_actions_active_template_key
    on public.flare_plan_actions (plan_id, source_template_key)
    where status = 'active'
      and archived_at is null
      and source_template_key is not null;

create unique index idx_flare_plan_actions_active_legacy_behavior_pattern
    on public.flare_plan_actions (plan_id, legacy_behavior_pattern_id)
    where status = 'active'
      and archived_at is null
      and legacy_behavior_pattern_id is not null;

create unique index idx_flare_plan_runs_one_per_event
    on public.flare_plan_runs (flare_event_id);

create index idx_flare_plan_runs_source_plan_id
    on public.flare_plan_runs (source_plan_id);

create index idx_flare_plan_runs_status_offered_at
    on public.flare_plan_runs (status, offered_at desc);

create unique index idx_flare_plan_run_actions_position
    on public.flare_plan_run_actions (run_id, position);

create unique index idx_flare_plan_run_actions_source_action
    on public.flare_plan_run_actions (run_id, source_action_id)
    where source_action_id is not null;

create index idx_flare_plan_run_actions_pending
    on public.flare_plan_run_actions (run_id, outcome, position);

create index idx_flare_plan_idempotency_user_created_at
    on public.flare_plan_idempotency_keys (user_id, created_at desc);

create or replace function public.assert_flare_plan_positions_contiguous(target_plan_id uuid)
returns void
language plpgsql
as $$
declare
    active_positions integer[];
    expected_positions integer[];
    active_count integer;
begin
    if target_plan_id is null then
        return;
    end if;

    select coalesce(array_agg(position order by position), '{}'::integer[]), count(*)
    into active_positions, active_count
    from public.flare_plan_actions
    where plan_id = target_plan_id
      and status = 'active'
      and archived_at is null;

    if active_count = 0 then
        return;
    end if;

    select coalesce(array_agg(n), '{}'::integer[])
    into expected_positions
    from generate_series(1, active_count) as n;

    if active_positions <> expected_positions then
        raise exception 'flare_plan_actions active positions must be contiguous starting at 1 for plan %', target_plan_id;
    end if;
end;
$$;

create or replace function public.assert_flare_plan_run_positions_contiguous(target_run_id uuid)
returns void
language plpgsql
as $$
declare
    snapshot_positions integer[];
    expected_positions integer[];
    snapshot_count integer;
begin
    if target_run_id is null then
        return;
    end if;

    select coalesce(array_agg(position order by position), '{}'::integer[]), count(*)
    into snapshot_positions, snapshot_count
    from public.flare_plan_run_actions
    where run_id = target_run_id;

    if snapshot_count = 0 then
        return;
    end if;

    select coalesce(array_agg(n), '{}'::integer[])
    into expected_positions
    from generate_series(1, snapshot_count) as n;

    if snapshot_positions <> expected_positions then
        raise exception 'flare_plan_run_actions positions must be contiguous starting at 1 for run %', target_run_id;
    end if;
end;
$$;

create or replace function public.enforce_flare_plan_action_active_limit()
returns trigger
language plpgsql
as $$
declare
    active_count integer;
begin
    if new.status = 'active' and new.archived_at is null then
        select count(*)
        into active_count
        from public.flare_plan_actions
        where plan_id = new.plan_id
          and status = 'active'
          and archived_at is null
          and id is distinct from new.id;

        if active_count >= 10 then
            raise exception 'flare_plan_actions active action limit exceeded for plan %', new.plan_id;
        end if;
    end if;

    return new;
end;
$$;

create or replace function public.validate_flare_plan_action_positions_trigger()
returns trigger
language plpgsql
as $$
begin
    perform public.assert_flare_plan_positions_contiguous(coalesce(new.plan_id, old.plan_id));

    if tg_op = 'UPDATE'
       and old.plan_id is distinct from new.plan_id then
        perform public.assert_flare_plan_positions_contiguous(old.plan_id);
    end if;

    return null;
end;
$$;

create or replace function public.validate_flare_plan_run_action_positions_trigger()
returns trigger
language plpgsql
as $$
begin
    perform public.assert_flare_plan_run_positions_contiguous(coalesce(new.run_id, old.run_id));

    if tg_op = 'UPDATE'
       and old.run_id is distinct from new.run_id then
        perform public.assert_flare_plan_run_positions_contiguous(old.run_id);
    end if;

    return null;
end;
$$;

create trigger set_flare_plans_updated_at
before update on public.flare_plans
for each row execute function public.set_updated_at();

create trigger set_flare_plan_starter_templates_updated_at
before update on public.flare_plan_starter_templates
for each row execute function public.set_updated_at();

create trigger set_flare_plan_actions_updated_at
before update on public.flare_plan_actions
for each row execute function public.set_updated_at();

create trigger set_flare_plan_runs_updated_at
before update on public.flare_plan_runs
for each row execute function public.set_updated_at();

create trigger set_flare_plan_run_actions_updated_at
before update on public.flare_plan_run_actions
for each row execute function public.set_updated_at();

create trigger set_flare_plan_run_checkpoints_updated_at
before update on public.flare_plan_run_checkpoints
for each row execute function public.set_updated_at();

create trigger set_flare_plan_idempotency_keys_updated_at
before update on public.flare_plan_idempotency_keys
for each row execute function public.set_updated_at();

create trigger flare_plan_actions_active_limit
before insert or update on public.flare_plan_actions
for each row execute function public.enforce_flare_plan_action_active_limit();

create constraint trigger flare_plan_actions_positions_contiguous
after insert or update or delete on public.flare_plan_actions
deferrable initially deferred
for each row execute function public.validate_flare_plan_action_positions_trigger();

create constraint trigger flare_plan_run_actions_positions_contiguous
after insert or update or delete on public.flare_plan_run_actions
deferrable initially deferred
for each row execute function public.validate_flare_plan_run_action_positions_trigger();

alter table public.flare_plans enable row level security;
alter table public.flare_plan_starter_templates enable row level security;
alter table public.flare_plan_actions enable row level security;
alter table public.flare_plan_runs enable row level security;
alter table public.flare_plan_run_actions enable row level security;
alter table public.flare_plan_run_checkpoints enable row level security;
alter table public.flare_plan_idempotency_keys enable row level security;

revoke all on public.flare_plans from public, anon;
revoke all on public.flare_plan_starter_templates from public, anon;
revoke all on public.flare_plan_actions from public, anon;
revoke all on public.flare_plan_runs from public, anon;
revoke all on public.flare_plan_run_actions from public, anon;
revoke all on public.flare_plan_run_checkpoints from public, anon;
revoke all on public.flare_plan_idempotency_keys from public, anon;

revoke all on public.flare_plans from authenticated;
revoke all on public.flare_plan_starter_templates from authenticated;
revoke all on public.flare_plan_actions from authenticated;
revoke all on public.flare_plan_runs from authenticated;
revoke all on public.flare_plan_run_actions from authenticated;
revoke all on public.flare_plan_run_checkpoints from authenticated;
revoke all on public.flare_plan_idempotency_keys from authenticated;

grant select, insert, update, delete on public.flare_plans to authenticated;
grant select on public.flare_plan_starter_templates to authenticated;
grant select, insert, update, delete on public.flare_plan_actions to authenticated;
grant select, insert, update, delete on public.flare_plan_runs to authenticated;
grant select, insert, update, delete on public.flare_plan_run_actions to authenticated;
grant select, insert, update, delete on public.flare_plan_run_checkpoints to authenticated;
grant select, insert, update, delete on public.flare_plan_idempotency_keys to authenticated;

grant all on public.flare_plans to service_role;
grant all on public.flare_plan_starter_templates to service_role;
grant all on public.flare_plan_actions to service_role;
grant all on public.flare_plan_runs to service_role;
grant all on public.flare_plan_run_actions to service_role;
grant all on public.flare_plan_run_checkpoints to service_role;
grant all on public.flare_plan_idempotency_keys to service_role;

create policy "flare_plans_owner_select"
on public.flare_plans
for select
to authenticated
using (auth.uid() = user_id);

create policy "flare_plans_owner_insert"
on public.flare_plans
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "flare_plans_owner_update"
on public.flare_plans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "flare_plans_owner_delete"
on public.flare_plans
for delete
to authenticated
using (auth.uid() = user_id);

create policy "service_role_flare_plans_all"
on public.flare_plans
for all
to service_role
using (true)
with check (true);

create policy "flare_plan_starter_templates_active_select"
on public.flare_plan_starter_templates
for select
to authenticated
using (status = 'active');

create policy "service_role_flare_plan_starter_templates_all"
on public.flare_plan_starter_templates
for all
to service_role
using (true)
with check (true);

create policy "flare_plan_actions_owner_select"
on public.flare_plan_actions
for select
to authenticated
using (
    exists (
        select 1
        from public.flare_plans
        where public.flare_plans.id = flare_plan_actions.plan_id
          and public.flare_plans.user_id = auth.uid()
    )
);

create policy "flare_plan_actions_owner_insert"
on public.flare_plan_actions
for insert
to authenticated
with check (
    exists (
        select 1
        from public.flare_plans
        where public.flare_plans.id = flare_plan_actions.plan_id
          and public.flare_plans.user_id = auth.uid()
    )
);

create policy "flare_plan_actions_owner_update"
on public.flare_plan_actions
for update
to authenticated
using (
    exists (
        select 1
        from public.flare_plans
        where public.flare_plans.id = flare_plan_actions.plan_id
          and public.flare_plans.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.flare_plans
        where public.flare_plans.id = flare_plan_actions.plan_id
          and public.flare_plans.user_id = auth.uid()
    )
);

create policy "flare_plan_actions_owner_delete"
on public.flare_plan_actions
for delete
to authenticated
using (
    exists (
        select 1
        from public.flare_plans
        where public.flare_plans.id = flare_plan_actions.plan_id
          and public.flare_plans.user_id = auth.uid()
    )
);

create policy "service_role_flare_plan_actions_all"
on public.flare_plan_actions
for all
to service_role
using (true)
with check (true);

create policy "flare_plan_runs_owner_select"
on public.flare_plan_runs
for select
to authenticated
using (
    exists (
        select 1
        from public.flare_events
        where public.flare_events.id = flare_plan_runs.flare_event_id
          and public.flare_events.user_id = auth.uid()
    )
);

create policy "flare_plan_runs_owner_insert"
on public.flare_plan_runs
for insert
to authenticated
with check (
    exists (
        select 1
        from public.flare_events
        where public.flare_events.id = flare_plan_runs.flare_event_id
          and public.flare_events.user_id = auth.uid()
    )
);

create policy "flare_plan_runs_owner_update"
on public.flare_plan_runs
for update
to authenticated
using (
    exists (
        select 1
        from public.flare_events
        where public.flare_events.id = flare_plan_runs.flare_event_id
          and public.flare_events.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.flare_events
        where public.flare_events.id = flare_plan_runs.flare_event_id
          and public.flare_events.user_id = auth.uid()
    )
);

create policy "flare_plan_runs_owner_delete"
on public.flare_plan_runs
for delete
to authenticated
using (
    exists (
        select 1
        from public.flare_events
        where public.flare_events.id = flare_plan_runs.flare_event_id
          and public.flare_events.user_id = auth.uid()
    )
);

create policy "service_role_flare_plan_runs_all"
on public.flare_plan_runs
for all
to service_role
using (true)
with check (true);

create policy "flare_plan_run_actions_owner_select"
on public.flare_plan_run_actions
for select
to authenticated
using (
    exists (
        select 1
        from public.flare_plan_runs run
        join public.flare_events event on event.id = run.flare_event_id
        where run.id = flare_plan_run_actions.run_id
          and event.user_id = auth.uid()
    )
);

create policy "flare_plan_run_actions_owner_insert"
on public.flare_plan_run_actions
for insert
to authenticated
with check (
    exists (
        select 1
        from public.flare_plan_runs run
        join public.flare_events event on event.id = run.flare_event_id
        where run.id = flare_plan_run_actions.run_id
          and event.user_id = auth.uid()
    )
);

create policy "flare_plan_run_actions_owner_update"
on public.flare_plan_run_actions
for update
to authenticated
using (
    exists (
        select 1
        from public.flare_plan_runs run
        join public.flare_events event on event.id = run.flare_event_id
        where run.id = flare_plan_run_actions.run_id
          and event.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.flare_plan_runs run
        join public.flare_events event on event.id = run.flare_event_id
        where run.id = flare_plan_run_actions.run_id
          and event.user_id = auth.uid()
    )
);

create policy "flare_plan_run_actions_owner_delete"
on public.flare_plan_run_actions
for delete
to authenticated
using (
    exists (
        select 1
        from public.flare_plan_runs run
        join public.flare_events event on event.id = run.flare_event_id
        where run.id = flare_plan_run_actions.run_id
          and event.user_id = auth.uid()
    )
);

create policy "service_role_flare_plan_run_actions_all"
on public.flare_plan_run_actions
for all
to service_role
using (true)
with check (true);

create policy "flare_plan_run_checkpoints_owner_select"
on public.flare_plan_run_checkpoints
for select
to authenticated
using (
    exists (
        select 1
        from public.flare_plan_runs run
        join public.flare_events event on event.id = run.flare_event_id
        where run.id = flare_plan_run_checkpoints.run_id
          and event.user_id = auth.uid()
    )
);

create policy "flare_plan_run_checkpoints_owner_insert"
on public.flare_plan_run_checkpoints
for insert
to authenticated
with check (
    exists (
        select 1
        from public.flare_plan_runs run
        join public.flare_events event on event.id = run.flare_event_id
        where run.id = flare_plan_run_checkpoints.run_id
          and event.user_id = auth.uid()
    )
);

create policy "flare_plan_run_checkpoints_owner_update"
on public.flare_plan_run_checkpoints
for update
to authenticated
using (
    exists (
        select 1
        from public.flare_plan_runs run
        join public.flare_events event on event.id = run.flare_event_id
        where run.id = flare_plan_run_checkpoints.run_id
          and event.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.flare_plan_runs run
        join public.flare_events event on event.id = run.flare_event_id
        where run.id = flare_plan_run_checkpoints.run_id
          and event.user_id = auth.uid()
    )
);

create policy "flare_plan_run_checkpoints_owner_delete"
on public.flare_plan_run_checkpoints
for delete
to authenticated
using (
    exists (
        select 1
        from public.flare_plan_runs run
        join public.flare_events event on event.id = run.flare_event_id
        where run.id = flare_plan_run_checkpoints.run_id
          and event.user_id = auth.uid()
    )
);

create policy "service_role_flare_plan_run_checkpoints_all"
on public.flare_plan_run_checkpoints
for all
to service_role
using (true)
with check (true);

create policy "flare_plan_idempotency_keys_owner_select"
on public.flare_plan_idempotency_keys
for select
to authenticated
using (auth.uid() = user_id);

create policy "flare_plan_idempotency_keys_owner_insert"
on public.flare_plan_idempotency_keys
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "flare_plan_idempotency_keys_owner_update"
on public.flare_plan_idempotency_keys
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "flare_plan_idempotency_keys_owner_delete"
on public.flare_plan_idempotency_keys
for delete
to authenticated
using (auth.uid() = user_id);

create policy "service_role_flare_plan_idempotency_keys_all"
on public.flare_plan_idempotency_keys
for all
to service_role
using (true)
with check (true);

comment on table public.flare_plans is
    'User-owned Flare Plan containers. V0 supports at most one active plan per user.';

comment on table public.flare_plan_starter_templates is
    'Curated Flare-managed starter action templates for the Configure experience.';

comment on table public.flare_plan_actions is
    'User-owned saved Flare Plan actions. Archived actions remain available for history provenance.';

comment on column public.flare_plan_actions.legacy_behavior_pattern_id is
    'Legacy preferred_recovery_actions source row used for idempotent V0 migration and verification.';

comment on table public.flare_plan_runs is
    'One Flare Plan run per Flare Event, including offered, declined, in-progress, completed, and ended-early states.';

comment on table public.flare_plan_run_actions is
    'Immutable-in-meaning event-time action snapshots for a specific Flare Plan run.';

comment on table public.flare_plan_run_checkpoints is
    'Checkpoint state stored independently from Flare Plan run state.';

comment on table public.flare_plan_idempotency_keys is
    'User-scoped mutation idempotency records for Flare Plan writes and run progression.';

insert into public.flare_plan_starter_templates (
    template_key,
    title,
    description,
    category,
    category_label,
    display_position,
    status
)
values
    (
        'move_to_different_room',
        'Move to a different room',
        'Create some distance from where the pattern was happening.',
        'change_the_situation',
        'Change the situation',
        1,
        'active'
    ),
    (
        'step_outside_for_two_minutes',
        'Step outside for two minutes',
        'Change your environment long enough to interrupt autopilot.',
        'change_the_situation',
        'Change the situation',
        2,
        'active'
    ),
    (
        'drink_a_glass_of_water',
        'Drink a glass of water',
        'Give your body one simple physical reset.',
        'reset_your_body',
        'Reset your body',
        1,
        'active'
    ),
    (
        'take_ten_slow_breaths',
        'Take ten slow breaths',
        'Slow the pace just enough to create a choice point.',
        'reset_your_body',
        'Reset your body',
        2,
        'active'
    ),
    (
        'open_my_anchor_note',
        'Open my anchor note',
        'Read the reminder you wrote while clear-minded.',
        'interrupt_the_pattern',
        'Interrupt the pattern',
        1,
        'active'
    ),
    (
        'set_a_two_minute_timer',
        'Set a two-minute timer',
        'Delay the next move and stay with the timer until it ends.',
        'interrupt_the_pattern',
        'Interrupt the pattern',
        2,
        'active'
    ),
    (
        'text_someone_safe',
        'Text someone safe',
        'Reach toward a person who can help you stay interrupted.',
        'reach_toward_support',
        'Reach toward support',
        1,
        'active'
    ),
    (
        'send_another_support_signal',
        'Send another support signal',
        'Use your configured support path again if you want more backup.',
        'reach_toward_support',
        'Reach toward support',
        2,
        'active'
    )
on conflict (template_key) do update
set
    title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    category_label = excluded.category_label,
    display_position = excluded.display_position,
    status = excluded.status,
    updated_at = now();

with ranked_legacy as (
    select distinct on (bp.user_id)
        bp.user_id,
        bp.id as behavior_pattern_id,
        btrim(bp.preferred_recovery_actions) as legacy_action_title
    from public.behavior_patterns bp
    where bp.status = 'active'
      and nullif(btrim(bp.preferred_recovery_actions), '') is not null
    order by
        bp.user_id,
        bp.is_primary desc,
        bp.updated_at desc,
        bp.created_at desc,
        bp.id desc
),
inserted_plans as (
    insert into public.flare_plans (user_id, title, status)
    select rl.user_id, 'Flare Plan', 'active'
    from ranked_legacy rl
    where not exists (
        select 1
        from public.flare_plans plan
        where plan.user_id = rl.user_id
          and plan.status = 'active'
          and plan.archived_at is null
    )
    returning id, user_id
),
available_plans as (
    select id, user_id
    from inserted_plans
    union all
    select plan.id, plan.user_id
    from public.flare_plans plan
    where plan.status = 'active'
      and plan.archived_at is null
)
insert into public.flare_plan_actions (
    plan_id,
    legacy_behavior_pattern_id,
    title,
    description,
    position,
    status
)
select
    plan.id,
    rl.behavior_pattern_id,
    rl.legacy_action_title,
    null,
    1,
    'active'
from ranked_legacy rl
join available_plans plan
  on plan.user_id = rl.user_id
where not exists (
    select 1
    from public.flare_plan_actions existing
    where existing.plan_id = plan.id
      and existing.legacy_behavior_pattern_id = rl.behavior_pattern_id
      and existing.status = 'active'
      and existing.archived_at is null
)
and not exists (
    select 1
    from public.flare_plan_actions active_existing
    where active_existing.plan_id = plan.id
      and active_existing.status = 'active'
      and active_existing.archived_at is null
);
