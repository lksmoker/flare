from __future__ import annotations

from dataclasses import dataclass
from http import HTTPStatus
from typing import Any

from backend.app.db.flare_plan_repository import FlarePlanRepository, build_request_fingerprint
from backend.app.domain.flare_plan import (
    ActiveFlarePlanRecord,
    FlarePlanError,
    IdempotentResponseRecord,
    MAX_FLARE_PLAN_ACTION_DESCRIPTION_LENGTH,
    MAX_FLARE_PLAN_ACTION_TITLE_LENGTH,
    StarterTemplateRecord,
)


@dataclass(frozen=True)
class CreateCustomFlarePlanActionCommand:
    user_id: str
    title: str | None
    description: str | None
    idempotency_key: str


@dataclass(frozen=True)
class CreateFlarePlanActionFromTemplateCommand:
    user_id: str
    template_key: str | None
    idempotency_key: str


@dataclass(frozen=True)
class UpdateFlarePlanActionCommand:
    user_id: str
    action_id: str
    title: str | None = None
    title_provided: bool = False
    description: str | None = None
    description_provided: bool = False
    idempotency_key: str = ""


@dataclass(frozen=True)
class ArchiveFlarePlanActionCommand:
    user_id: str
    action_id: str
    idempotency_key: str


@dataclass(frozen=True)
class ReorderFlarePlanActionsCommand:
    user_id: str
    action_ids: list[str]
    idempotency_key: str


class FlarePlanService:
    def __init__(self, *, repository: FlarePlanRepository) -> None:
        self._repository = repository

    def list_starter_templates(self, *, user_id: str) -> list[StarterTemplateRecord]:
        return self._repository.list_active_templates(user_id=user_id)

    def read_active_plan(self, *, user_id: str) -> ActiveFlarePlanRecord:
        return self._repository.read_active_plan(user_id=user_id)

    def create_action_from_template(
        self,
        command: CreateFlarePlanActionFromTemplateCommand,
    ) -> IdempotentResponseRecord:
        template_key = (command.template_key or "").strip()
        if not template_key:
            raise FlarePlanError(
                code="FLARE_PLAN_TEMPLATE_NOT_FOUND",
                message="Starter template could not be found.",
                status_code=HTTPStatus.NOT_FOUND,
                details={},
            )
        payload = {"template_key": template_key}
        return self._repository.create_action_from_template(
            user_id=command.user_id,
            template_key=template_key,
            idempotency_key=self._require_idempotency_key(command.idempotency_key),
            request_fingerprint=build_request_fingerprint(payload),
        )

    def create_custom_action(self, command: CreateCustomFlarePlanActionCommand) -> IdempotentResponseRecord:
        title = _normalize_title(command.title)
        description = _normalize_description(command.description)
        payload = {"title": title, "description": description}
        return self._repository.create_custom_action(
            user_id=command.user_id,
            title=title,
            description=description,
            idempotency_key=self._require_idempotency_key(command.idempotency_key),
            request_fingerprint=build_request_fingerprint(payload),
        )

    def update_action(self, command: UpdateFlarePlanActionCommand) -> IdempotentResponseRecord:
        title = _normalize_title(command.title) if command.title_provided else None
        description = _normalize_description(command.description) if command.description_provided else None
        payload = {}
        if command.title_provided:
            payload["title"] = title
        if command.description_provided:
            payload["description"] = description
        return self._repository.update_action(
            user_id=command.user_id,
            action_id=command.action_id,
            title_provided=command.title_provided,
            title=title,
            description_provided=command.description_provided,
            description=description,
            idempotency_key=self._require_idempotency_key(command.idempotency_key),
            request_fingerprint=build_request_fingerprint(payload),
        )

    def archive_action(self, command: ArchiveFlarePlanActionCommand) -> IdempotentResponseRecord:
        return self._repository.archive_action(
            user_id=command.user_id,
            action_id=command.action_id,
            idempotency_key=self._require_idempotency_key(command.idempotency_key),
            request_fingerprint=build_request_fingerprint({}),
        )

    def reorder_actions(self, command: ReorderFlarePlanActionsCommand) -> IdempotentResponseRecord:
        action_ids = [str(action_id) for action_id in command.action_ids]
        return self._repository.reorder_actions(
            user_id=command.user_id,
            action_ids=action_ids,
            idempotency_key=self._require_idempotency_key(command.idempotency_key),
            request_fingerprint=build_request_fingerprint({"action_ids": action_ids}),
        )

    def _require_idempotency_key(self, idempotency_key: str | None) -> str:
        cleaned = (idempotency_key or "").strip()
        if cleaned:
            return cleaned
        raise FlarePlanError(
            code="FLARE_PLAN_IDEMPOTENCY_KEY_REQUIRED",
            message="Idempotency-Key header is required.",
            status_code=HTTPStatus.CONFLICT,
            details={},
        )


def _normalize_title(value: str | None) -> str:
    cleaned = (value or "").strip()
    if not cleaned:
        raise FlarePlanError(
            code="FLARE_PLAN_ACTION_TITLE_REQUIRED",
            message="Flare Plan action title is required.",
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            details={},
        )
    if len(cleaned) > MAX_FLARE_PLAN_ACTION_TITLE_LENGTH:
        raise FlarePlanError(
            code="FLARE_PLAN_ACTION_TITLE_TOO_LONG",
            message="Flare Plan action title exceeds the maximum length.",
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            details={"maximum_length": MAX_FLARE_PLAN_ACTION_TITLE_LENGTH},
        )
    return cleaned


def _normalize_description(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if len(cleaned) > MAX_FLARE_PLAN_ACTION_DESCRIPTION_LENGTH:
        raise FlarePlanError(
            code="FLARE_PLAN_ACTION_DESCRIPTION_TOO_LONG",
            message="Flare Plan action description exceeds the maximum length.",
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            details={"maximum_length": MAX_FLARE_PLAN_ACTION_DESCRIPTION_LENGTH},
        )
    return cleaned or None
