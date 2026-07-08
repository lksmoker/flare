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
    FlarePlanActionRecord,
    FlarePlanError,
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
              and action.id = any(%s)
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
