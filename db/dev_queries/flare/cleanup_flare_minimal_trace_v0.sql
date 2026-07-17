\set private_cohort_exits '{}'

select public.mark_stale_flare_event_traces_v0();

select public.cleanup_flare_event_traces_v0(
    now(),
    :'private_cohort_exits'::jsonb
) as deleted_trace_count;
