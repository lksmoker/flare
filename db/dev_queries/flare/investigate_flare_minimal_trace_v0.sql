\set trace_id ''
\set user_id ''
\set flare_event_id ''
\set window_start ''
\set window_end ''

with matched_traces as (
    select
        trace.*,
        case
            when trace.status in ('initiated', 'backend_received', 'authenticated', 'validated')
             and trace.client_initiated_at <= (now() - interval '5 minutes')
                then 'failed'
            else trace.status
        end as effective_status,
        case
            when trace.status in ('initiated', 'backend_received', 'authenticated', 'validated')
             and trace.client_initiated_at <= (now() - interval '5 minutes')
                then 'incomplete'
            else trace.failure_stage
        end as effective_failure_stage,
        case
            when trace.status in ('initiated', 'backend_received', 'authenticated', 'validated')
             and trace.client_initiated_at <= (now() - interval '5 minutes')
                then 'trace_terminal_state_unknown'
            else trace.failure_code
        end as effective_failure_code
    from public.flare_event_traces trace
    where (
        nullif(:'trace_id', '') is not null
        and trace.trace_id = nullif(:'trace_id', '')
    ) or (
        nullif(:'flare_event_id', '') is not null
        and trace.flare_event_id = nullif(:'flare_event_id', '')::uuid
    ) or (
        nullif(:'user_id', '') is not null
        and trace.user_id = nullif(:'user_id', '')::uuid
        and (
            nullif(:'window_start', '') is null
            or trace.client_initiated_at >= nullif(:'window_start', '')::timestamp with time zone
        )
        and (
            nullif(:'window_end', '') is null
            or trace.client_initiated_at <= nullif(:'window_end', '')::timestamp with time zone
        )
    )
)
select
    trace.id as trace_row_id,
    trace.trace_id,
    trace.user_id,
    trace.route_name,
    trace.status,
    trace.effective_status,
    trace.failure_stage,
    trace.failure_code,
    trace.effective_failure_stage,
    trace.effective_failure_code,
    trace.request_attempt_count,
    trace.client_initiated_at,
    trace.backend_received_at,
    trace.authenticated_at,
    trace.validated_at,
    trace.flare_event_created_at,
    trace.completed_at,
    trace.failed_at,
    trace.terminal_http_status,
    trace.is_test,
    trace.response_mode,
    event.id as flare_event_id,
    event.status as flare_event_status,
    event.response_mode as flare_event_response_mode,
    event.created_at as flare_event_created_at_authoritative,
    latest_delivery.id as latest_delivery_attempt_id,
    latest_delivery.status as latest_delivery_status,
    latest_delivery.error_code as latest_delivery_error_code,
    latest_delivery.attempted_at as latest_delivery_attempted_at,
    run.id as flare_plan_run_id,
    run.status as flare_plan_run_status,
    run.offered_at as flare_plan_run_offered_at
from matched_traces trace
left join public.flare_events event
  on event.id = trace.flare_event_id
left join lateral (
    select attempt.id, attempt.status, attempt.error_code, attempt.attempted_at
    from public.support_channel_delivery_attempts attempt
    where attempt.flare_event_id = trace.flare_event_id
    order by attempt.attempted_at desc nulls last, attempt.created_at desc
    limit 1
) latest_delivery on true
left join public.flare_plan_runs run
  on run.flare_event_id = trace.flare_event_id
order by trace.client_initiated_at desc, trace.created_at desc;
