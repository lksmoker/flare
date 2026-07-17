from __future__ import annotations

from datetime import UTC, datetime, timedelta
import unittest

from backend.app.trace_policy import (
    TRACE_RETENTION_AFTER_CREATED,
    classify_effective_trace_outcome,
    compute_trace_retention_deadline,
)


class FlareTracePolicyTests(unittest.TestCase):
    def test_nonterminal_trace_becomes_effectively_incomplete_after_five_minutes(self) -> None:
        started_at = datetime(2026, 7, 17, 0, 0, 0, tzinfo=UTC)

        before_threshold = classify_effective_trace_outcome(
            client_initiated_at=started_at,
            now=started_at + timedelta(minutes=4, seconds=59),
            status="authenticated",
        )
        after_threshold = classify_effective_trace_outcome(
            client_initiated_at=started_at,
            now=started_at + timedelta(minutes=5, seconds=1),
            status="authenticated",
        )

        self.assertFalse(before_threshold.is_effectively_stale)
        self.assertTrue(after_threshold.is_effectively_stale)
        self.assertEqual("incomplete", after_threshold.failure_stage)
        self.assertEqual("trace_terminal_state_unknown", after_threshold.failure_code)

    def test_retention_deadline_uses_the_shorter_of_created_plus_30_days_or_exit_plus_14_days(self) -> None:
        created_at = datetime(2026, 7, 1, 12, 0, 0, tzinfo=UTC)
        private_cohort_exited_at = datetime(2026, 7, 10, 9, 0, 0, tzinfo=UTC)

        deadline = compute_trace_retention_deadline(
            created_at=created_at,
            private_cohort_exited_at=private_cohort_exited_at,
        )

        self.assertEqual(private_cohort_exited_at + timedelta(days=14), deadline)
        self.assertLess(deadline, created_at + TRACE_RETENTION_AFTER_CREATED)

    def test_retention_deadline_falls_back_to_created_plus_30_days_when_no_exit_timestamp_exists(self) -> None:
        created_at = datetime(2026, 7, 1, 12, 0, 0, tzinfo=UTC)

        deadline = compute_trace_retention_deadline(
            created_at=created_at,
            private_cohort_exited_at=None,
        )

        self.assertEqual(created_at + TRACE_RETENTION_AFTER_CREATED, deadline)
