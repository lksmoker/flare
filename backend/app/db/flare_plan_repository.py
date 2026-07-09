from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any, Callable

import psycopg2
from psycopg2 import extras
from psycopg2.extensions import connection as PgConnection
from psycopg2.extensions import cursor as PgCursor

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
    build_error_response,
    format_timestamp,
    starter_template_sort_key,
)
from backend.app.services.flare_plan_config import FlarePlanDatabaseConfig


class FlarePlanRepository:
    def list_active_templates(self, *, user_id: str) -> list[StarterTemplateRecord]:
        raise NotImplementedError

    def read_active_plan(self, *, user_id: str) -> ActiveFlarePlanRecord:
        raise NotImplementedError

    def create_action_from_template(
        self,
        *,
        user_id: str,
        template_key: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        raise NotImplementedError

    def create_custom_action(
        self,
        *,
        user_id: str,
        title: str,
        description: str | None,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        raise NotImplementedError

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
        raise NotImplementedError

    def archive_action(
        self,
        *,
        user_id: str,
        action_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        raise NotImplementedError

    def reorder_actions(
        self,
        *,
        user_id: str,
        action_ids: list[str],
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        raise NotImplementedError

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
        raise NotImplementedError

    def read_flare_response(self, *, user_id: str, flare_event_id: str) -> FlareResponseRecord:
        raise NotImplementedError

    def create_or_read_run_for_event(
        self,
        *,
        user_id: str,
        flare_event_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        raise NotImplementedError

    def read_run_for_event(self, *, user_id: str, flare_event_id: str) -> FlarePlanRunRecord | None:
        raise NotImplementedError

    def begin_run(
        self,
        *,
        user_id: str,
        run_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        raise NotImplementedError

    def decline_run(
        self,
        *,
        user_id: str,
        run_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        raise NotImplementedError

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
        raise NotImplementedError

    def end_run_early(
        self,
        *,
        user_id: str,
        run_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        raise NotImplementedError


@dataclass(frozen=True)
class _ActionRow:
    id: str
    plan_id: str
    source_template_key: str | None
    title: str
    description: str | None
    position: int
    status: str
    archived_at: str | None
    created_at: str
    updated_at: str

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "_ActionRow":
        return cls(
            id=str(row["id"]),
            plan_id=str(row["plan_id"]),
            source_template_key=_optional_str(row.get("source_template_key")),
            title=str(row["title"]),
            description=_optional_str(row.get("description")),
            position=int(row["position"]),
            status=str(row["status"]),
            archived_at=format_timestamp(row.get("archived_at")),
            created_at=format_timestamp(row.get("created_at")) or "",
            updated_at=format_timestamp(row.get("updated_at")) or "",
        )

    def to_record(self) -> FlarePlanActionRecord:
        return FlarePlanActionRecord(
            id=self.id,
            source_template_key=self.source_template_key,
            title=self.title,
            description=self.description,
            position=self.position,
            is_active=self.status == "active" and self.archived_at is None,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )


@dataclass(frozen=True)
class _PlanRow:
    id: str
    user_id: str
    updated_at: str


@dataclass(frozen=True)
class _FlareEventRow:
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
    closed_at: str | None
    archived_at: str | None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "_FlareEventRow":
        return cls(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            status=str(row["status"]),
            response_mode=str(row["response_mode"]),
            behavior_label_snapshot=str(row["behavior_label_snapshot"]),
            behavior_description_snapshot=_optional_str(row.get("behavior_description_snapshot")),
            behavior_pattern_id=_optional_str(row.get("behavior_pattern_id")),
            anchor_note_id=_optional_str(row.get("anchor_note_id")),
            anchor_note_version=None if row.get("anchor_note_version") is None else int(row["anchor_note_version"]),
            support_action_shown=_optional_str(row.get("support_action_shown")),
            support_action_taken=_optional_str(row.get("support_action_taken")),
            created_at=format_timestamp(row.get("created_at")) or "",
            updated_at=format_timestamp(row.get("updated_at")) or "",
            closed_at=format_timestamp(row.get("closed_at")),
            archived_at=format_timestamp(row.get("archived_at")),
        )

    def to_record(self) -> FlareEventRecord:
        return FlareEventRecord(
            id=self.id,
            user_id=self.user_id,
            status=self.status,
            response_mode=self.response_mode,
            behavior_label_snapshot=self.behavior_label_snapshot,
            behavior_description_snapshot=self.behavior_description_snapshot,
            behavior_pattern_id=self.behavior_pattern_id,
            anchor_note_id=self.anchor_note_id,
            anchor_note_version=self.anchor_note_version,
            support_action_shown=self.support_action_shown,
            support_action_taken=self.support_action_taken,
            created_at=self.created_at,
            updated_at=self.updated_at,
            closed_at=self.closed_at,
            archived_at=self.archived_at,
        )


@dataclass(frozen=True)
class _RunRow:
    id: str
    flare_event_id: str
    source_plan_id: str | None
    status: str
    offered_at: str
    started_at: str | None
    declined_at: str | None
    completed_at: str | None
    ended_at: str | None
    updated_at: str

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "_RunRow":
        return cls(
            id=str(row["id"]),
            flare_event_id=str(row["flare_event_id"]),
            source_plan_id=_optional_str(row.get("source_plan_id")),
            status=str(row["status"]),
            offered_at=format_timestamp(row.get("offered_at")) or "",
            started_at=format_timestamp(row.get("started_at")),
            declined_at=format_timestamp(row.get("declined_at")),
            completed_at=format_timestamp(row.get("completed_at")),
            ended_at=format_timestamp(row.get("ended_at")),
            updated_at=format_timestamp(row.get("updated_at")) or "",
        )


@dataclass(frozen=True)
class _RunActionRow:
    id: str
    run_id: str
    source_action_id: str | None
    source_template_key: str | None
    title: str
    description: str | None
    position: int
    outcome: str
    responded_at: str | None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "_RunActionRow":
        return cls(
            id=str(row["id"]),
            run_id=str(row["run_id"]),
            source_action_id=_optional_str(row.get("source_action_id")),
            source_template_key=_optional_str(row.get("source_template_key")),
            title=str(row["title"]),
            description=_optional_str(row.get("description")),
            position=int(row["position"]),
            outcome=str(row["outcome"]),
            responded_at=format_timestamp(row.get("responded_at")),
        )

    def to_record(self) -> FlarePlanRunActionRecord:
        return FlarePlanRunActionRecord(
            id=self.id,
            source_action_id=self.source_action_id,
            source_template_key=self.source_template_key,
            title=self.title,
            description=self.description,
            position=self.position,
            outcome=self.outcome,
            responded_at=self.responded_at,
        )

class PostgresFlarePlanRepository(FlarePlanRepository):
    def __init__(self, *, config: FlarePlanDatabaseConfig) -> None:
        self._config = config

    def list_active_templates(self, *, user_id: str) -> list[StarterTemplateRecord]:
        with self._connect() as connection, connection.cursor(cursor_factory=extras.RealDictCursor) as cursor:
            cursor.execute(
                """
                select
                    template_key,
                    title,
                    description,
                    category,
                    category_label,
                    display_position,
                    exists (
                        select 1
                        from public.flare_plan_actions action
                        join public.flare_plans plan on plan.id = action.plan_id
                        where plan.user_id = %s
                          and plan.status = 'active'
                          and plan.archived_at is null
                          and action.status = 'active'
                          and action.archived_at is null
                          and action.source_template_key = template.template_key
                    ) as is_selected
                from public.flare_plan_starter_templates template
                where template.status = 'active'
                """,
                (user_id,),
            )
            templates = [
                StarterTemplateRecord(
                    template_key=str(row["template_key"]),
                    title=str(row["title"]),
                    description=_optional_str(row.get("description")),
                    category=str(row["category"]),
                    category_label=str(row["category_label"]),
                    display_position=int(row["display_position"]),
                    is_selected=bool(row["is_selected"]),
                )
                for row in cursor.fetchall()
            ]
            return sorted(templates, key=starter_template_sort_key)

    def read_active_plan(self, *, user_id: str) -> ActiveFlarePlanRecord:
        with self._connect() as connection, connection.cursor(cursor_factory=extras.RealDictCursor) as cursor:
            plan = self._get_or_create_plan(cursor=cursor, user_id=user_id)
            return self._build_active_plan(cursor=cursor, plan=plan)

    def create_action_from_template(
        self,
        *,
        user_id: str,
        template_key: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation="create_from_template",
            target_resource=f"template:{template_key}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._create_action_from_template(
                cursor=cursor,
                user_id=user_id,
                template_key=template_key,
            ),
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
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation="create_custom_action",
            target_resource="plan:active",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._create_custom_action(
                cursor=cursor,
                user_id=user_id,
                title=title,
                description=description,
            ),
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
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation="update_action",
            target_resource=f"action:{action_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._update_action(
                cursor=cursor,
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
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation="archive_action",
            target_resource=f"action:{action_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._archive_action(
                cursor=cursor,
                user_id=user_id,
                action_id=action_id,
            ),
        )

    def reorder_actions(
        self,
        *,
        user_id: str,
        action_ids: list[str],
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation="reorder_actions",
            target_resource="plan:active",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._reorder_actions(
                cursor=cursor,
                user_id=user_id,
                action_ids=action_ids,
            ),
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
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation="create_flare_event",
            target_resource="flare_event:new",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._create_flare_event(
                cursor=cursor,
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
        with self._connect() as connection, connection.cursor(cursor_factory=extras.RealDictCursor) as cursor:
            flare_event = self._get_owned_flare_event(cursor=cursor, user_id=user_id, flare_event_id=flare_event_id)
            support_delivery = self._get_support_delivery(cursor=cursor, user_id=user_id, flare_event_id=flare_event_id)
            run = self._get_run_for_event(cursor=cursor, user_id=user_id, flare_event_id=flare_event_id)
            return FlareResponseRecord(
                flare_event=flare_event.to_record(),
                support_delivery=support_delivery,
                run=None if run is None else self._build_run_record(cursor=cursor, run=run),
            )

    def create_or_read_run_for_event(
        self,
        *,
        user_id: str,
        flare_event_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation="offer_run_for_event",
            target_resource=f"flare_event:{flare_event_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._create_or_read_run_for_event(
                cursor=cursor,
                user_id=user_id,
                flare_event_id=flare_event_id,
            ),
        )

    def read_run_for_event(self, *, user_id: str, flare_event_id: str) -> FlarePlanRunRecord | None:
        with self._connect() as connection, connection.cursor(cursor_factory=extras.RealDictCursor) as cursor:
            self._get_owned_flare_event(cursor=cursor, user_id=user_id, flare_event_id=flare_event_id)
            run = self._get_run_for_event(cursor=cursor, user_id=user_id, flare_event_id=flare_event_id)
            if run is None:
                return None
            return self._build_run_record(cursor=cursor, run=run)

    def begin_run(
        self,
        *,
        user_id: str,
        run_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation="begin_run",
            target_resource=f"run:{run_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._begin_run(cursor=cursor, user_id=user_id, run_id=run_id),
        )

    def decline_run(
        self,
        *,
        user_id: str,
        run_id: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord:
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation="decline_run",
            target_resource=f"run:{run_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._decline_run(cursor=cursor, user_id=user_id, run_id=run_id),
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
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation=f"resolve_run_action:{outcome}",
            target_resource=f"run_action:{event_action_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._resolve_run_action(
                cursor=cursor,
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
        return self._run_idempotent_mutation(
            user_id=user_id,
            operation="end_run_early",
            target_resource=f"run:{run_id}",
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
            callback=lambda cursor: self._end_run_early(cursor=cursor, user_id=user_id, run_id=run_id),
        )

    def _create_action_from_template(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        template_key: str,
    ) -> tuple[int, dict[str, Any]]:
        plan = self._get_or_create_plan(cursor=cursor, user_id=user_id)
        self._lock_plan(cursor=cursor, plan_id=plan.id)
        cursor.execute(
            """
            select template_key, title, description
            from public.flare_plan_starter_templates
            where template_key = %s
              and status = 'active'
            limit 1
            """,
            (template_key,),
        )
        template = cursor.fetchone()
        if template is None:
            raise FlarePlanError(
                code="FLARE_PLAN_TEMPLATE_NOT_FOUND",
                message="Starter template could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        cursor.execute(
            """
            select id
            from public.flare_plan_actions
            where plan_id = %s
              and status = 'active'
              and archived_at is null
              and source_template_key = %s
            limit 1
            """,
            (plan.id, template_key),
        )
        if cursor.fetchone() is not None:
            raise FlarePlanError(
                code="FLARE_PLAN_TEMPLATE_ALREADY_SELECTED",
                message="Starter template is already active in this plan.",
                status_code=HTTPStatus.CONFLICT,
                details={},
            )
        position = self._next_active_position(cursor=cursor, plan_id=plan.id)
        self._assert_active_action_capacity(cursor=cursor, plan_id=plan.id)
        cursor.execute(
            """
            insert into public.flare_plan_actions (
                plan_id,
                source_template_key,
                title,
                description,
                position,
                status
            )
            values (%s, %s, %s, %s, %s, 'active')
            returning id
            """,
            (
                plan.id,
                str(template["template_key"]),
                str(template["title"]),
                _optional_str(template.get("description")),
                position,
            ),
        )
        created_action_id = str(cursor.fetchone()["id"])
        current_plan = self._build_active_plan(cursor=cursor, plan=plan)
        return HTTPStatus.CREATED, {
            "plan": current_plan.to_public_dict(),
            "created_action_id": created_action_id,
        }

    def _create_custom_action(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        title: str,
        description: str | None,
    ) -> tuple[int, dict[str, Any]]:
        plan = self._get_or_create_plan(cursor=cursor, user_id=user_id)
        self._lock_plan(cursor=cursor, plan_id=plan.id)
        position = self._next_active_position(cursor=cursor, plan_id=plan.id)
        self._assert_active_action_capacity(cursor=cursor, plan_id=plan.id)
        cursor.execute(
            """
            insert into public.flare_plan_actions (
                plan_id,
                source_template_key,
                title,
                description,
                position,
                status
            )
            values (%s, null, %s, %s, %s, 'active')
            returning id
            """,
            (plan.id, title, description, position),
        )
        created_action_id = str(cursor.fetchone()["id"])
        current_plan = self._build_active_plan(cursor=cursor, plan=plan)
        return HTTPStatus.CREATED, {
            "plan": current_plan.to_public_dict(),
            "created_action_id": created_action_id,
        }

    def _update_action(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        action_id: str,
        title_provided: bool,
        title: str | None,
        description_provided: bool,
        description: str | None,
    ) -> tuple[int, dict[str, Any]]:
        action = self._get_owned_action(cursor=cursor, user_id=user_id, action_id=action_id)
        if action is None or action.status != "active" or action.archived_at is not None:
            raise FlarePlanError(
                code="FLARE_PLAN_ACTION_NOT_FOUND",
                message="Flare Plan action could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        next_title = action.title if not title_provided else title
        next_description = action.description if not description_provided else description
        cursor.execute(
            """
            update public.flare_plan_actions
            set title = %s, description = %s
            where id = %s
            returning id, plan_id
            """,
            (next_title, next_description, action_id),
        )
        updated = cursor.fetchone()
        plan = self._get_plan_by_id(cursor=cursor, plan_id=str(updated["plan_id"]), user_id=user_id)
        current_plan = self._build_active_plan(cursor=cursor, plan=plan)
        return HTTPStatus.OK, {
            "plan": current_plan.to_public_dict(),
            "updated_action_id": action_id,
        }

    def _archive_action(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        action_id: str,
    ) -> tuple[int, dict[str, Any]]:
        action = self._get_owned_action(cursor=cursor, user_id=user_id, action_id=action_id)
        if action is None:
            raise FlarePlanError(
                code="FLARE_PLAN_ACTION_NOT_FOUND",
                message="Flare Plan action could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        self._lock_plan(cursor=cursor, plan_id=action.plan_id)
        if action.status == "archived" or action.archived_at is not None:
            plan = self._get_plan_by_id(cursor=cursor, plan_id=action.plan_id, user_id=user_id)
            current_plan = self._build_active_plan(cursor=cursor, plan=plan)
            return HTTPStatus.OK, {
                "plan": current_plan.to_public_dict(),
                "archived_action_id": action_id,
            }
        cursor.execute(
            """
            update public.flare_plan_actions
            set status = 'archived', archived_at = now()
            where id = %s
            """,
            (action_id,),
        )
        self._resequence_active_actions(cursor=cursor, plan_id=action.plan_id)
        plan = self._get_plan_by_id(cursor=cursor, plan_id=action.plan_id, user_id=user_id)
        current_plan = self._build_active_plan(cursor=cursor, plan=plan)
        return HTTPStatus.OK, {
            "plan": current_plan.to_public_dict(),
            "archived_action_id": action_id,
        }

    def _reorder_actions(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        action_ids: list[str],
    ) -> tuple[int, dict[str, Any]]:
        duplicates = _duplicate_items(action_ids)
        if duplicates:
            raise FlarePlanError(
                code="FLARE_PLAN_REORDER_DUPLICATE_ACTION",
                message="Active action reorder contains duplicate action ids.",
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                details={"action_ids": duplicates},
            )
        plan = self._get_or_create_plan(cursor=cursor, user_id=user_id)
        self._lock_plan(cursor=cursor, plan_id=plan.id)
        active_actions = self._list_active_actions(cursor=cursor, plan_id=plan.id)
        active_ids = [action.id for action in active_actions]
        action_set = set(action_ids)
        missing_ids = [action_id for action_id in active_ids if action_id not in action_set]
        if missing_ids:
            raise FlarePlanError(
                code="FLARE_PLAN_REORDER_MISSING_ACTION",
                message="Active action reorder omitted one or more active actions.",
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                details={"action_ids": missing_ids},
            )
        owned_actions = self._list_owned_actions_by_ids(cursor=cursor, user_id=user_id, action_ids=action_ids)
        owned_by_id = {action.id: action for action in owned_actions}
        unknown_ids = [action_id for action_id in action_ids if action_id not in owned_by_id]
        if unknown_ids:
            raise FlarePlanError(
                code="FLARE_PLAN_REORDER_UNKNOWN_ACTION",
                message="Active action reorder referenced an unknown action.",
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                details={"action_ids": unknown_ids},
            )
        archived_ids = [
            action.id
            for action in owned_actions
            if action.status != "active" or action.archived_at is not None
        ]
        if archived_ids:
            raise FlarePlanError(
                code="FLARE_PLAN_REORDER_ARCHIVED_ACTION",
                message="Active action reorder referenced an archived action.",
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                details={"action_ids": archived_ids},
            )
        position_offset = len(active_actions)
        for action in active_actions:
            cursor.execute(
                """
                update public.flare_plan_actions
                set position = %s
                where id = %s
                """,
                (action.position + position_offset, action.id),
            )
        for position, action_id in enumerate(action_ids, start=1):
            cursor.execute(
                """
                update public.flare_plan_actions
                set position = %s
                where id = %s
                """,
                (position, action_id),
            )
        current_plan = self._build_active_plan(cursor=cursor, plan=plan)
        return HTTPStatus.OK, {"plan": current_plan.to_public_dict()}

    def _create_flare_event(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        anchor_note_id: str | None,
        anchor_note_version: int | None,
        behavior_description_snapshot: str | None,
        behavior_label_snapshot: str,
        behavior_pattern_id: str | None,
        response_mode: str,
        support_action_shown: str | None,
    ) -> tuple[int, dict[str, Any]]:
        cursor.execute(
            """
            update public.flare_events
            set status = 'closed',
                closed_at = coalesce(closed_at, now())
            where user_id = %s
              and status = 'active'
              and archived_at is null
            """,
            (user_id,),
        )
        cursor.execute(
            """
            insert into public.flare_events (
                user_id,
                anchor_note_id,
                anchor_note_version,
                behavior_description_snapshot,
                behavior_label_snapshot,
                behavior_pattern_id,
                response_mode,
                status,
                support_action_shown,
                support_action_taken
            )
            values (%s, %s, %s, %s, %s, %s, %s, 'active', %s, null)
            returning *
            """,
            (
                user_id,
                anchor_note_id,
                anchor_note_version,
                behavior_description_snapshot,
                behavior_label_snapshot,
                behavior_pattern_id,
                response_mode,
                support_action_shown,
            ),
        )
        flare_event = _FlareEventRow.from_row(cursor.fetchone())
        run = self._ensure_run_for_event(cursor=cursor, user_id=user_id, flare_event_id=flare_event.id)
        return HTTPStatus.CREATED, {
            "flare_event": flare_event.to_record().to_public_dict(),
            "run": None if run is None else run.to_public_dict(),
        }

    def _create_or_read_run_for_event(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        flare_event_id: str,
    ) -> tuple[int, dict[str, Any]]:
        self._get_owned_flare_event(cursor=cursor, user_id=user_id, flare_event_id=flare_event_id)
        run = self._ensure_run_for_event(cursor=cursor, user_id=user_id, flare_event_id=flare_event_id)
        if run is None:
            return HTTPStatus.OK, {"run": None, "reason": "flare_plan_not_configured"}
        return HTTPStatus.OK, {"run": run.to_public_dict()}

    def _begin_run(self, *, cursor: PgCursor, user_id: str, run_id: str) -> tuple[int, dict[str, Any]]:
        run = self._lock_owned_run(cursor=cursor, user_id=user_id, run_id=run_id)
        if run.status == "offered":
            cursor.execute(
                """
                update public.flare_plan_runs
                set status = 'in_progress',
                    started_at = coalesce(started_at, now())
                where id = %s
                """,
                (run_id,),
            )
        elif run.status == "declined":
            self._raise_conflict("FLARE_PLAN_RUN_ALREADY_DECLINED", "Flare Plan Run has already been declined.")
        elif run.status in ("completed", "ended_early"):
            self._raise_conflict("FLARE_PLAN_RUN_ALREADY_TERMINAL", "Flare Plan Run is already terminal.")
        elif run.status != "in_progress":
            self._raise_conflict("FLARE_PLAN_INVALID_RUN_TRANSITION", "Flare Plan Run could not be started.")
        updated = self._get_run_by_id(cursor=cursor, run_id=run_id)
        return HTTPStatus.OK, {"run": self._build_run_record(cursor=cursor, run=updated).to_public_dict()}

    def _decline_run(self, *, cursor: PgCursor, user_id: str, run_id: str) -> tuple[int, dict[str, Any]]:
        run = self._lock_owned_run(cursor=cursor, user_id=user_id, run_id=run_id)
        if run.status == "offered":
            cursor.execute(
                """
                update public.flare_plan_run_actions
                set outcome = 'not_reached'
                where run_id = %s
                  and outcome = 'pending'
                """,
                (run_id,),
            )
            cursor.execute(
                """
                update public.flare_plan_runs
                set status = 'declined',
                    declined_at = coalesce(declined_at, now())
                where id = %s
                """,
                (run_id,),
            )
        elif run.status == "in_progress":
            self._raise_conflict("FLARE_PLAN_RUN_ALREADY_STARTED", "Flare Plan Run has already started.")
        else:
            self._raise_conflict("FLARE_PLAN_RUN_ALREADY_TERMINAL", "Flare Plan Run is already terminal.")
        updated = self._get_run_by_id(cursor=cursor, run_id=run_id)
        return HTTPStatus.OK, {"run": self._build_run_record(cursor=cursor, run=updated).to_public_dict()}

    def _resolve_run_action(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        run_id: str,
        event_action_id: str,
        outcome: str,
    ) -> tuple[int, dict[str, Any]]:
        run = self._lock_owned_run(cursor=cursor, user_id=user_id, run_id=run_id)
        if run.status != "in_progress":
            self._raise_conflict("FLARE_PLAN_RUN_NOT_IN_PROGRESS", "Flare Plan Run is not in progress.")
        action = self._lock_run_action(cursor=cursor, run_id=run_id, event_action_id=event_action_id)
        if action is None:
            raise FlarePlanError(
                code="FLARE_PLAN_EVENT_ACTION_NOT_FOUND",
                message="Flare Plan action could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        current_action = self._get_current_run_action(cursor=cursor, run_id=run_id)
        if current_action is None:
            self._raise_conflict("FLARE_PLAN_RUN_ALREADY_TERMINAL", "Flare Plan Run is already terminal.")
        if action.id != current_action.id:
            if action.outcome != "pending":
                self._raise_conflict("FLARE_PLAN_ACTION_ALREADY_RESOLVED", "Flare Plan action was already resolved.")
            self._raise_conflict("FLARE_PLAN_ACTION_NOT_CURRENT", "Flare Plan action is not current.")
        cursor.execute(
            """
            update public.flare_plan_run_actions
            set outcome = %s,
                responded_at = now()
            where id = %s
            """,
            (outcome, event_action_id),
        )
        next_current = self._get_current_run_action(cursor=cursor, run_id=run_id)
        if next_current is None:
            cursor.execute(
                """
                update public.flare_plan_runs
                set status = 'completed',
                    completed_at = coalesce(completed_at, now())
                where id = %s
                """,
                (run_id,),
            )
        updated = self._get_run_by_id(cursor=cursor, run_id=run_id)
        return HTTPStatus.OK, {"run": self._build_run_record(cursor=cursor, run=updated).to_public_dict()}

    def _end_run_early(self, *, cursor: PgCursor, user_id: str, run_id: str) -> tuple[int, dict[str, Any]]:
        run = self._lock_owned_run(cursor=cursor, user_id=user_id, run_id=run_id)
        if run.status != "in_progress":
            self._raise_conflict("FLARE_PLAN_RUN_NOT_IN_PROGRESS", "Flare Plan Run is not in progress.")
        cursor.execute(
            """
            update public.flare_plan_run_actions
            set outcome = 'not_reached'
            where run_id = %s
              and outcome = 'pending'
            """,
            (run_id,),
        )
        cursor.execute(
            """
            update public.flare_plan_runs
            set status = 'ended_early',
                ended_at = coalesce(ended_at, now())
            where id = %s
            """,
            (run_id,),
        )
        updated = self._get_run_by_id(cursor=cursor, run_id=run_id)
        return HTTPStatus.OK, {"run": self._build_run_record(cursor=cursor, run=updated).to_public_dict()}

    def _run_idempotent_mutation(
        self,
        *,
        user_id: str,
        operation: str,
        target_resource: str,
        idempotency_key: str,
        request_fingerprint: str,
        callback: Callable[[PgCursor], tuple[int, dict[str, Any]]],
    ) -> IdempotentResponseRecord:
        with self._connect() as connection, connection.cursor(cursor_factory=extras.RealDictCursor) as cursor:
            existing = self._claim_or_load_idempotency_record(
                cursor=cursor,
                user_id=user_id,
                operation=operation,
                target_resource=target_resource,
                idempotency_key=idempotency_key,
                request_fingerprint=request_fingerprint,
            )
            if existing is not None:
                return existing
            status_code, body = callback(cursor)
            cursor.execute(
                """
                update public.flare_plan_idempotency_keys
                set response_status = %s,
                    response_body = %s,
                    completed_at = now()
                where user_id = %s
                  and operation = %s
                  and target_resource = %s
                  and idempotency_key = %s
                """,
                (
                    int(status_code),
                    extras.Json(body),
                    user_id,
                    operation,
                    target_resource,
                    idempotency_key,
                ),
            )
            return IdempotentResponseRecord(status_code=int(status_code), body=body)

    def _claim_or_load_idempotency_record(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        operation: str,
        target_resource: str,
        idempotency_key: str,
        request_fingerprint: str,
    ) -> IdempotentResponseRecord | None:
        cursor.execute(
            """
            insert into public.flare_plan_idempotency_keys (
                user_id,
                operation,
                target_resource,
                idempotency_key,
                request_fingerprint,
                response_body
            )
            values (%s, %s, %s, %s, %s, '{}'::jsonb)
            on conflict do nothing
            returning id
            """,
            (user_id, operation, target_resource, idempotency_key, request_fingerprint),
        )
        inserted = cursor.fetchone()
        if inserted is not None:
            return None
        cursor.execute(
            """
            select request_fingerprint, response_status, response_body, completed_at
            from public.flare_plan_idempotency_keys
            where user_id = %s
              and operation = %s
              and target_resource = %s
              and idempotency_key = %s
            limit 1
            """,
            (user_id, operation, target_resource, idempotency_key),
        )
        existing = cursor.fetchone()
        if existing is None:
            raise FlarePlanError(
                code="FLARE_PLAN_IDEMPOTENCY_KEY_REUSED",
                message="Idempotency key could not be claimed safely.",
                status_code=HTTPStatus.CONFLICT,
                details={},
            )
        if str(existing["request_fingerprint"]) != request_fingerprint:
            raise FlarePlanError(
                code="FLARE_PLAN_IDEMPOTENCY_KEY_REUSED",
                message="Idempotency key was already used with different input.",
                status_code=HTTPStatus.CONFLICT,
                details={},
            )
        if existing["response_status"] is None or existing["completed_at"] is None:
            raise FlarePlanError(
                code="FLARE_PLAN_IDEMPOTENCY_KEY_REUSED",
                message="Idempotency key is already in use.",
                status_code=HTTPStatus.CONFLICT,
                details={},
            )
        body = existing["response_body"]
        return IdempotentResponseRecord(
            status_code=int(existing["response_status"]),
            body=body if isinstance(body, dict) else {},
            replayed=True,
        )

    def _get_or_create_plan(self, *, cursor: PgCursor, user_id: str) -> _PlanRow:
        cursor.execute(
            """
            select id, user_id, updated_at
            from public.flare_plans
            where user_id = %s
              and status = 'active'
              and archived_at is null
            order by created_at desc
            limit 1
            """,
            (user_id,),
        )
        row = cursor.fetchone()
        if row is not None:
            return _PlanRow(
                id=str(row["id"]),
                user_id=str(row["user_id"]),
                updated_at=format_timestamp(row.get("updated_at")) or "",
            )
        cursor.execute("savepoint flare_plan_create_plan")
        try:
            cursor.execute(
                """
                insert into public.flare_plans (user_id, title, status)
                values (%s, 'Flare Plan', 'active')
                returning id, user_id, updated_at
                """,
                (user_id,),
            )
            created = cursor.fetchone()
        except psycopg2.Error:
            cursor.execute("rollback to savepoint flare_plan_create_plan")
            cursor.execute(
                """
                select id, user_id, updated_at
                from public.flare_plans
                where user_id = %s
                  and status = 'active'
                  and archived_at is null
                order by created_at desc
                limit 1
                """,
                (user_id,),
            )
            created = cursor.fetchone()
            if created is None:
                raise
        return _PlanRow(
            id=str(created["id"]),
            user_id=str(created["user_id"]),
            updated_at=format_timestamp(created.get("updated_at")) or "",
        )

    def _build_active_plan(self, *, cursor: PgCursor, plan: _PlanRow) -> ActiveFlarePlanRecord:
        actions = self._list_active_actions(cursor=cursor, plan_id=plan.id)
        updated_at = plan.updated_at
        for action in actions:
            if action.updated_at > updated_at:
                updated_at = action.updated_at
        records = [action.to_record() for action in actions]
        return ActiveFlarePlanRecord(
            id=plan.id,
            is_configured=len(records) > 0,
            active_action_count=len(records),
            maximum_active_actions=MAXIMUM_ACTIVE_FLARE_PLAN_ACTIONS,
            actions=records,
            updated_at=updated_at,
        )

    def _get_plan_by_id(self, *, cursor: PgCursor, plan_id: str, user_id: str) -> _PlanRow:
        cursor.execute(
            """
            select id, user_id, updated_at
            from public.flare_plans
            where id = %s
              and user_id = %s
              and status = 'active'
              and archived_at is null
            limit 1
            """,
            (plan_id, user_id),
        )
        row = cursor.fetchone()
        if row is None:
            raise FlarePlanError(
                code="FLARE_PLAN_NOT_FOUND",
                message="Flare Plan could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        return _PlanRow(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            updated_at=format_timestamp(row.get("updated_at")) or "",
        )

    def _get_owned_action(self, *, cursor: PgCursor, user_id: str, action_id: str) -> _ActionRow | None:
        cursor.execute(
            """
            select action.*
            from public.flare_plan_actions action
            join public.flare_plans plan on plan.id = action.plan_id
            where action.id = %s
              and plan.user_id = %s
              and plan.status = 'active'
              and plan.archived_at is null
            limit 1
            """,
            (action_id, user_id),
        )
        row = cursor.fetchone()
        return None if row is None else _ActionRow.from_row(row)

    def _list_active_actions(self, *, cursor: PgCursor, plan_id: str) -> list[_ActionRow]:
        cursor.execute(
            """
            select *
            from public.flare_plan_actions
            where plan_id = %s
              and status = 'active'
              and archived_at is null
            order by position asc, id asc
            """,
            (plan_id,),
        )
        return [_ActionRow.from_row(row) for row in cursor.fetchall()]

    def _list_owned_actions_by_ids(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        action_ids: list[str],
    ) -> list[_ActionRow]:
        if not action_ids:
            return []
        cursor.execute(
            """
            select action.*
            from public.flare_plan_actions action
            join public.flare_plans plan on plan.id = action.plan_id
            where plan.user_id = %s
              and action.id = any(%s::uuid[])
            """,
            (user_id, action_ids),
        )
        return [_ActionRow.from_row(row) for row in cursor.fetchall()]

    def _next_active_position(self, *, cursor: PgCursor, plan_id: str) -> int:
        cursor.execute(
            """
            select count(*) as active_count
            from public.flare_plan_actions
            where plan_id = %s
              and status = 'active'
              and archived_at is null
            """,
            (plan_id,),
        )
        return int(cursor.fetchone()["active_count"]) + 1

    def _assert_active_action_capacity(self, *, cursor: PgCursor, plan_id: str) -> None:
        cursor.execute(
            """
            select count(*) as active_count
            from public.flare_plan_actions
            where plan_id = %s
              and status = 'active'
              and archived_at is null
            """,
            (plan_id,),
        )
        if int(cursor.fetchone()["active_count"]) >= MAXIMUM_ACTIVE_FLARE_PLAN_ACTIONS:
            raise FlarePlanError(
                code="FLARE_PLAN_ACTIVE_ACTION_LIMIT_REACHED",
                message="Flare Plan already has the maximum number of active actions.",
                status_code=HTTPStatus.CONFLICT,
                details={"maximum_active_actions": MAXIMUM_ACTIVE_FLARE_PLAN_ACTIONS},
            )

    def _resequence_active_actions(self, *, cursor: PgCursor, plan_id: str) -> None:
        for position, action in enumerate(self._list_active_actions(cursor=cursor, plan_id=plan_id), start=1):
            cursor.execute(
                """
                update public.flare_plan_actions
                set position = %s
                where id = %s
                """,
                (position, action.id),
            )

    def _lock_plan(self, *, cursor: PgCursor, plan_id: str) -> None:
        cursor.execute(
            """
            select id
            from public.flare_plans
            where id = %s
            for update
            """,
            (plan_id,),
        )

    def _get_owned_flare_event(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        flare_event_id: str,
    ) -> _FlareEventRow:
        cursor.execute(
            """
            select *
            from public.flare_events
            where id = %s
              and user_id = %s
            limit 1
            """,
            (flare_event_id, user_id),
        )
        row = cursor.fetchone()
        if row is None:
            raise FlarePlanError(
                code="FLARE_EVENT_NOT_FOUND",
                message="Flare Event could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        return _FlareEventRow.from_row(row)

    def _get_support_delivery(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        flare_event_id: str,
    ) -> FlareSupportDeliveryRecord | None:
        cursor.execute(
            """
            select
                status,
                attempted_at,
                delivered_at,
                error_code,
                error_message_safe,
                destination_name
            from public.support_channel_delivery_attempts
            where user_id = %s
              and flare_event_id = %s
            order by attempted_at desc, created_at desc
            limit 1
            """,
            (user_id, flare_event_id),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        return FlareSupportDeliveryRecord(
            status=str(row["status"]),
            attempted_at=format_timestamp(row.get("attempted_at")),
            delivered_at=format_timestamp(row.get("delivered_at")),
            error_code=_optional_str(row.get("error_code")),
            error_message_safe=_optional_str(row.get("error_message_safe")),
            destination_display_name=_optional_str(row.get("destination_name")),
        )

    def _get_run_for_event(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        flare_event_id: str,
    ) -> _RunRow | None:
        cursor.execute(
            """
            select run.*
            from public.flare_plan_runs run
            join public.flare_events event on event.id = run.flare_event_id
            where run.flare_event_id = %s
              and event.user_id = %s
            limit 1
            """,
            (flare_event_id, user_id),
        )
        row = cursor.fetchone()
        return None if row is None else _RunRow.from_row(row)

    def _get_run_by_id(self, *, cursor: PgCursor, run_id: str) -> _RunRow:
        cursor.execute(
            """
            select *
            from public.flare_plan_runs
            where id = %s
            limit 1
            """,
            (run_id,),
        )
        row = cursor.fetchone()
        if row is None:
            raise FlarePlanError(
                code="FLARE_PLAN_RUN_NOT_FOUND",
                message="Flare Plan Run could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        return _RunRow.from_row(row)

    def _lock_owned_run(self, *, cursor: PgCursor, user_id: str, run_id: str) -> _RunRow:
        cursor.execute(
            """
            select run.*
            from public.flare_plan_runs run
            join public.flare_events event on event.id = run.flare_event_id
            where run.id = %s
              and event.user_id = %s
            for update
            """,
            (run_id, user_id),
        )
        row = cursor.fetchone()
        if row is None:
            raise FlarePlanError(
                code="FLARE_PLAN_RUN_NOT_FOUND",
                message="Flare Plan Run could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        return _RunRow.from_row(row)

    def _lock_run_action(
        self,
        *,
        cursor: PgCursor,
        run_id: str,
        event_action_id: str,
    ) -> _RunActionRow | None:
        cursor.execute(
            """
            select *
            from public.flare_plan_run_actions
            where id = %s
              and run_id = %s
            for update
            """,
            (event_action_id, run_id),
        )
        row = cursor.fetchone()
        return None if row is None else _RunActionRow.from_row(row)

    def _list_run_actions(self, *, cursor: PgCursor, run_id: str) -> list[_RunActionRow]:
        cursor.execute(
            """
            select *
            from public.flare_plan_run_actions
            where run_id = %s
            order by position asc, id asc
            """,
            (run_id,),
        )
        return [_RunActionRow.from_row(row) for row in cursor.fetchall()]

    def _get_current_run_action(self, *, cursor: PgCursor, run_id: str) -> _RunActionRow | None:
        cursor.execute(
            """
            select *
            from public.flare_plan_run_actions
            where run_id = %s
              and outcome = 'pending'
            order by position asc, id asc
            limit 1
            """,
            (run_id,),
        )
        row = cursor.fetchone()
        return None if row is None else _RunActionRow.from_row(row)

    def _build_run_record(self, *, cursor: PgCursor, run: _RunRow) -> FlarePlanRunRecord:
        actions = self._list_run_actions(cursor=cursor, run_id=run.id)
        done_count = sum(1 for action in actions if action.outcome == "done")
        skipped_count = sum(1 for action in actions if action.outcome == "skipped")
        not_reached_count = sum(1 for action in actions if action.outcome == "not_reached")
        pending_count = sum(1 for action in actions if action.outcome == "pending")
        current_action = next((action for action in actions if action.outcome == "pending"), None)
        return FlarePlanRunRecord(
            id=run.id,
            flare_event_id=run.flare_event_id,
            source_plan_id=run.source_plan_id,
            status=run.status,
            current_action=None if current_action is None else current_action.to_record(),
            progress=FlarePlanRunProgressRecord(
                current_position=None if current_action is None else current_action.position,
                total_count=len(actions),
                done_count=done_count,
                skipped_count=skipped_count,
                not_reached_count=not_reached_count,
                pending_count=pending_count,
            ),
            actions=[action.to_record() for action in actions],
            offered_at=run.offered_at,
            started_at=run.started_at,
            declined_at=run.declined_at,
            completed_at=run.completed_at,
            ended_at=run.ended_at,
            updated_at=run.updated_at,
        )

    def _ensure_run_for_event(
        self,
        *,
        cursor: PgCursor,
        user_id: str,
        flare_event_id: str,
    ) -> FlarePlanRunRecord | None:
        existing = self._get_run_for_event(cursor=cursor, user_id=user_id, flare_event_id=flare_event_id)
        if existing is not None:
            return self._build_run_record(cursor=cursor, run=existing)
        plan = self._get_or_create_plan(cursor=cursor, user_id=user_id)
        self._lock_plan(cursor=cursor, plan_id=plan.id)
        actions = self._list_active_actions(cursor=cursor, plan_id=plan.id)
        if len(actions) == 0:
            return None
        cursor.execute(
            """
            insert into public.flare_plan_runs (
                flare_event_id,
                source_plan_id,
                status
            )
            values (%s, %s, 'offered')
            returning *
            """,
            (flare_event_id, plan.id),
        )
        run = _RunRow.from_row(cursor.fetchone())
        for action in actions:
            cursor.execute(
                """
                insert into public.flare_plan_run_actions (
                    run_id,
                    source_action_id,
                    source_template_key,
                    title,
                    description,
                    position,
                    outcome
                )
                values (%s, %s, %s, %s, %s, %s, 'pending')
                """,
                (
                    run.id,
                    action.id,
                    action.source_template_key,
                    action.title,
                    action.description,
                    action.position,
                ),
            )
        return self._build_run_record(cursor=cursor, run=run)

    def _raise_conflict(self, code: str, message: str) -> None:
        raise FlarePlanError(
            code=code,
            message=message,
            status_code=HTTPStatus.CONFLICT,
            details={},
        )

    def _connect(self) -> PgConnection:
        return psycopg2.connect(self._config.dsn)


def build_request_fingerprint(payload: dict[str, Any]) -> str:
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _duplicate_items(values: list[str]) -> list[str]:
    seen: set[str] = set()
    duplicates: list[str] = []
    for value in values:
        if value in seen and value not in duplicates:
            duplicates.append(value)
        seen.add(value)
    return duplicates


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)
