from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta


TRACE_STALE_AFTER = timedelta(minutes=5)
TRACE_RETENTION_AFTER_CREATED = timedelta(days=30)
TRACE_RETENTION_AFTER_PRIVATE_COHORT_EXIT = timedelta(days=14)


@dataclass(frozen=True)
class EffectiveTraceOutcome:
    failure_code: str | None
    failure_stage: str | None
    is_effectively_stale: bool


def classify_effective_trace_outcome(
    *,
    client_initiated_at: datetime,
    now: datetime,
    status: str,
) -> EffectiveTraceOutcome:
    if status not in {"initiated", "backend_received", "authenticated", "validated"}:
        return EffectiveTraceOutcome(
            failure_code=None,
            failure_stage=None,
            is_effectively_stale=False,
        )

    normalized_now = _ensure_utc(now)
    normalized_started_at = _ensure_utc(client_initiated_at)
    if normalized_now - normalized_started_at < TRACE_STALE_AFTER:
        return EffectiveTraceOutcome(
            failure_code=None,
            failure_stage=None,
            is_effectively_stale=False,
        )

    return EffectiveTraceOutcome(
        failure_code="trace_terminal_state_unknown",
        failure_stage="incomplete",
        is_effectively_stale=True,
    )


def compute_trace_retention_deadline(
    *,
    created_at: datetime,
    private_cohort_exited_at: datetime | None,
) -> datetime:
    created_deadline = _ensure_utc(created_at) + TRACE_RETENTION_AFTER_CREATED
    if private_cohort_exited_at is None:
        return created_deadline
    cohort_exit_deadline = _ensure_utc(private_cohort_exited_at) + TRACE_RETENTION_AFTER_PRIVATE_COHORT_EXIT
    return min(created_deadline, cohort_exit_deadline)


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)
