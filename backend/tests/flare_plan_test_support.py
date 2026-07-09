from __future__ import annotations

import copy
from dataclasses import dataclass
from http import HTTPStatus
from itertools import count
from typing import Any

from backend.app.api.support_channels_api import AuthenticatedUser
from backend.app.db.flare_plan_repository import FlarePlanRepository
from backend.app.domain.flare_plan import (
    ActiveFlarePlanRecord,
    FlareEventRecord,
    FlarePlanActionRecord,
    FlarePlanError,
    FlarePlanRunActionRecord,
    FlarePlanRunProgressRecord,
    FlarePlanRunRecord,
    FlareResponseRecord,
    FlareSupportDeliveryRecord,
    IdempotentResponseRecord,
    MAXIMUM_ACTIVE_FLARE_PLAN_ACTIONS,
    StarterTemplateRecord,
    starter_template_sort_key,
)


@dataclass
class MutableTemplate:
    template_key: str
    title: str
    description: str | None
    category: str
    category_label: str
    display_position: int
    status: str = "active"


@dataclass
class MutableAction:
    id: str
    plan_id: str
    source_template_key: str | None
    title: str
    description: str | None
    position: int
    status: str
    created_at: str
    updated_at: str
    archived_at: str | None = None


@dataclass
class MutablePlan:
    id: str
    user_id: str
    updated_at: str


@dataclass
class MutableFlareEvent:
    id: str
    user_id: str
    status: str
    response_mode: str
    behavior_label_snapshot: str
    behavior_description_snapshot: str | None
    behavior_pattern_id: str | None
    anchor_note_id: str | None
    anchor_note_version: int | None
    support_action_shown: str | None
    support_action_taken: str | None
    created_at: str
    updated_at: str
    closed_at: str | None = None
    archived_at: str | None = None


@dataclass
class MutableRun:
    id: str
    flare_event_id: str
    source_plan_id: str | None
    status: str
    offered_at: str
    updated_at: str
    started_at: str | None = None
    declined_at: str | None = None
    completed_at: str | None = None
    ended_at: str | None = None


@dataclass
class MutableRunAction:
    id: str
    run_id: str
    source_action_id: str | None
    source_template_key: str | None
    title: str
    description: str | None
    position: int
    outcome: str
    responded_at: str | None = None


class InMemoryFlarePlanRepository(FlarePlanRepository):
    def __init__(self) -> None:
        self.templates = {
            "move_to_different_room": MutableTemplate(
                template_key="move_to_different_room",
                title="Move to a different room",
                description="Create some distance from where the pattern was happening.",
                category="change_the_situation",
                category_label="Change the situation",
                display_position=1,
            ),
            "step_outside_for_two_minutes": MutableTemplate(
                template_key="step_outside_for_two_minutes",
                title="Step outside for two minutes",
                description="Change your environment long enough to interrupt autopilot.",
                category="change_the_situation",
                category_label="Change the situation",
                display_position=2,
            ),
            "drink_a_glass_of_water": MutableTemplate(
                template_key="drink_a_glass_of_water",
                title="Drink a glass of water",
                description="Give your body one simple physical reset.",
                category="reset_your_body",
                category_label="Reset your body",
                display_position=1,
            ),
            "take_ten_slow_breaths": MutableTemplate(
                template_key="take_ten_slow_breaths",
                title="Take ten slow breaths",
                description="Slow the pace just enough to create a choice point.",
                category="reset_your_body",
                category_label="Reset your body",
                display_position=2,
            ),
            "open_my_anchor_note": MutableTemplate(
                template_key="open_my_anchor_note",
                title="Open my anchor note",
                description="Read the reminder you wrote while clear-minded.",
                category="interrupt_the_pattern",
                category_label="Interrupt the pattern",
                display_position=1,
            ),
            "set_a_two_minute_timer": MutableTemplate(
                template_key="set_a_two_minute_timer",
                title="Set a two-minute timer",
                description="Delay the next move and stay with the timer until it ends.",
                category="interrupt_the_pattern",
                category_label="Interrupt the pattern",
                display_position=2,
            ),
            "text_someone_safe": MutableTemplate(
                template_key="text_someone_safe",
                title="Text someone safe",
                description="Reach toward a person who can help you stay interrupted.",
                category="reach_toward_support",
                category_label="Reach toward support",
                display_position=1,
            ),
            "send_another_support_signal": MutableTemplate(
                template_key="send_another_support_signal",
                title="Send another support signal",
                description="Use your configured support path again if you want more backup.",
                category="reach_toward_support",
                category_label="Reach toward support",
                display_position=2,
            ),
            "inactive_template": MutableTemplate(
                template_key="inactive_template",
                title="Inactive",
                description=None,
                category="reach_toward_support",
                category_label="Reach toward support",
                display_position=99,
                status="inactive",
            ),
        }
        self.plan_ids: dict[str, str] = {}
        self.plans: dict[str, MutablePlan] = {}
        self.actions: dict[str, MutableAction] = {}
        self.flare_events: dict[str, MutableFlareEvent] = {}
        self.runs: dict[str, MutableRun] = {}
        self.run_actions: dict[str, MutableRunAction] = {}
        self.support_deliveries: dict[str, FlareSupportDeliveryRecord] = {}
        self.idempotency_records: dict[tuple[str, str, str, str], dict[str, Any]] = {}
        self.fail_next_reorder = False
        self.fail_next_archive = False
        self._id_counter = count(1)
        self._timestamp_counter = count(1)

    def list_active_templates(self, *, user_id: str) -> list[StarterTemplateRecord]:
        selected = {
            action.source_template_key
            for action in self.actions.values()
            if action.source_template_key
            and action.status == "active"
            and self.plans[action.plan_id].user_id == user_id
        }
        templates = [
            StarterTemplateRecord(
                template_key=template.template_key,
                title=template.title,
                description=template.description,
                category=template.category,
                category_label=template.category_label,
                display_position=template.display_position,
                is_selected=template.template_key in selected,
            )
            for template in self.templates.values()
            if template.status == "active"
        ]
        return sorted(templates, key=starter_template_sort_key)

    def read_active_plan(self, *, user_id: str) -> ActiveFlarePlanRecord:
        plan = self._get_or_create_plan(user_id)
        return self._build_plan(plan.id)

    def create_action_from_template(
        self,
        *,
        user_id: str,
        template_key: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation="create_from_template",
            target_resource=f"template:{template_key}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._create_from_template(user_id=user_id, template_key=template_key),
        )

    def create_custom_action(
        self,
        *,
        user_id: str,
        title: str,
        description: str | None,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation="create_custom_action",
            target_resource="plan:active",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._create_custom(user_id=user_id, title=title, description=description),
        )

    def update_action(
        self,
        *,
        user_id: str,
        action_id: str,
        title_provided: bool,
        title: str | None,
        description_provided: bool,
        description: str | None,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation="update_action",
            target_resource=f"action:{action_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._update_action(
                user_id=user_id,
                action_id=action_id,
                title_provided=title_provided,
                title=title,
                description_provided=description_provided,
                description=description,
            ),
        )

    def archive_action(
        self,
        *,
        user_id: str,
        action_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation="archive_action",
            target_resource=f"action:{action_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._archive_action(user_id=user_id, action_id=action_id),
        )

    def reorder_actions(
        self,
        *,
        user_id: str,
        action_ids: list[str],
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation="reorder_actions",
            target_resource="plan:active",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._reorder_actions(user_id=user_id, action_ids=action_ids),
        )

    def create_flare_event(
        self,
        *,
        user_id: str,
        anchor_note_id: str | None,
        anchor_note_version: int | None,
        behavior_description_snapshot: str | None,
        behavior_label_snapshot: str,
        behavior_pattern_id: str | None,
        response_mode: str,
        support_action_shown: str | None,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation="create_flare_event",
            target_resource="flare_event:new",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._create_flare_event(
                user_id=user_id,
                anchor_note_id=anchor_note_id,
                anchor_note_version=anchor_note_version,
                behavior_description_snapshot=behavior_description_snapshot,
                behavior_label_snapshot=behavior_label_snapshot,
                behavior_pattern_id=behavior_pattern_id,
                response_mode=response_mode,
                support_action_shown=support_action_shown,
            ),
        )

    def read_flare_response(self, *, user_id: str, flare_event_id: str) -> FlareResponseRecord:
        flare_event = self._get_owned_flare_event(user_id=user_id, flare_event_id=flare_event_id)
        run = self._get_run_for_event(user_id=user_id, flare_event_id=flare_event_id)
        return FlareResponseRecord(
            flare_event=self._event_record(flare_event),
            support_delivery=self.support_deliveries.get(flare_event_id),
            run=None if run is None else self._run_record(run),
        )

    def create_or_read_run_for_event(
        self,
        *,
        user_id: str,
        flare_event_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation="offer_run_for_event",
            target_resource=f"flare_event:{flare_event_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._create_or_read_run_for_event(user_id=user_id, flare_event_id=flare_event_id),
        )

    def read_run_for_event(self, *, user_id: str, flare_event_id: str) -> FlarePlanRunRecord | None:
        self._get_owned_flare_event(user_id=user_id, flare_event_id=flare_event_id)
        run = self._get_run_for_event(user_id=user_id, flare_event_id=flare_event_id)
        return None if run is None else self._run_record(run)

    def begin_run(
        self,
        *,
        user_id: str,
        run_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation="begin_run",
            target_resource=f"run:{run_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._begin_run(user_id=user_id, run_id=run_id),
        )

    def decline_run(
        self,
        *,
        user_id: str,
        run_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation="decline_run",
            target_resource=f"run:{run_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._decline_run(user_id=user_id, run_id=run_id),
        )

    def resolve_run_action(
        self,
        *,
        user_id: str,
        run_id: str,
        event_action_id: str,
        outcome: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation=f"resolve_run_action:{outcome}",
            target_resource=f"run_action:{event_action_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._resolve_run_action(
                user_id=user_id,
                run_id=run_id,
                event_action_id=event_action_id,
                outcome=outcome,
            ),
        )

    def end_run_early(
        self,
        *,
        user_id: str,
        run_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_mutation(
            user_id=user_id,
            operation="end_run_early",
            target_resource=f"run:{run_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda: self._end_run_early(user_id=user_id, run_id=run_id),
        )

    def _run_mutation(
        self,
        *,
        user_id: str,
        operation: str,
        target_resource: str,
        idempotency_key: str,
        request_fingerprint: str,
        callback,
    ) -> IdempotentResponseRecord:
        scope = (user_id, operation, target_resource, idempotency_key)
        existing = self.idempotency_records.get(scope)
        if existing is not None:
            if existing["request_fingerprint"] != request_fingerprint:
                raise FlarePlanError(
                    code="FLARE_PLAN_IDEMPOTENCY_KEY_REUSED",
                    message="Idempotency key was already used with different input.",
                    status_code=HTTPStatus.CONFLICT,
                    details={},
                )
            return IdempotentResponseRecord(status_code=existing["status_code"], body=existing["body"], replayed=True)
        snapshot = copy.deepcopy((self.plan_ids, self.plans, self.actions, self.idempotency_records))
        try:
            status_code, body = callback()
        except Exception:
            self.plan_ids, self.plans, self.actions, self.idempotency_records = snapshot
            raise
        self.idempotency_records[scope] = {
            "request_fingerprint": request_fingerprint,
            "status_code": status_code,
            "body": body,
        }
        return IdempotentResponseRecord(status_code=status_code, body=body)

    def _create_from_template(self, *, user_id: str, template_key: str) -> tuple[int, dict[str, Any]]:
        template = self.templates.get(template_key)
        if template is None or template.status != "active":
            raise FlarePlanError(
                code="FLARE_PLAN_TEMPLATE_NOT_FOUND",
                message="Starter template could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        plan = self._get_or_create_plan(user_id)
        active_actions = self._active_actions(plan.id)
        if any(action.source_template_key == template_key for action in active_actions):
            raise FlarePlanError(
                code="FLARE_PLAN_TEMPLATE_ALREADY_SELECTED",
                message="Starter template is already active in this plan.",
                status_code=HTTPStatus.CONFLICT,
                details={},
            )
        self._assert_capacity(active_actions)
        action = self._insert_action(
            plan_id=plan.id,
            source_template_key=template_key,
            title=template.title,
            description=template.description,
        )
        return HTTPStatus.CREATED, {
            "plan": self._build_plan(plan.id).to_public_dict(),
            "created_action_id": action.id,
        }

    def _create_custom(self, *, user_id: str, title: str, description: str | None) -> tuple[int, dict[str, Any]]:
        plan = self._get_or_create_plan(user_id)
        active_actions = self._active_actions(plan.id)
        self._assert_capacity(active_actions)
        action = self._insert_action(
            plan_id=plan.id,
            source_template_key=None,
            title=title,
            description=description,
        )
        return HTTPStatus.CREATED, {
            "plan": self._build_plan(plan.id).to_public_dict(),
            "created_action_id": action.id,
        }

    def _update_action(
        self,
        *,
        user_id: str,
        action_id: str,
        title_provided: bool,
        title: str | None,
        description_provided: bool,
        description: str | None,
    ) -> tuple[int, dict[str, Any]]:
        action = self.actions.get(action_id)
        if action is None or self.plans[action.plan_id].user_id != user_id or action.status != "active":
            raise FlarePlanError(
                code="FLARE_PLAN_ACTION_NOT_FOUND",
                message="Flare Plan action could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        if title_provided:
            action.title = title
        if description_provided:
            action.description = description
        action.updated_at = self._timestamp()
        return HTTPStatus.OK, {
            "plan": self._build_plan(action.plan_id).to_public_dict(),
            "updated_action_id": action.id,
        }

    def _archive_action(self, *, user_id: str, action_id: str) -> tuple[int, dict[str, Any]]:
        action = self.actions.get(action_id)
        if action is None or self.plans[action.plan_id].user_id != user_id:
            raise FlarePlanError(
                code="FLARE_PLAN_ACTION_NOT_FOUND",
                message="Flare Plan action could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        if action.status == "archived":
            return HTTPStatus.OK, {
                "plan": self._build_plan(action.plan_id).to_public_dict(),
                "archived_action_id": action.id,
            }
        action.status = "archived"
        action.archived_at = self._timestamp()
        if self.fail_next_archive:
            self.fail_next_archive = False
            raise RuntimeError("archive failure")
        self._resequence(action.plan_id)
        return HTTPStatus.OK, {
            "plan": self._build_plan(action.plan_id).to_public_dict(),
            "archived_action_id": action.id,
        }

    def _reorder_actions(self, *, user_id: str, action_ids: list[str]) -> tuple[int, dict[str, Any]]:
        duplicates = [value for index, value in enumerate(action_ids) if value in action_ids[:index]]
        if duplicates:
            raise FlarePlanError(
                code="FLARE_PLAN_REORDER_DUPLICATE_ACTION",
                message="Active action reorder contains duplicate action ids.",
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                details={},
            )
        plan = self._get_or_create_plan(user_id)
        active_actions = self._active_actions(plan.id)
        active_ids = [action.id for action in active_actions]
        missing = [action_id for action_id in active_ids if action_id not in action_ids]
        if missing:
            raise FlarePlanError(
                code="FLARE_PLAN_REORDER_MISSING_ACTION",
                message="Active action reorder omitted one or more active actions.",
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                details={},
            )
        unknown = [action_id for action_id in action_ids if action_id not in self.actions or self.actions[action_id].plan_id != plan.id]
        if unknown:
            raise FlarePlanError(
                code="FLARE_PLAN_REORDER_UNKNOWN_ACTION",
                message="Active action reorder referenced an unknown action.",
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                details={},
            )
        archived = [action_id for action_id in action_ids if self.actions[action_id].status != "active"]
        if archived:
            raise FlarePlanError(
                code="FLARE_PLAN_REORDER_ARCHIVED_ACTION",
                message="Active action reorder referenced an archived action.",
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                details={},
            )
        for position, action_id in enumerate(action_ids, start=1):
            self.actions[action_id].position = position
            self.actions[action_id].updated_at = self._timestamp()
            if self.fail_next_reorder and position == 1:
                self.fail_next_reorder = False
                raise RuntimeError("reorder failure")
        return HTTPStatus.OK, {"plan": self._build_plan(plan.id).to_public_dict()}

    def _create_flare_event(
        self,
        *,
        user_id: str,
        anchor_note_id: str | None,
        anchor_note_version: int | None,
        behavior_description_snapshot: str | None,
        behavior_label_snapshot: str,
        behavior_pattern_id: str | None,
        response_mode: str,
        support_action_shown: str | None,
    ) -> tuple[int, dict[str, Any]]:
        for flare_event in self.flare_events.values():
            if flare_event.user_id == user_id and flare_event.status == "active" and flare_event.archived_at is None:
                flare_event.status = "closed"
                flare_event.closed_at = flare_event.closed_at or self._timestamp()
                flare_event.updated_at = self._timestamp()
        flare_event = MutableFlareEvent(
            id=self._next_id("event"),
            user_id=user_id,
            status="active",
            response_mode=response_mode,
            behavior_label_snapshot=behavior_label_snapshot,
            behavior_description_snapshot=behavior_description_snapshot,
            behavior_pattern_id=behavior_pattern_id,
            anchor_note_id=anchor_note_id,
            anchor_note_version=anchor_note_version,
            support_action_shown=support_action_shown,
            support_action_taken=None,
            created_at=self._timestamp(),
            updated_at=self._timestamp(),
        )
        self.flare_events[flare_event.id] = flare_event
        run = self._ensure_run_for_event(user_id=user_id, flare_event_id=flare_event.id)
        return HTTPStatus.CREATED, {
            "flare_event": self._event_record(flare_event).to_public_dict(),
            "run": None if run is None else run.to_public_dict(),
        }

    def _create_or_read_run_for_event(self, *, user_id: str, flare_event_id: str) -> tuple[int, dict[str, Any]]:
        self._get_owned_flare_event(user_id=user_id, flare_event_id=flare_event_id)
        run = self._ensure_run_for_event(user_id=user_id, flare_event_id=flare_event_id)
        return HTTPStatus.OK, {"run": None if run is None else run.to_public_dict()}

    def _begin_run(self, *, user_id: str, run_id: str) -> tuple[int, dict[str, Any]]:
        run = self._owned_run(user_id=user_id, run_id=run_id)
        if run.status == "offered":
            run.status = "in_progress"
            run.started_at = run.started_at or self._timestamp()
            run.updated_at = self._timestamp()
        elif run.status == "declined":
            self._conflict("FLARE_PLAN_RUN_ALREADY_DECLINED", "Flare Plan Run has already been declined.")
        elif run.status in ("completed", "ended_early"):
            self._conflict("FLARE_PLAN_RUN_ALREADY_TERMINAL", "Flare Plan Run is already terminal.")
        return HTTPStatus.OK, {"run": self._run_record(run).to_public_dict()}

    def _decline_run(self, *, user_id: str, run_id: str) -> tuple[int, dict[str, Any]]:
        run = self._owned_run(user_id=user_id, run_id=run_id)
        if run.status != "offered":
            if run.status == "in_progress":
                self._conflict("FLARE_PLAN_RUN_ALREADY_STARTED", "Flare Plan Run has already started.")
            self._conflict("FLARE_PLAN_RUN_ALREADY_TERMINAL", "Flare Plan Run is already terminal.")
        for action in self._run_actions(run.id):
            if action.outcome == "pending":
                action.outcome = "not_reached"
        run.status = "declined"
        run.declined_at = run.declined_at or self._timestamp()
        run.updated_at = self._timestamp()
        return HTTPStatus.OK, {"run": self._run_record(run).to_public_dict()}

    def _resolve_run_action(
        self,
        *,
        user_id: str,
        run_id: str,
        event_action_id: str,
        outcome: str,
    ) -> tuple[int, dict[str, Any]]:
        run = self._owned_run(user_id=user_id, run_id=run_id)
        if run.status != "in_progress":
            self._conflict("FLARE_PLAN_RUN_NOT_IN_PROGRESS", "Flare Plan Run is not in progress.")
        action = self.run_actions.get(event_action_id)
        if action is None or action.run_id != run_id:
            raise FlarePlanError(
                code="FLARE_PLAN_EVENT_ACTION_NOT_FOUND",
                message="Flare Plan action could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        current = next((item for item in self._run_actions(run_id) if item.outcome == "pending"), None)
        if current is None:
            self._conflict("FLARE_PLAN_RUN_ALREADY_TERMINAL", "Flare Plan Run is already terminal.")
        if current.id != action.id:
            if action.outcome != "pending":
                self._conflict("FLARE_PLAN_ACTION_ALREADY_RESOLVED", "Flare Plan action was already resolved.")
            self._conflict("FLARE_PLAN_ACTION_NOT_CURRENT", "Flare Plan action is not current.")
        action.outcome = outcome
        action.responded_at = self._timestamp()
        run.updated_at = self._timestamp()
        if all(item.outcome != "pending" for item in self._run_actions(run_id)):
            run.status = "completed"
            run.completed_at = run.completed_at or self._timestamp()
            run.updated_at = self._timestamp()
        return HTTPStatus.OK, {"run": self._run_record(run).to_public_dict()}

    def _end_run_early(self, *, user_id: str, run_id: str) -> tuple[int, dict[str, Any]]:
        run = self._owned_run(user_id=user_id, run_id=run_id)
        if run.status != "in_progress":
            self._conflict("FLARE_PLAN_RUN_NOT_IN_PROGRESS", "Flare Plan Run is not in progress.")
        for action in self._run_actions(run_id):
            if action.outcome == "pending":
                action.outcome = "not_reached"
        run.status = "ended_early"
        run.ended_at = run.ended_at or self._timestamp()
        run.updated_at = self._timestamp()
        return HTTPStatus.OK, {"run": self._run_record(run).to_public_dict()}

    def _insert_action(
        self,
        *,
        plan_id: str,
        source_template_key: str | None,
        title: str,
        description: str | None,
    ) -> MutableAction:
        action = MutableAction(
            id=self._next_id("action"),
            plan_id=plan_id,
            source_template_key=source_template_key,
            title=title,
            description=description,
            position=len(self._active_actions(plan_id)) + 1,
            status="active",
            created_at=self._timestamp(),
            updated_at=self._timestamp(),
        )
        self.actions[action.id] = action
        return action

    def _get_or_create_plan(self, user_id: str) -> MutablePlan:
        plan_id = self.plan_ids.get(user_id)
        if plan_id is not None:
            return self.plans[plan_id]
        plan = MutablePlan(id=self._next_id("plan"), user_id=user_id, updated_at=self._timestamp())
        self.plan_ids[user_id] = plan.id
        self.plans[plan.id] = plan
        return plan

    def _get_owned_flare_event(self, *, user_id: str, flare_event_id: str) -> MutableFlareEvent:
        flare_event = self.flare_events.get(flare_event_id)
        if flare_event is None or flare_event.user_id != user_id:
            raise FlarePlanError(
                code="FLARE_EVENT_NOT_FOUND",
                message="Flare Event could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        return flare_event

    def _get_run_for_event(self, *, user_id: str, flare_event_id: str) -> MutableRun | None:
        self._get_owned_flare_event(user_id=user_id, flare_event_id=flare_event_id)
        return next((run for run in self.runs.values() if run.flare_event_id == flare_event_id), None)

    def _owned_run(self, *, user_id: str, run_id: str) -> MutableRun:
        run = self.runs.get(run_id)
        if run is None:
            raise FlarePlanError(
                code="FLARE_PLAN_RUN_NOT_FOUND",
                message="Flare Plan Run could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        self._get_owned_flare_event(user_id=user_id, flare_event_id=run.flare_event_id)
        return run

    def _run_actions(self, run_id: str) -> list[MutableRunAction]:
        return sorted(
            [action for action in self.run_actions.values() if action.run_id == run_id],
            key=lambda action: (action.position, action.id),
        )

    def _ensure_run_for_event(self, *, user_id: str, flare_event_id: str) -> FlarePlanRunRecord | None:
        existing = self._get_run_for_event(user_id=user_id, flare_event_id=flare_event_id)
        if existing is not None:
            return self._run_record(existing)
        plan = self._get_or_create_plan(user_id)
        active_actions = self._active_actions(plan.id)
        if len(active_actions) == 0:
            return None
        run = MutableRun(
            id=self._next_id("run"),
            flare_event_id=flare_event_id,
            source_plan_id=plan.id,
            status="offered",
            offered_at=self._timestamp(),
            updated_at=self._timestamp(),
        )
        self.runs[run.id] = run
        for action in active_actions:
            run_action = MutableRunAction(
                id=self._next_id("event-action"),
                run_id=run.id,
                source_action_id=action.id,
                source_template_key=action.source_template_key,
                title=action.title,
                description=action.description,
                position=action.position,
                outcome="pending",
            )
            self.run_actions[run_action.id] = run_action
        return self._run_record(run)

    def _event_record(self, flare_event: MutableFlareEvent) -> FlareEventRecord:
        return FlareEventRecord(
            id=flare_event.id,
            user_id=flare_event.user_id,
            status=flare_event.status,
            response_mode=flare_event.response_mode,
            behavior_label_snapshot=flare_event.behavior_label_snapshot,
            behavior_description_snapshot=flare_event.behavior_description_snapshot,
            behavior_pattern_id=flare_event.behavior_pattern_id,
            anchor_note_id=flare_event.anchor_note_id,
            anchor_note_version=flare_event.anchor_note_version,
            support_action_shown=flare_event.support_action_shown,
            support_action_taken=flare_event.support_action_taken,
            created_at=flare_event.created_at,
            updated_at=flare_event.updated_at,
            closed_at=flare_event.closed_at,
            archived_at=flare_event.archived_at,
        )

    def _run_record(self, run: MutableRun) -> FlarePlanRunRecord:
        actions = [
            FlarePlanRunActionRecord(
                id=action.id,
                source_action_id=action.source_action_id,
                source_template_key=action.source_template_key,
                title=action.title,
                description=action.description,
                position=action.position,
                outcome=action.outcome,
                responded_at=action.responded_at,
            )
            for action in self._run_actions(run.id)
        ]
        current_action = next((action for action in actions if action.outcome == "pending"), None)
        return FlarePlanRunRecord(
            id=run.id,
            flare_event_id=run.flare_event_id,
            source_plan_id=run.source_plan_id,
            status=run.status,
            current_action=current_action,
            progress=FlarePlanRunProgressRecord(
                current_position=None if current_action is None else current_action.position,
                total_count=len(actions),
                done_count=sum(1 for action in actions if action.outcome == "done"),
                skipped_count=sum(1 for action in actions if action.outcome == "skipped"),
                not_reached_count=sum(1 for action in actions if action.outcome == "not_reached"),
                pending_count=sum(1 for action in actions if action.outcome == "pending"),
            ),
            actions=actions,
            offered_at=run.offered_at,
            started_at=run.started_at,
            declined_at=run.declined_at,
            completed_at=run.completed_at,
            ended_at=run.ended_at,
            updated_at=run.updated_at,
        )

    def _build_plan(self, plan_id: str) -> ActiveFlarePlanRecord:
        actions = [
            FlarePlanActionRecord(
                id=action.id,
                source_template_key=action.source_template_key,
                title=action.title,
                description=action.description,
                position=action.position,
                is_active=action.status == "active",
                created_at=action.created_at,
                updated_at=action.updated_at,
            )
            for action in self._active_actions(plan_id)
        ]
        updated_at = self.plans[plan_id].updated_at
        if actions:
            updated_at = max([updated_at, *[action.updated_at for action in actions]])
        return ActiveFlarePlanRecord(
            id=plan_id,
            is_configured=bool(actions),
            active_action_count=len(actions),
            maximum_active_actions=MAXIMUM_ACTIVE_FLARE_PLAN_ACTIONS,
            actions=actions,
            updated_at=updated_at,
        )

    def _active_actions(self, plan_id: str) -> list[MutableAction]:
        return sorted(
            [
                action
                for action in self.actions.values()
                if action.plan_id == plan_id and action.status == "active"
            ],
            key=lambda action: (action.position, action.id),
        )

    def _assert_capacity(self, active_actions: list[MutableAction]) -> None:
        if len(active_actions) >= MAXIMUM_ACTIVE_FLARE_PLAN_ACTIONS:
            raise FlarePlanError(
                code="FLARE_PLAN_ACTIVE_ACTION_LIMIT_REACHED",
                message="Flare Plan already has the maximum number of active actions.",
                status_code=HTTPStatus.CONFLICT,
                details={},
            )

    def _resequence(self, plan_id: str) -> None:
        for position, action in enumerate(self._active_actions(plan_id), start=1):
            action.position = position
            action.updated_at = self._timestamp()

    def _conflict(self, code: str, message: str) -> None:
        raise FlarePlanError(
            code=code,
            message=message,
            status_code=HTTPStatus.CONFLICT,
            details={},
        )

    def _next_id(self, prefix: str) -> str:
        return f"{prefix}-{next(self._id_counter)}"

    def _timestamp(self) -> str:
        return f"2026-07-08T00:00:{next(self._timestamp_counter):02d}Z"


class FakeAuthenticator:
    def __init__(self, *, user_id: str) -> None:
        self.user_id = user_id

    def authenticate(self, headers: dict[str, str]) -> AuthenticatedUser | None:
        if "authorization" not in headers:
            return None
        return AuthenticatedUser(user_id=self.user_id)


class RejectingAuthenticator:
    def authenticate(self, headers: dict[str, str]) -> AuthenticatedUser | None:
        return None
