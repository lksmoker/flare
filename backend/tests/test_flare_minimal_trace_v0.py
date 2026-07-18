from __future__ import annotations

import json
import unittest
from http import HTTPStatus

from backend.app.api.flare_plan_api import FlarePlanApi
from backend.app.domain.flare_plan import FlarePlanError
from backend.app.services.flare_plan_service import CreateFlareEventCommand, FlarePlanService
from backend.app.services.flare_trace_service import FlareTraceService
from backend.app.services.flare_plan_config import FlarePlanDatabaseConfig
from backend.tests.flare_plan_test_support import FakeAuthenticator, InMemoryFlarePlanRepository


class FlareMinimalTraceApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = InMemoryFlarePlanRepository()
        self.trace = InMemoryTraceLifecycle()
        self.service = FlarePlanService(
            repository=self.repository,
            trace_lifecycle=self.trace,
        )
        self.api = FlarePlanApi(
            authenticator=FakeAuthenticator(user_id="user-1"),
            service=self.service,
            trace_lifecycle=self.trace,
        )

    def test_successful_signed_in_create_records_expected_trace_milestones(self) -> None:
        self.trace.seed_initiated(trace_id="trace-1", user_id="user-1", response_mode="configured")

        response = self.api.handle_request(
            method="POST",
            path="/api/flare-events",
            headers={"authorization": "Bearer token", "idempotency-key": "trace-1"},
            body=json.dumps(
                {
                    "behavior_label_snapshot": "Scrolling",
                    "response_mode": "configured",
                }
            ).encode("utf-8"),
        )

        self.assertEqual(HTTPStatus.CREATED, response.status_code)
        trace = self.trace.rows["trace-1"]
        self.assertEqual("completed", trace["status"])
        self.assertEqual("user-1", trace["user_id"])
        self.assertEqual(response.body["flare_event"]["id"], trace["flare_event_id"])
        self.assertEqual(1, trace["request_attempt_count"])
        self.assertEqual(HTTPStatus.CREATED, trace["terminal_http_status"])
        for field_name in (
            "client_initiated_at",
            "backend_received_at",
            "authenticated_at",
            "validated_at",
            "flare_event_created_at",
            "completed_at",
        ):
            self.assertIsNotNone(trace[field_name], field_name)

    def test_unauthorized_create_does_not_mutate_owner_scoped_trace(self) -> None:
        self.trace.seed_initiated(trace_id="trace-1", user_id="user-1", response_mode="configured")
        api = FlarePlanApi(
            authenticator=FakeAuthenticator(user_id=None),
            service=self.service,
            trace_lifecycle=self.trace,
        )

        response = api.handle_request(
            method="POST",
            path="/api/flare-events",
            headers={"idempotency-key": "trace-1"},
            body=json.dumps(
                {
                    "behavior_label_snapshot": "Scrolling",
                    "response_mode": "configured",
                }
            ).encode("utf-8"),
        )

        self.assertEqual(HTTPStatus.UNAUTHORIZED, response.status_code)
        trace = self.trace.rows["trace-1"]
        self.assertEqual("initiated", trace["status"])
        self.assertIsNone(trace["failed_at"])
        self.assertEqual(0, len(self.repository.flare_events))

    def test_validation_rejection_records_validation_failure_without_event(self) -> None:
        self.trace.seed_initiated(trace_id="trace-1", user_id="user-1", response_mode="configured")

        response = self.api.handle_request(
            method="POST",
            path="/api/flare-events",
            headers={"authorization": "Bearer token", "idempotency-key": "trace-1"},
            body=json.dumps({"behavior_label_snapshot": " ", "response_mode": "configured"}).encode("utf-8"),
        )

        self.assertEqual(HTTPStatus.UNPROCESSABLE_ENTITY, response.status_code)
        trace = self.trace.rows["trace-1"]
        self.assertEqual("failed", trace["status"])
        self.assertEqual("validation", trace["failure_stage"])
        self.assertEqual("validation_rejected", trace["failure_code"])
        self.assertEqual(HTTPStatus.UNPROCESSABLE_ENTITY, trace["terminal_http_status"])
        self.assertIsNone(trace["flare_event_id"])
        self.assertIsNone(trace["flare_event_created_at"])
        self.assertEqual(0, len(self.repository.flare_events))

    def test_missing_idempotency_key_returns_conflict_without_trace_mutation(self) -> None:
        response = self.api.handle_request(
            method="POST",
            path="/api/flare-events",
            headers={"authorization": "Bearer token"},
            body=json.dumps(
                {
                    "behavior_label_snapshot": "Scrolling",
                    "response_mode": "configured",
                }
            ).encode("utf-8"),
        )

        self.assertEqual(HTTPStatus.CONFLICT, response.status_code)
        self.assertEqual("FLARE_PLAN_IDEMPOTENCY_KEY_REQUIRED", response.body["error"]["code"])
        self.assertEqual(0, len(self.trace.rows))
        self.assertEqual(0, len(self.repository.flare_events))

    def test_mismatched_trace_owner_does_not_advance_existing_row(self) -> None:
        self.trace.seed_initiated(trace_id="trace-1", user_id="user-2", response_mode="configured")

        response = self.api.handle_request(
            method="POST",
            path="/api/flare-events",
            headers={"authorization": "Bearer token", "idempotency-key": "trace-1"},
            body=json.dumps(
                {
                    "behavior_label_snapshot": "Scrolling",
                    "response_mode": "configured",
                }
            ).encode("utf-8"),
        )

        self.assertEqual(HTTPStatus.CREATED, response.status_code)
        trace = self.trace.rows["trace-1"]
        self.assertEqual("initiated", trace["status"])
        self.assertEqual(0, trace["request_attempt_count"])
        self.assertIsNone(trace["backend_received_at"])
        self.assertIsNone(trace["flare_event_id"])

    def test_domain_persistence_failure_records_failed_trace_without_false_create_fields(self) -> None:
        trace = InMemoryTraceLifecycle()
        trace.seed_initiated(trace_id="trace-1", user_id="user-1", response_mode="configured")
        api = FlarePlanApi(
            authenticator=FakeAuthenticator(user_id="user-1"),
            service=FlarePlanService(
                repository=FailingCreateFlareEventRepository(),
                trace_lifecycle=trace,
            ),
            trace_lifecycle=trace,
        )

        with self.assertRaises(RuntimeError):
            api.handle_request(
                method="POST",
                path="/api/flare-events",
                headers={"authorization": "Bearer token", "idempotency-key": "trace-1"},
                body=json.dumps(
                    {
                        "behavior_label_snapshot": "Scrolling",
                        "response_mode": "configured",
                    }
                ).encode("utf-8"),
            )

        stored = trace.rows["trace-1"]
        self.assertEqual("failed", stored["status"])
        self.assertEqual("domain_persistence", stored["failure_stage"])
        self.assertEqual("flare_event_insert_failed", stored["failure_code"])
        self.assertIsNone(stored["flare_event_id"])
        self.assertIsNone(stored["flare_event_created_at"])

    def test_unexpected_backend_failure_uses_bounded_failure_representation(self) -> None:
        trace = InMemoryTraceLifecycle()
        trace.seed_initiated(trace_id="trace-1", user_id="user-1", response_mode="configured")
        api = FlarePlanApi(
            authenticator=FakeAuthenticator(user_id="user-1"),
            service=ExplodingFlarePlanService(),
            trace_lifecycle=trace,
        )

        with self.assertRaises(RuntimeError):
            api.handle_request(
                method="POST",
                path="/api/flare-events",
                headers={"authorization": "Bearer token", "idempotency-key": "trace-1"},
                body=json.dumps(
                    {
                        "behavior_label_snapshot": "Scrolling",
                        "response_mode": "configured",
                    }
                ).encode("utf-8"),
            )

        stored = trace.rows["trace-1"]
        self.assertEqual("failed", stored["status"])
        self.assertEqual("backend_unexpected", stored["failure_stage"])
        self.assertEqual("unexpected_server_error", stored["failure_code"])
        self.assertEqual(HTTPStatus.INTERNAL_SERVER_ERROR, stored["terminal_http_status"])
        self.assertNotIn("boom", json.dumps(stored, sort_keys=True))

    def test_trace_update_database_failure_is_logged_and_does_not_block_create(self) -> None:
        trace_service = FlareTraceService(
            repository=ExplodingTraceRepository(
                config=FlarePlanDatabaseConfig(dsn="postgresql://unused"),
            )
        )
        api = FlarePlanApi(
            authenticator=FakeAuthenticator(user_id="user-1"),
            service=FlarePlanService(
                repository=self.repository,
                trace_lifecycle=trace_service,
            ),
            trace_lifecycle=trace_service,
        )

        with self.assertLogs("backend.app.services.flare_trace_service", level="WARNING") as logs:
            response = api.handle_request(
                method="POST",
                path="/api/flare-events",
                headers={"authorization": "Bearer token", "idempotency-key": "trace-1"},
                body=json.dumps(
                    {
                        "behavior_label_snapshot": "Scrolling",
                        "response_mode": "configured",
                    }
                ).encode("utf-8"),
            )

        self.assertEqual(HTTPStatus.CREATED, response.status_code)
        self.assertEqual(1, len(self.repository.flare_events))
        self.assertTrue(any("Flare trace update failed" in line for line in logs.output))

    def test_retry_with_same_trace_id_increments_attempt_count_without_duplicate_event(self) -> None:
        self.trace.seed_initiated(trace_id="trace-1", user_id="user-1", response_mode="configured")
        body = json.dumps(
            {
                "behavior_label_snapshot": "Scrolling",
                "response_mode": "configured",
            }
        ).encode("utf-8")

        first = self.api.handle_request(
            method="POST",
            path="/api/flare-events",
            headers={"authorization": "Bearer token", "idempotency-key": "trace-1"},
            body=body,
        )
        second = self.api.handle_request(
            method="POST",
            path="/api/flare-events",
            headers={"authorization": "Bearer token", "idempotency-key": "trace-1"},
            body=body,
        )

        self.assertEqual(first.body["flare_event"]["id"], second.body["flare_event"]["id"])
        self.assertEqual(1, len(self.repository.flare_events))
        self.assertEqual(2, self.trace.rows["trace-1"]["request_attempt_count"])


class InMemoryTraceLifecycle:
    def __init__(self) -> None:
        self.rows: dict[str, dict[str, object | None]] = {}
        self._counter = 0

    def seed_initiated(self, *, trace_id: str, user_id: str, response_mode: str) -> None:
        self.rows[trace_id] = {
            "authenticated_at": None,
            "backend_received_at": None,
            "client_initiated_at": self._timestamp(),
            "completed_at": None,
            "failed_at": None,
            "failure_code": None,
            "failure_stage": None,
            "flare_event_created_at": None,
            "flare_event_id": None,
            "request_attempt_count": 0,
            "response_mode": response_mode,
            "status": "initiated",
            "terminal_http_status": None,
            "user_id": user_id,
            "validated_at": None,
        }

    def record_backend_received(self, *, trace_id: str, user_id: str) -> bool:
        row = self.rows.get(trace_id)
        if row is None or row["user_id"] != user_id:
            return False
        row["request_attempt_count"] = int(row["request_attempt_count"] or 0) + 1
        row["backend_received_at"] = row["backend_received_at"] or self._timestamp()
        if row["status"] not in {"completed", "failed"}:
            row["status"] = "backend_received"
        return True

    def record_authenticated(self, *, trace_id: str, user_id: str) -> bool:
        row = self.rows.get(trace_id)
        if row is None or row["user_id"] != user_id:
            return False
        row["authenticated_at"] = row["authenticated_at"] or self._timestamp()
        if row["status"] not in {"completed", "failed"}:
            row["status"] = "authenticated"
        return True

    def record_validated(self, *, trace_id: str, user_id: str) -> bool:
        row = self.rows.get(trace_id)
        if row is None or row["user_id"] != user_id:
            return False
        row["validated_at"] = row["validated_at"] or self._timestamp()
        if row["status"] not in {"completed", "failed"}:
            row["status"] = "validated"
        return True

    def record_completed(
        self,
        *,
        trace_id: str,
        user_id: str,
        flare_event_id: str,
        flare_event_created_at: str,
        terminal_http_status: int,
    ) -> bool:
        row = self.rows.get(trace_id)
        if row is None or row["user_id"] != user_id or row["status"] == "failed":
            return False
        row["completed_at"] = row["completed_at"] or self._timestamp()
        row["failure_code"] = None
        row["failure_stage"] = None
        row["failed_at"] = None
        row["flare_event_created_at"] = flare_event_created_at
        row["flare_event_id"] = flare_event_id
        row["status"] = "completed"
        row["terminal_http_status"] = int(terminal_http_status)
        return True

    def record_failed(
        self,
        *,
        trace_id: str,
        user_id: str,
        failure_stage: str,
        failure_code: str,
        terminal_http_status: int | HTTPStatus | None = None,
    ) -> bool:
        row = self.rows.get(trace_id)
        if row is None or row["user_id"] != user_id or row["status"] in {"completed", "failed"}:
            return False
        row["failed_at"] = row["failed_at"] or self._timestamp()
        row["failure_code"] = failure_code
        row["failure_stage"] = failure_stage
        row["status"] = "failed"
        if terminal_http_status is not None:
            row["terminal_http_status"] = (
                terminal_http_status.value
                if isinstance(terminal_http_status, HTTPStatus)
                else int(terminal_http_status)
            )
        return True

    def _timestamp(self) -> str:
        self._counter += 1
        return f"2026-07-17T00:00:{self._counter:02d}Z"


class FailingCreateFlareEventRepository(InMemoryFlarePlanRepository):
    def _create_flare_event(self, **kwargs):
        raise RuntimeError("insert failed")


class ExplodingFlarePlanService:
    def create_flare_event(self, command: CreateFlareEventCommand):
        raise RuntimeError("boom")


class ExplodingTraceRepository:
    def __init__(self, *, config: FlarePlanDatabaseConfig) -> None:
        self._config = config

    def record_backend_received(self, *, trace_id: str, user_id: str) -> bool:
        raise RuntimeError("trace backend received failed")

    def record_authenticated(self, *, trace_id: str, user_id: str) -> bool:
        raise RuntimeError("trace authenticated failed")

    def record_validated(self, *, trace_id: str, user_id: str) -> bool:
        raise RuntimeError("trace validated failed")

    def record_completed(
        self,
        *,
        trace_id: str,
        user_id: str,
        flare_event_id: str,
        flare_event_created_at: str,
        terminal_http_status: int,
    ) -> bool:
        raise RuntimeError("trace completed failed")

    def record_failed(self, *, trace_id: str, user_id: str, failure) -> bool:
        raise RuntimeError("trace failed failed")


class FlareTracePolicyTests(unittest.TestCase):
    def test_idempotency_conflict_is_classified_as_validation(self) -> None:
        trace = InMemoryTraceLifecycle()
        trace.seed_initiated(trace_id="trace-1", user_id="user-1", response_mode="configured")
        service = FlarePlanService(
            repository=IdempotencyConflictRepository(),
            trace_lifecycle=trace,
        )

        with self.assertRaises(FlarePlanError):
            service.create_flare_event(
                CreateFlareEventCommand(
                    user_id="user-1",
                    anchor_note_id=None,
                    anchor_note_version=None,
                    behavior_description_snapshot=None,
                    behavior_label_snapshot="Scrolling",
                    behavior_pattern_id=None,
                    response_mode="configured",
                    support_action_shown=None,
                    idempotency_key="trace-1",
                    trace_id="trace-1",
                )
            )

        stored = trace.rows["trace-1"]
        self.assertEqual("validation", stored["failure_stage"])
        self.assertEqual("idempotency_conflict", stored["failure_code"])


class IdempotencyConflictRepository(InMemoryFlarePlanRepository):
    def create_flare_event(self, **kwargs):
        raise FlarePlanError(
            code="FLARE_PLAN_IDEMPOTENCY_KEY_REUSED",
            message="already used",
            status_code=HTTPStatus.CONFLICT,
            details={},
        )
