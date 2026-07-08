from __future__ import annotations

import json
import unittest

from backend.app.api.flare_plan_api import FlarePlanApi
from backend.app.domain.flare_plan import FlarePlanError, MAXIMUM_ACTIVE_FLARE_PLAN_ACTIONS
from backend.app.services.flare_plan_service import (
    ArchiveFlarePlanActionCommand,
    CreateCustomFlarePlanActionCommand,
    CreateFlarePlanActionFromTemplateCommand,
    FlarePlanService,
    ReorderFlarePlanActionsCommand,
    UpdateFlarePlanActionCommand,
)
from backend.tests.flare_plan_test_support import (
    FakeAuthenticator,
    InMemoryFlarePlanRepository,
    RejectingAuthenticator,
)


class FlarePlanServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = InMemoryFlarePlanRepository()
        self.service = FlarePlanService(repository=self.repository)

    def test_active_starter_template_list_is_deterministic_and_excludes_inactive(self) -> None:
        templates = self.service.list_starter_templates(user_id="user-1")
        self.assertEqual(
            [
                "move_to_different_room",
                "step_outside_for_two_minutes",
                "drink_a_glass_of_water",
                "take_ten_slow_breaths",
                "open_my_anchor_note",
                "set_a_two_minute_timer",
                "text_someone_safe",
                "send_another_support_signal",
            ],
            [template.template_key for template in templates],
        )

    def test_template_selection_flags_false_then_true(self) -> None:
        self.assertTrue(all(not template.is_selected for template in self.service.list_starter_templates(user_id="user-1")))
        self.service.create_action_from_template(
            CreateFlarePlanActionFromTemplateCommand(
                user_id="user-1",
                template_key="move_to_different_room",
                idempotency_key="idem-1",
            )
        )
        selected = {template.template_key: template.is_selected for template in self.service.list_starter_templates(user_id="user-1")}
        self.assertTrue(selected["move_to_different_room"])
        self.assertFalse(selected["drink_a_glass_of_water"])

    def test_empty_plan_read_returns_not_configured_and_configured_read_is_ordered(self) -> None:
        empty_plan = self.service.read_active_plan(user_id="user-1")
        self.assertEqual(0, empty_plan.active_action_count)
        self.assertFalse(empty_plan.is_configured)

        self._create_custom(title=" First ", idempotency_key="idem-1")
        self._create_custom(title="Second", idempotency_key="idem-2")
        plan = self.service.read_active_plan(user_id="user-1")
        self.assertTrue(plan.is_configured)
        self.assertEqual(["First", "Second"], [action.title for action in plan.actions])
        self.assertEqual([1, 2], [action.position for action in plan.actions])

    def test_create_from_template_copies_current_template_content_and_prevents_duplicates(self) -> None:
        response = self.service.create_action_from_template(
            CreateFlarePlanActionFromTemplateCommand(
                user_id="user-1",
                template_key="move_to_different_room",
                idempotency_key="idem-1",
            )
        )
        self.assertEqual("move_to_different_room", response.body["plan"]["actions"][0]["source_template_key"])
        self.repository.templates["move_to_different_room"].title = "Changed template title"
        self.assertEqual("Move to a different room", self.service.read_active_plan(user_id="user-1").actions[0].title)
        with self.assertRaises(FlarePlanError) as error:
            self.service.create_action_from_template(
                CreateFlarePlanActionFromTemplateCommand(
                    user_id="user-1",
                    template_key="move_to_different_room",
                    idempotency_key="idem-2",
                )
            )
        self.assertEqual("FLARE_PLAN_TEMPLATE_ALREADY_SELECTED", error.exception.code)

    def test_custom_action_creation_and_validation(self) -> None:
        response = self._create_custom(title="  Put my phone away  ", description="  Ten minutes.  ", idempotency_key="idem-1")
        action = response.body["plan"]["actions"][0]
        self.assertEqual("Put my phone away", action["title"])
        self.assertEqual("Ten minutes.", action["description"])

        with self.assertRaises(FlarePlanError) as required:
            self._create_custom(title="   ", idempotency_key="idem-2")
        self.assertEqual("FLARE_PLAN_ACTION_TITLE_REQUIRED", required.exception.code)
        with self.assertRaises(FlarePlanError) as title_long:
            self._create_custom(title="x" * 121, idempotency_key="idem-3")
        self.assertEqual("FLARE_PLAN_ACTION_TITLE_TOO_LONG", title_long.exception.code)
        with self.assertRaises(FlarePlanError) as description_long:
            self._create_custom(title="ok", description="x" * 301, idempotency_key="idem-4")
        self.assertEqual("FLARE_PLAN_ACTION_DESCRIPTION_TOO_LONG", description_long.exception.code)

    def test_active_action_limit_is_enforced(self) -> None:
        for index in range(MAXIMUM_ACTIVE_FLARE_PLAN_ACTIONS):
            self._create_custom(title=f"Action {index}", idempotency_key=f"idem-{index}")
        with self.assertRaises(FlarePlanError) as error:
            self._create_custom(title="Too many", idempotency_key="idem-over")
        self.assertEqual("FLARE_PLAN_ACTIVE_ACTION_LIMIT_REACHED", error.exception.code)

    def test_editing_custom_and_starter_actions_keeps_template_global_copy_unchanged(self) -> None:
        custom_id = self._create_custom(title="Original custom", idempotency_key="idem-custom").body["created_action_id"]
        starter_id = self.service.create_action_from_template(
            CreateFlarePlanActionFromTemplateCommand(
                user_id="user-1",
                template_key="drink_a_glass_of_water",
                idempotency_key="idem-template",
            )
        ).body["created_action_id"]
        self.service.update_action(
            UpdateFlarePlanActionCommand(
                user_id="user-1",
                action_id=custom_id,
                title_provided=True,
                title="Updated custom",
                idempotency_key="idem-update-custom",
            )
        )
        self.service.update_action(
            UpdateFlarePlanActionCommand(
                user_id="user-1",
                action_id=starter_id,
                title_provided=True,
                title="Drink cold water",
                description_provided=True,
                description="Just one glass.",
                idempotency_key="idem-update-starter",
            )
        )
        plan = self.service.read_active_plan(user_id="user-1")
        self.assertEqual(["Updated custom", "Drink cold water"], [action.title for action in plan.actions])
        self.assertEqual("Drink a glass of water", self.repository.templates["drink_a_glass_of_water"].title)

    def test_update_can_clear_description_and_leave_omitted_fields_unchanged(self) -> None:
        action_id = self._create_custom(title="Original", description="Keep me", idempotency_key="idem-1").body["created_action_id"]
        self.service.update_action(
            UpdateFlarePlanActionCommand(
                user_id="user-1",
                action_id=action_id,
                description_provided=True,
                description=None,
                idempotency_key="idem-2",
            )
        )
        plan = self.service.read_active_plan(user_id="user-1")
        self.assertEqual("Original", plan.actions[0].title)
        self.assertIsNone(plan.actions[0].description)

    def test_update_with_no_fields_is_a_stable_no_op(self) -> None:
        action_id = self._create_custom(title="Original", description="Keep me", idempotency_key="idem-1").body["created_action_id"]
        response = self.service.update_action(
            UpdateFlarePlanActionCommand(
                user_id="user-1",
                action_id=action_id,
                idempotency_key="idem-2",
            )
        )
        self.assertEqual("Original", response.body["plan"]["actions"][0]["title"])
        self.assertEqual("Keep me", response.body["plan"]["actions"][0]["description"])

    def test_archiving_reorders_contiguously_and_reorder_validations_hold(self) -> None:
        first = self._create_custom(title="One", idempotency_key="idem-1").body["created_action_id"]
        second = self._create_custom(title="Two", idempotency_key="idem-2").body["created_action_id"]
        third = self._create_custom(title="Three", idempotency_key="idem-3").body["created_action_id"]
        archive = self.service.archive_action(
            ArchiveFlarePlanActionCommand(
                user_id="user-1",
                action_id=second,
                idempotency_key="idem-archive",
            )
        )
        self.assertEqual(["One", "Three"], [action["title"] for action in archive.body["plan"]["actions"]])
        self.assertEqual([1, 2], [action["position"] for action in archive.body["plan"]["actions"]])

        reordered = self.service.reorder_actions(
            ReorderFlarePlanActionsCommand(
                user_id="user-1",
                action_ids=[third, first],
                idempotency_key="idem-reorder",
            )
        )
        self.assertEqual([third, first], [action["id"] for action in reordered.body["plan"]["actions"]])

        with self.assertRaises(FlarePlanError) as duplicate:
            self.service.reorder_actions(
                ReorderFlarePlanActionsCommand(
                    user_id="user-1",
                    action_ids=[first, first],
                    idempotency_key="idem-dup",
                )
            )
        self.assertEqual("FLARE_PLAN_REORDER_DUPLICATE_ACTION", duplicate.exception.code)
        with self.assertRaises(FlarePlanError) as missing:
            self.service.reorder_actions(
                ReorderFlarePlanActionsCommand(
                    user_id="user-1",
                    action_ids=[first],
                    idempotency_key="idem-missing",
                )
            )
        self.assertEqual("FLARE_PLAN_REORDER_MISSING_ACTION", missing.exception.code)

    def test_archived_and_foreign_actions_are_isolated(self) -> None:
        foreign_action = self._create_custom(title="Foreign", user_id="user-2", idempotency_key="idem-foreign").body["created_action_id"]
        mine = self._create_custom(title="Mine", user_id="user-1", idempotency_key="idem-mine").body["created_action_id"]
        self.service.archive_action(
            ArchiveFlarePlanActionCommand(
                user_id="user-1",
                action_id=mine,
                idempotency_key="idem-archive-own",
            )
        )

        with self.assertRaises(FlarePlanError) as update_error:
            self.service.update_action(
                UpdateFlarePlanActionCommand(
                    user_id="user-1",
                    action_id=foreign_action,
                    title_provided=True,
                    title="Nope",
                    idempotency_key="idem-update",
                )
            )
        self.assertEqual("FLARE_PLAN_ACTION_NOT_FOUND", update_error.exception.code)
        with self.assertRaises(FlarePlanError) as archive_error:
            self.service.archive_action(
                ArchiveFlarePlanActionCommand(
                    user_id="user-1",
                    action_id=foreign_action,
                    idempotency_key="idem-archive",
                )
            )
        self.assertEqual("FLARE_PLAN_ACTION_NOT_FOUND", archive_error.exception.code)
        with self.assertRaises(FlarePlanError) as archived_reorder:
            self.service.reorder_actions(
                ReorderFlarePlanActionsCommand(
                    user_id="user-1",
                    action_ids=[mine],
                    idempotency_key="idem-archived-reorder",
                )
            )
        self.assertEqual("FLARE_PLAN_REORDER_ARCHIVED_ACTION", archived_reorder.exception.code)

    def test_idempotency_replay_conflict_and_transaction_rollback(self) -> None:
        first = self._create_custom(title="Replay me", idempotency_key="idem-1")
        second = self._create_custom(title="Replay me", idempotency_key="idem-1")
        self.assertEqual(first.body, second.body)
        with self.assertRaises(FlarePlanError) as error:
            self._create_custom(title="Different", idempotency_key="idem-1")
        self.assertEqual("FLARE_PLAN_IDEMPOTENCY_KEY_REUSED", error.exception.code)

        one = self._create_custom(title="One", user_id="user-2", idempotency_key="idem-a").body["created_action_id"]
        two = self._create_custom(title="Two", user_id="user-2", idempotency_key="idem-b").body["created_action_id"]
        three = self._create_custom(title="Three", user_id="user-2", idempotency_key="idem-c").body["created_action_id"]
        self.repository.fail_next_reorder = True
        with self.assertRaises(RuntimeError):
            self.service.reorder_actions(
                ReorderFlarePlanActionsCommand(
                    user_id="user-2",
                    action_ids=[three, one, two],
                    idempotency_key="idem-reorder-fail",
                )
            )
        self.assertEqual([one, two, three], [action.id for action in self.service.read_active_plan(user_id="user-2").actions])
        self.repository.fail_next_archive = True
        with self.assertRaises(RuntimeError):
            self.service.archive_action(
                ArchiveFlarePlanActionCommand(
                    user_id="user-2",
                    action_id=two,
                    idempotency_key="idem-archive-fail",
                )
            )
        self.assertEqual([one, two, three], [action.id for action in self.service.read_active_plan(user_id="user-2").actions])

    def test_readiness_and_safe_archive_retry(self) -> None:
        self.assertFalse(self.service.read_active_plan(user_id="user-1").is_configured)
        action_id = self._create_custom(title="One", idempotency_key="idem-1").body["created_action_id"]
        self.assertTrue(self.service.read_active_plan(user_id="user-1").is_configured)
        self.service.archive_action(
            ArchiveFlarePlanActionCommand(
                user_id="user-1",
                action_id=action_id,
                idempotency_key="idem-archive-1",
            )
        )
        response = self.service.archive_action(
            ArchiveFlarePlanActionCommand(
                user_id="user-1",
                action_id=action_id,
                idempotency_key="idem-archive-2",
            )
        )
        self.assertEqual(action_id, response.body["archived_action_id"])
        self.assertEqual([], response.body["plan"]["actions"])

    def test_archived_template_is_no_longer_selected_and_can_be_reselected(self) -> None:
        created_action_id = self.service.create_action_from_template(
            CreateFlarePlanActionFromTemplateCommand(
                user_id="user-1",
                template_key="move_to_different_room",
                idempotency_key="idem-1",
            )
        ).body["created_action_id"]
        self.service.archive_action(
            ArchiveFlarePlanActionCommand(
                user_id="user-1",
                action_id=created_action_id,
                idempotency_key="idem-2",
            )
        )
        selected = {template.template_key: template.is_selected for template in self.service.list_starter_templates(user_id="user-1")}
        self.assertFalse(selected["move_to_different_room"])
        replay = self.service.create_action_from_template(
            CreateFlarePlanActionFromTemplateCommand(
                user_id="user-1",
                template_key="move_to_different_room",
                idempotency_key="idem-3",
            )
        )
        self.assertEqual("move_to_different_room", replay.body["plan"]["actions"][0]["source_template_key"])

    def _create_custom(
        self,
        *,
        title: str,
        description: str | None = None,
        user_id: str = "user-1",
        idempotency_key: str,
    ):
        return self.service.create_custom_action(
            CreateCustomFlarePlanActionCommand(
                user_id=user_id,
                title=title,
                description=description,
                idempotency_key=idempotency_key,
            )
        )


class FlarePlanApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = InMemoryFlarePlanRepository()
        self.api = FlarePlanApi(
            authenticator=FakeAuthenticator(user_id="user-1"),
            service=FlarePlanService(repository=self.repository),
        )

    def test_templates_route_returns_ordered_payload(self) -> None:
        response = self._request("GET", "/api/flare-plan/templates")
        self.assertEqual(200, response.status_code)
        self.assertEqual("move_to_different_room", response.body["templates"][0]["template_key"])

    def test_create_custom_route_requires_idempotency_key(self) -> None:
        response = self._request("POST", "/api/flare-plan/actions", {"title": "One"})
        self.assertEqual(409, response.status_code)
        self.assertEqual("FLARE_PLAN_IDEMPOTENCY_KEY_REQUIRED", response.body["error"]["code"])

    def test_mutation_routes_return_canonical_plan_shape(self) -> None:
        create_one = self._request("POST", "/api/flare-plan/actions", {"title": " One "}, idempotency_key="idem-1")
        create_two = self._request(
            "POST",
            "/api/flare-plan/actions/from-template",
            {"template_key": "open_my_anchor_note"},
            idempotency_key="idem-2",
        )
        action_one = create_one.body["created_action_id"]
        action_two = create_two.body["created_action_id"]
        update = self._request(
            "PATCH",
            f"/api/flare-plan/actions/{action_two}",
            {"title": "Read my anchor note"},
            idempotency_key="idem-3",
        )
        reorder = self._request(
            "PUT",
            "/api/flare-plan/actions/order",
            {"action_ids": [action_two, action_one]},
            idempotency_key="idem-4",
        )
        archive = self._request("DELETE", f"/api/flare-plan/actions/{action_one}", idempotency_key="idem-5")
        self.assertEqual(200, update.status_code)
        self.assertEqual(200, reorder.status_code)
        self.assertEqual(200, archive.status_code)
        self.assertEqual(["Read my anchor note"], [action["title"] for action in archive.body["plan"]["actions"]])
        self.assertEqual([1], [action["position"] for action in archive.body["plan"]["actions"]])

    def test_patch_empty_body_is_a_stable_no_op(self) -> None:
        create = self._request("POST", "/api/flare-plan/actions", {"title": " One ", "description": " Keep "}, idempotency_key="idem-1")
        action_id = create.body["created_action_id"]
        response = self._request("PATCH", f"/api/flare-plan/actions/{action_id}", {}, idempotency_key="idem-2")
        self.assertEqual(200, response.status_code)
        self.assertEqual("One", response.body["plan"]["actions"][0]["title"])
        self.assertEqual("Keep", response.body["plan"]["actions"][0]["description"])

    def test_patch_null_description_clears_and_omitted_fields_remain_unchanged(self) -> None:
        create = self._request("POST", "/api/flare-plan/actions", {"title": " One ", "description": " Keep "}, idempotency_key="idem-1")
        action_id = create.body["created_action_id"]
        response = self._request(
            "PATCH",
            f"/api/flare-plan/actions/{action_id}",
            {"description": None},
            idempotency_key="idem-2",
        )
        self.assertEqual(200, response.status_code)
        self.assertEqual("One", response.body["plan"]["actions"][0]["title"])
        self.assertIsNone(response.body["plan"]["actions"][0]["description"])

    def test_malformed_json_returns_bad_request_without_raw_exception(self) -> None:
        response = self.api.handle_request(
            method="POST",
            path="/api/flare-plan/actions",
            headers={"authorization": "Bearer token", "idempotency-key": "idem-1"},
            body=b"{",
        )
        self.assertEqual(400, response.status_code)
        self.assertEqual("invalid_json", response.body["error"]["code"])

    def test_unauthenticated_requests_use_existing_auth_behavior(self) -> None:
        api = FlarePlanApi(
            authenticator=RejectingAuthenticator(),
            service=FlarePlanService(repository=self.repository),
        )
        response = api.handle_request(method="GET", path="/api/flare-plan", headers={}, body=None)
        self.assertEqual(401, response.status_code)
        self.assertEqual("unauthorized", response.body["error"]["code"])

    def _request(self, method: str, path: str, payload: dict | None = None, *, idempotency_key: str | None = None):
        headers = {"authorization": "Bearer token"}
        if idempotency_key is not None:
            headers["idempotency-key"] = idempotency_key
        return self.api.handle_request(
            method=method,
            path=path,
            headers=headers,
            body=None if payload is None else json.dumps(payload).encode("utf-8"),
        )
