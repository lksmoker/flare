alter table public.flare_plan_runs
    add column if not exists declined_at timestamp with time zone;

update public.flare_plan_runs
set declined_at = coalesce(declined_at, ended_at, now()),
    ended_at = null
where status = 'declined';

alter table public.flare_plan_runs
    drop constraint if exists flare_plan_runs_lifecycle_check;

alter table public.flare_plan_runs
    add constraint flare_plan_runs_lifecycle_check check (
        (status = 'offered' and started_at is null and declined_at is null and completed_at is null and ended_at is null)
        or (status = 'declined' and started_at is null and declined_at is not null and completed_at is null and ended_at is null)
        or (status = 'in_progress' and started_at is not null and declined_at is null and completed_at is null and ended_at is null)
        or (status = 'completed' and started_at is not null and declined_at is null and completed_at is not null and ended_at is null)
        or (status = 'ended_early' and started_at is not null and declined_at is null and completed_at is null and ended_at is not null)
    );
