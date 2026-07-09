from __future__ import annotations

import json
import unittest

from backend.app.api.flare_plan_api import FlarePlanApi
from backend.app.domain.flare_plan import FlarePlanError, FlareSupportDeliveryRecord
from backend.app.services.flare_plan_service import (
    CreateCustomFlarePlanActionCommand,
    CreateFlareEventCommand,
    FlarePlanService,
    ResolveFlarePlanRunActionCommand,
    TransitionFlarePlanRunCommand,
)
from backend.tests.flare_plan_test_support import FakeAuthenticator, InMemoryFlarePlanRepository


class FlarePlanRunServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = InMemoryFlarePlanRepository()
        self.service = FlarePlanService(repository=self.repository)

    def test_configured_plan_creates_exactly_one_offered_run_and_snapshots_active_actions_in_order(self) -> None:
        first = self._create_action("First", idempotency_key="idem-1").body["created_action_id"]
        second = self._create_action("Second", idempotency_key="idem-2").body["created_action_id"]

        created = self.service.create_flare_event(
            CreateFlareEventCommand(
                user_id="user-1",
                anchor_note_id=None,
                anchor_note_version=None,
                behavior_description_snapshot="Pattern",
                behavior_label_snapshot="Scrolling",
                behavior_pattern_id=None,
                response_mode="configured",
                support_action_shown="Drink water",
                idempotency_key="send-1",
            )
        )

        run = created.body["run"]
        self.assertEqual("offered", run["status"])
        self.assertEqual([first, second], [action["source_action_id"] for action in run["actions"]])
        self.assertEqual(["First", "Second"], [action["title"] for action in run["actions"]])
        self.assertEqual(1, len(self.repository.runs))

    def test_no_configured_plan_creates_no_run(self) -> None:
        created = self.service.create_flare_event(
            CreateFlareEventCommand(
                user_id="user-1",
                anchor_note_id=None,
                anchor_note_version=None,
                behavior_description_snapshot=None,
                behavior_label_snapshot="Scrolling",
                behavior_pattern_id=None,
                response_mode="fallback-generic",
                support_action_shown=None,
                idempotency_key="send-1",
            )
        )
        self.assertIsNone(created.body["run"])

    def test_support_delivery_failure_still_allows_offered_run(self) -> None:
        self._create_action("First", idempotency_key="idem-1")
        created = self.service.create_flare_event(
            CreateFlareEventCommand(
                user_id="user-1",
                anchor_note_id=None,
                anchor_note_version=None,
                behavior_description_snapshot=None,
                behavior_label_snapshot="Scrolling",
                behavior_pattern_id=None,
                response_mode="configured",
                support_action_shown=None,
                idempotency_key="send-1",
            )
        )
        event_id = created.body["flare_event"]["id"]
        self.repository.support_deliveries[event_id] = FlareSupportDeliveryRecord(
            status="failed",
            attempted_at="2026-07-08T00:00:30Z",
            delivered_at=None,
            error_code="groupme_http_500",
            error_message_safe="GroupMe rejected the support message.",
            destination_display_name="Close Friends",
        )

        response = self.service.read_flare_response(user_id="user-1", flare_event_id=event_id)

        self.assertEqual("failed", response.support_delivery.status)
        self.assertEqual("offered", response.run.status)

    def test_duplicate_run_creation_is_idempotent(self) -> None:
        self._create_action("First", idempotency_key="idem-1")
        created = self.service.create_flare_event(
            CreateFlareEventCommand(
                user_id="user-1",
                anchor_note_id=None,
                anchor_note_version=None,
                behavior_description_snapshot=None,
                behavior_label_snapshot="Scrolling",
                behavior_pattern_id=None,
                response_mode="configured",
                support_action_shown=None,
                idempotency_key="send-1",
            )
        )
        event_id = created.body["flare_event"]["id"]

        first = self.service.create_or_read_run_for_event(
            user_id="user-1",
            flare_event_id=event_id,
            idempotency_key="offer-1",
        )
        second = self.service.create_or_read_run_for_event(
            user_id="user-1",
            flare_event_id=event_id,
            idempotency_key="offer-1",
        )

        self.assertEqual(first.body, second.body)
        self.assertEqual(1, len(self.repository.runs))

    def test_begin_decline_done_skip_end_early_and_resume_flow(self) -> None:
        self._create_action("First", idempotency_key="idem-1")
        self._create_action("Second", idempotency_key="idem-2")
        self._create_action("Third", idempotency_key="idem-3")
        created = self.service.create_flare_event(
            CreateFlareEventCommand(
                user_id="user-1",
                anchor_note_id=None,
                anchor_note_version=None,
                behavior_description_snapshot=None,
                behavior_label_snapshot="Scrolling",
                behavior_pattern_id=None,
                response_mode="configured",
                support_action_shown=None,
                idempotency_key="send-1",
            )
        )
        run_id = created.body["run"]["id"]
        first_action = created.body["run"]["actions"][0]["id"]
        second_action = created.body["run"]["actions"][1]["id"]

        begun = self.service.begin_run(
            TransitionFlarePlanRunCommand(user_id="user-1", run_id=run_id, idempotency_key="begin-1")
        )
        self.assertEqual("in_progress", begun.body["run"]["status"])
        self.assertEqual(first_action, begun.body["run"]["current_action"]["id"])

        done = self.service.mark_action_done(
            ResolveFlarePlanRunActionCommand(
                user_id="user-1",
                run_id=run_id,
                event_action_id=first_action,
                idempotency_key="done-1",
            )
        )
        self.assertEqual(second_action, done.body["run"]["current_action"]["id"])
        self.assertEqual(1, done.body["run"]["progress"]["done_count"])

        resumed = self.service.read_run_for_event(user_id="user-1", flare_event_id=created.body["flare_event"]["id"])
        self.assertEqual(second_action, resumed.current_action.id)

        skipped = self.service.mark_action_skipped(
            ResolveFlarePlanRunActionCommand(
                user_id="user-1",
                run_id=run_id,
                event_action_id=second_action,
                idempotency_key="skip-1",
            )
        )
        self.assertEqual(1, skipped.body["run"]["progress"]["skipped_count"])

        ended = self.service.end_run_early(
            TransitionFlarePlanRunCommand(user_id="user-1", run_id=run_id, idempotency_key="end-1")
        )
        self.assertEqual("ended_early", ended.body["run"]["status"])
        self.assertEqual(1, ended.body["run"]["progress"]["not_reached_count"])
        self.assertIsNone(ended.body["run"]["current_action"])

        replay = self.service.end_run_early(
            TransitionFlarePlanRunCommand(user_id="user-1", run_id=run_id, idempotency_key="end-1")
        )
        self.assertEqual(ended.body, replay.body)

    def test_decline_marks_unresolved_actions_not_reached(self) -> None:
        self._create_action("First", idempotency_key="idem-1")
        self._create_action("Second", idempotency_key="idem-2")
        created = self._create_event()

        declined = self.service.decline_run(
            TransitionFlarePlanRunCommand(
                user_id="user-1",
                run_id=created.body["run"]["id"],
                idempotency_key="decline-1",
            )
        )

        self.assertEqual("declined", declined.body["run"]["status"])
        self.assertEqual(["not_reached", "not_reached"], [action["outcome"] for action in declined.body["run"]["actions"]])

    def test_only_current_action_may_be_answered_and_conflicting_outcome_preserves_first(self) -> None:
        self._create_action("First", idempotency_key="idem-1")
        self._create_action("Second", idempotency_key="idem-2")
        created = self._create_event()
        run_id = created.body["run"]["id"]
        first_action = created.body["run"]["actions"][0]["id"]
        second_action = created.body["run"]["actions"][1]["id"]
        self.service.begin_run(
            TransitionFlarePlanRunCommand(user_id="user-1", run_id=run_id, idempotency_key="begin-1")
        )

        with self.assertRaises(FlarePlanError) as stale:
            self.service.mark_action_skipped(
                ResolveFlarePlanRunActionCommand(
                    user_id="user-1",
                    run_id=run_id,
                    event_action_id=second_action,
                    idempotency_key="skip-stale",
                )
            )
        self.assertEqual("FLARE_PLAN_ACTION_NOT_CURRENT", stale.exception.code)

        done = self.service.mark_action_done(
            ResolveFlarePlanRunActionCommand(
                user_id="user-1",
                run_id=run_id,
                event_action_id=first_action,
                idempotency_key="done-1",
            )
        )
        replay = self.service.mark_action_done(
            ResolveFlarePlanRunActionCommand(
                user_id="user-1",
                run_id=run_id,
                event_action_id=first_action,
                idempotency_key="done-1",
            )
        )
        self.assertEqual(done.body, replay.body)

        with self.assertRaises(FlarePlanError) as conflict:
            self.service.mark_action_skipped(
                ResolveFlarePlanRunActionCommand(
                    user_id="user-1",
                    run_id=run_id,
                    event_action_id=first_action,
                    idempotency_key="skip-conflict",
                )
            )
        self.assertEqual("FLARE_PLAN_ACTION_ALREADY_RESOLVED", conflict.exception.code)

    def test_final_action_completes_run_and_historical_snapshot_is_unchanged_by_plan_edits(self) -> None:
        first = self._create_action("First", idempotency_key="idem-1").body["created_action_id"]
        created = self._create_event()
        run_id = created.body["run"]["id"]
        event_action_id = created.body["run"]["actions"][0]["id"]
        self.service.begin_run(
            TransitionFlarePlanRunCommand(user_id="user-1", run_id=run_id, idempotency_key="begin-1")
        )

        self.service.update_action(
            command=self._update_action_command(action_id=first, title="Changed")
        )
        completed = self.service.mark_action_done(
            ResolveFlarePlanRunActionCommand(
                user_id="user-1",
                run_id=run_id,
                event_action_id=event_action_id,
                idempotency_key="done-1",
            )
        )

        self.assertEqual("completed", completed.body["run"]["status"])
        self.assertEqual("First", completed.body["run"]["actions"][0]["title"])

    def test_run_ownership_isolation(self) -> None:
        self._create_action("Mine", idempotency_key="idem-1")
        created = self._create_event()
        run_id = created.body["run"]["id"]
        event_action_id = created.body["run"]["actions"][0]["id"]

        with self.assertRaises(FlarePlanError):
            self.service.begin_run(
                TransitionFlarePlanRunCommand(user_id="user-2", run_id=run_id, idempotency_key="begin-1")
            )
        with self.assertRaises(FlarePlanError):
            self.service.read_flare_response(user_id="user-2", flare_event_id=created.body["flare_event"]["id"])
        with self.assertRaises(FlarePlanError):
            self.service.mark_action_done(
                ResolveFlarePlanRunActionCommand(
                    user_id="user-2",
                    run_id=run_id,
                    event_action_id=event_action_id,
                    idempotency_key="done-1",
                )
            )

    def _create_event(self):
        return self.service.create_flare_event(
            CreateFlareEventCommand(
                user_id="user-1",
                anchor_note_id=None,
                anchor_note_version=None,
                behavior_description_snapshot=None,
                behavior_label_snapshot="Scrolling",
                behavior_pattern_id=None,
                response_mode="configured",
                support_action_shown=None,
                idempotency_key="send-1",
            )
        )

    def _create_action(self, title: str, *, idempotency_key: str):
        return self.service.create_custom_action(
            CreateCustomFlarePlanActionCommand(
                user_id="user-1",
                title=title,
                description=None,
                idempotency_key=idempotency_key,
            )
        )

    def _update_action_command(self, *, action_id: str, title: str):
        from backend.app.services.flare_plan_service import UpdateFlarePlanActionCommand

        return UpdateFlarePlanActionCommand(
            user_id="user-1",
            action_id=action_id,
            title=title,
            title_provided=True,
            idempotency_key="update-1",
        )


class FlarePlanRunApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = InMemoryFlarePlanRepository()
        service = FlarePlanService(repository=self.repository)
        service.create_custom_action(
            CreateCustomFlarePlanActionCommand(
                user_id="user-1",
                title="First",
                description=None,
                idempotency_key="idem-1",
            )
        )
        self.api = FlarePlanApi(
            authenticator=FakeAuthenticator(user_id="user-1"),
            service=service,
        )

    def test_create_event_and_transition_routes_return_canonical_run(self) -> None:
        created = self.api.handle_request(
            method="POST",
            path="/api/flare-events",
            headers={"authorization": "Bearer token", "idempotency-key": "send-1"},
            body=json.dumps(
                {
                    "behavior_label_snapshot": "Scrolling",
                    "response_mode": "configured",
                }
            ).encode("utf-8"),
        )
        payload = created.body
        self.assertEqual(201, created.status_code)
        self.assertEqual("offered", payload["run"]["status"])

        begun = self.api.handle_request(
            method="POST",
            path=f"/api/flare-plan-runs/{payload['run']['id']}/begin",
            headers={"authorization": "Bearer token", "idempotency-key": "begin-1"},
            body=b"{}",
        )
        self.assertEqual("in_progress", begun.body["run"]["status"])

        response = self.api.handle_request(
            method="GET",
            path=f"/api/flare-events/{payload['flare_event']['id']}/response",
            headers={"authorization": "Bearer token"},
            body=None,
        )
        self.assertEqual("in_progress", response.body["response"]["run"]["status"])

