create extension if not exists pgcrypto;

create table public.flare_event_traces (
    id uuid primary key default gen_random_uuid(),
    trace_id text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    flare_event_id uuid references public.flare_events(id) on delete set null,
    route_name text not null default 'flare_event_create',
    status text not null,
    failure_stage text,
    failure_code text,
    request_attempt_count integer not null default 0,
    client_initiated_at timestamp with time zone not null,
    backend_received_at timestamp with time zone,
    authenticated_at timestamp with time zone,
    validated_at timestamp with time zone,
    flare_event_created_at timestamp with time zone,
    completed_at timestamp with time zone,
    failed_at timestamp with time zone,
    terminal_http_status integer,
    is_test boolean not null default false,
    response_mode text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint flare_event_traces_trace_id_not_blank check (length(btrim(trace_id)) > 0),
    constraint flare_event_traces_route_name_check check (route_name = 'flare_event_create'),
    constraint flare_event_traces_status_check check (
        status in ('initiated', 'backend_received', 'authenticated', 'validated', 'completed', 'failed')
    ),
    constraint flare_event_traces_failure_stage_check check (
        failure_stage is null
        or failure_stage in (
            'client_initiation',
            'request_transport',
            'backend_auth',
            'validation',
            'domain_persistence',
            'backend_unexpected',
            'incomplete'
        )
    ),
    constraint flare_event_traces_failure_code_check check (
        failure_code is null
        or failure_code in (
            'client_trace_write_failed',
            'auth_session_missing',
            'request_network_failed',
            'backend_unauthorized',
            'validation_rejected',
            'idempotency_conflict',
            'flare_event_insert_failed',
            'unexpected_server_error',
            'trace_terminal_state_unknown'
        )
    ),
    constraint flare_event_traces_request_attempt_count_check check (request_attempt_count >= 0),
    constraint flare_event_traces_terminal_http_status_check check (
        terminal_http_status is null or terminal_http_status between 100 and 599
    ),
    constraint flare_event_traces_response_mode_check check (
        response_mode is null or response_mode in ('configured', 'fallback-generic')
    ),
    constraint flare_event_traces_completed_state_check check (
        (
            status = 'completed'
            and flare_event_id is not null
            and flare_event_created_at is not null
            and completed_at is not null
            and failed_at is null
            and failure_stage is null
            and failure_code is null
        )
        or status <> 'completed'
    ),
    constraint flare_event_traces_failed_state_check check (
        (
            status = 'failed'
            and failed_at is not null
            and failure_stage is not null
            and failure_code is not null
            and flare_event_id is null
            and flare_event_created_at is null
            and completed_at is null
        )
        or status <> 'failed'
    ),
    constraint flare_event_traces_nonterminal_state_check check (
        (
            status in ('initiated', 'backend_received', 'authenticated', 'validated')
            and flare_event_id is null
            and flare_event_created_at is null
            and completed_at is null
            and failed_at is null
            and failure_stage is null
            and failure_code is null
        )
        or status not in ('initiated', 'backend_received', 'authenticated', 'validated')
    ),
    constraint flare_event_traces_trace_id_key unique (trace_id)
);

create index idx_flare_event_traces_user_client_initiated_at
    on public.flare_event_traces (user_id, client_initiated_at desc);

create index idx_flare_event_traces_flare_event_id
    on public.flare_event_traces (flare_event_id)
    where flare_event_id is not null;

create index idx_flare_event_traces_nonterminal_status_client_initiated_at
    on public.flare_event_traces (status, client_initiated_at)
    where status in ('initiated', 'backend_received', 'authenticated', 'validated');

create trigger set_flare_event_traces_updated_at
before update on public.flare_event_traces
for each row execute function public.set_updated_at();

create or replace function public.mark_stale_flare_event_traces_v0(
    p_now timestamp with time zone default now()
)
returns integer
language plpgsql
as $$
declare
    affected_count integer;
begin
    update public.flare_event_traces
    set status = 'failed',
        failure_stage = 'incomplete',
        failure_code = 'trace_terminal_state_unknown',
        failed_at = coalesce(failed_at, p_now),
        terminal_http_status = null
    where status in ('initiated', 'backend_received', 'authenticated', 'validated')
      and client_initiated_at <= (p_now - interval '5 minutes');

    get diagnostics affected_count = row_count;
    return affected_count;
end;
$$;

create or replace function public.cleanup_flare_event_traces_v0(
    p_now timestamp with time zone default now(),
    p_private_cohort_exits jsonb default '{}'::jsonb
)
returns integer
language plpgsql
as $$
declare
    affected_count integer;
begin
    with cohort_exit_lookup as (
        select
            key::uuid as user_id,
            value::text::timestamp with time zone as exited_at
        from jsonb_each_text(coalesce(p_private_cohort_exits, '{}'::jsonb))
    ),
    deletable as (
        select trace.id
        from public.flare_event_traces trace
        left join cohort_exit_lookup exit_lookup
          on exit_lookup.user_id = trace.user_id
        where p_now >= least(
            trace.created_at + interval '30 days',
            coalesce(
                exit_lookup.exited_at + interval '14 days',
                trace.created_at + interval '30 days'
            )
        )
    )
    delete from public.flare_event_traces
    where id in (select id from deletable);

    get diagnostics affected_count = row_count;
    return affected_count;
end;
$$;

alter table public.flare_event_traces enable row level security;

revoke all on public.flare_event_traces from public;
revoke all on public.flare_event_traces from anon, authenticated;

grant insert (
    trace_id,
    user_id,
    route_name,
    status,
    client_initiated_at,
    is_test,
    response_mode
) on public.flare_event_traces to authenticated;

grant update (
    status,
    failure_stage,
    failure_code,
    failed_at,
    terminal_http_status
) on public.flare_event_traces to authenticated;

grant all on public.flare_event_traces to service_role;

create policy "flare_event_traces_owner_insert"
on public.flare_event_traces
for insert
to authenticated
with check (
    auth.uid() = user_id
    and route_name = 'flare_event_create'
    and status = 'initiated'
    and request_attempt_count = 0
    and failure_stage is null
    and failure_code is null
    and flare_event_id is null
    and backend_received_at is null
    and authenticated_at is null
    and validated_at is null
    and flare_event_created_at is null
    and completed_at is null
    and failed_at is null
    and terminal_http_status is null
);

create policy "flare_event_traces_owner_update"
on public.flare_event_traces
for update
to authenticated
using (auth.uid() = user_id)
with check (
    auth.uid() = user_id
    and route_name = 'flare_event_create'
    and flare_event_id is null
    and request_attempt_count = 0
    and backend_received_at is null
    and authenticated_at is null
    and validated_at is null
    and flare_event_created_at is null
    and completed_at is null
    and (
        (status = 'initiated' and failure_stage is null and failure_code is null and failed_at is null and terminal_http_status is null)
        or (
            status = 'failed'
            and failure_stage in ('client_initiation', 'request_transport', 'backend_auth')
            and failure_code in (
                'auth_session_missing',
                'backend_unauthorized',
                'client_trace_write_failed',
                'request_network_failed'
            )
            and failed_at is not null
        )
    )
);

create policy "service_role_flare_event_traces_all"
on public.flare_event_traces
for all
to service_role
using (true)
with check (true);

comment on table public.flare_event_traces is
    'Minimal Trace V0 for signed-in POST /api/flare-events attempts. Stores bounded operational metadata only.';
