create table public.behavior_patterns (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    label text not null,
    description text,
    common_triggers text,
    risk_times_or_situations text,
    preferred_recovery_actions text,
    status text not null default 'active',
    is_primary boolean not null default false,
    archived_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint behavior_patterns_label_not_blank check (btrim(label) <> ''),
    constraint behavior_patterns_status_check check (status in ('active', 'archived')),
    constraint behavior_patterns_archive_state_check check (
        (status = 'archived' and archived_at is not null)
        or (status = 'active' and archived_at is null)
    )
);

create table public.anchor_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    reasons_to_interrupt text,
    costs_of_continuing text,
    grounded_self_reminder text,
    emergency_actions text,
    supportive_phrase text,
    future_self_message text,
    notes text,
    version integer not null default 1,
    status text not null default 'active',
    archived_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint anchor_notes_version_positive_check check (version >= 1),
    constraint anchor_notes_status_check check (status in ('active', 'archived')),
    constraint anchor_notes_archive_state_check check (
        (status = 'archived' and archived_at is not null)
        or (status = 'active' and archived_at is null)
    ),
    constraint anchor_notes_content_present_check check (
        coalesce(nullif(btrim(reasons_to_interrupt), ''), nullif(btrim(costs_of_continuing), ''), nullif(btrim(grounded_self_reminder), ''), nullif(btrim(emergency_actions), ''), nullif(btrim(supportive_phrase), ''), nullif(btrim(future_self_message), ''), nullif(btrim(notes), '')) is not null
    )
);

create table public.flare_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    behavior_pattern_id uuid references public.behavior_patterns(id) on delete set null,
    behavior_label_snapshot text not null,
    behavior_description_snapshot text,
    anchor_note_id uuid references public.anchor_notes(id) on delete set null,
    anchor_note_version integer,
    status text not null default 'active',
    response_mode text not null default 'configured',
    support_action_shown text,
    support_action_taken text,
    closed_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint flare_events_behavior_label_snapshot_not_blank check (btrim(behavior_label_snapshot) <> ''),
    constraint flare_events_anchor_note_link_check check (
        anchor_note_id is not null or anchor_note_version is null
    ),
    constraint flare_events_anchor_note_version_positive_check check (anchor_note_version is null or anchor_note_version >= 1),
    constraint flare_events_status_check check (status in ('active', 'reflected', 'closed')),
    constraint flare_events_closed_state_check check (
        status <> 'closed' or closed_at is not null
    )
);

create table public.checkpoint_reflections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    flare_event_id uuid not null references public.flare_events(id) on delete cascade,
    what_happened text,
    what_helped text,
    how_i_feel_now text,
    outcome text,
    action_taken text,
    note text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint checkpoint_reflections_outcome_check check (
        outcome is null or outcome in ('avoided', 'delayed', 'reduced', 'continued', 'unclear')
    )
);

create unique index idx_checkpoint_reflections_flare_event_id
    on public.checkpoint_reflections (flare_event_id);

create index idx_behavior_patterns_user_created_at
    on public.behavior_patterns (user_id, created_at desc);

create index idx_behavior_patterns_active_by_user
    on public.behavior_patterns (user_id, updated_at desc)
    where status = 'active' and archived_at is null;

create unique index idx_behavior_patterns_primary_active_by_user
    on public.behavior_patterns (user_id)
    where is_primary and status = 'active' and archived_at is null;

create index idx_anchor_notes_user_created_at
    on public.anchor_notes (user_id, created_at desc);

create index idx_anchor_notes_active_by_user
    on public.anchor_notes (user_id, updated_at desc, version desc)
    where status = 'active' and archived_at is null;

create index idx_flare_events_user_created_at
    on public.flare_events (user_id, created_at desc);

create index idx_flare_events_user_status_created_at
    on public.flare_events (user_id, status, created_at desc);

create trigger set_behavior_patterns_updated_at
before update on public.behavior_patterns
for each row execute function public.set_updated_at();

create trigger set_anchor_notes_updated_at
before update on public.anchor_notes
for each row execute function public.set_updated_at();

create trigger set_flare_events_updated_at
before update on public.flare_events
for each row execute function public.set_updated_at();

create trigger set_checkpoint_reflections_updated_at
before update on public.checkpoint_reflections
for each row execute function public.set_updated_at();

alter table public.behavior_patterns enable row level security;
alter table public.anchor_notes enable row level security;
alter table public.flare_events enable row level security;
alter table public.checkpoint_reflections enable row level security;

revoke all on public.behavior_patterns from public;
revoke all on public.anchor_notes from public;
revoke all on public.flare_events from public;
revoke all on public.checkpoint_reflections from public;

revoke all on public.behavior_patterns from anon, authenticated;
revoke all on public.anchor_notes from anon, authenticated;
revoke all on public.flare_events from anon, authenticated;
revoke all on public.checkpoint_reflections from anon, authenticated;

grant select, insert, update, delete on public.behavior_patterns to authenticated;
grant select, insert, update, delete on public.anchor_notes to authenticated;
grant select, insert, update, delete on public.flare_events to authenticated;
grant select, insert, update, delete on public.checkpoint_reflections to authenticated;

grant all on public.behavior_patterns to service_role;
grant all on public.anchor_notes to service_role;
grant all on public.flare_events to service_role;
grant all on public.checkpoint_reflections to service_role;

create policy "behavior_patterns_owner_select"
on public.behavior_patterns
for select
to authenticated
using (auth.uid() = user_id);

create policy "behavior_patterns_owner_insert"
on public.behavior_patterns
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "behavior_patterns_owner_update"
on public.behavior_patterns
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "behavior_patterns_owner_delete"
on public.behavior_patterns
for delete
to authenticated
using (auth.uid() = user_id);

create policy "service_role_behavior_patterns_all"
on public.behavior_patterns
for all
to service_role
using (true)
with check (true);

create policy "anchor_notes_owner_select"
on public.anchor_notes
for select
to authenticated
using (auth.uid() = user_id);

create policy "anchor_notes_owner_insert"
on public.anchor_notes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "anchor_notes_owner_update"
on public.anchor_notes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "anchor_notes_owner_delete"
on public.anchor_notes
for delete
to authenticated
using (auth.uid() = user_id);

create policy "service_role_anchor_notes_all"
on public.anchor_notes
for all
to service_role
using (true)
with check (true);

create policy "flare_events_owner_select"
on public.flare_events
for select
to authenticated
using (auth.uid() = user_id);

create policy "flare_events_owner_insert"
on public.flare_events
for insert
to authenticated
with check (
    auth.uid() = user_id
    and (
        behavior_pattern_id is null
        or exists (
            select 1
            from public.behavior_patterns
            where public.behavior_patterns.id = flare_events.behavior_pattern_id
              and public.behavior_patterns.user_id = auth.uid()
        )
    )
    and (
        anchor_note_id is null
        or exists (
            select 1
            from public.anchor_notes
            where public.anchor_notes.id = flare_events.anchor_note_id
              and public.anchor_notes.user_id = auth.uid()
              and (
                  flare_events.anchor_note_version is null
                  or public.anchor_notes.version = flare_events.anchor_note_version
              )
        )
    )
);

create policy "flare_events_owner_update"
on public.flare_events
for update
to authenticated
using (auth.uid() = user_id)
with check (
    auth.uid() = user_id
    and (
        behavior_pattern_id is null
        or exists (
            select 1
            from public.behavior_patterns
            where public.behavior_patterns.id = flare_events.behavior_pattern_id
              and public.behavior_patterns.user_id = auth.uid()
        )
    )
    and (
        anchor_note_id is null
        or exists (
            select 1
            from public.anchor_notes
            where public.anchor_notes.id = flare_events.anchor_note_id
              and public.anchor_notes.user_id = auth.uid()
              and (
                  flare_events.anchor_note_version is null
                  or public.anchor_notes.version = flare_events.anchor_note_version
              )
        )
    )
);

create policy "flare_events_owner_delete"
on public.flare_events
for delete
to authenticated
using (auth.uid() = user_id);

create policy "service_role_flare_events_all"
on public.flare_events
for all
to service_role
using (true)
with check (true);

create policy "checkpoint_reflections_owner_select"
on public.checkpoint_reflections
for select
to authenticated
using (auth.uid() = user_id);

create policy "checkpoint_reflections_owner_insert"
on public.checkpoint_reflections
for insert
to authenticated
with check (
    auth.uid() = user_id
    and exists (
        select 1
        from public.flare_events
        where public.flare_events.id = checkpoint_reflections.flare_event_id
          and public.flare_events.user_id = auth.uid()
    )
);

create policy "checkpoint_reflections_owner_update"
on public.checkpoint_reflections
for update
to authenticated
using (auth.uid() = user_id)
with check (
    auth.uid() = user_id
    and exists (
        select 1
        from public.flare_events
        where public.flare_events.id = checkpoint_reflections.flare_event_id
          and public.flare_events.user_id = auth.uid()
    )
);

create policy "checkpoint_reflections_owner_delete"
on public.checkpoint_reflections
for delete
to authenticated
using (auth.uid() = user_id);

create policy "service_role_checkpoint_reflections_all"
on public.checkpoint_reflections
for all
to service_role
using (true)
with check (true);
