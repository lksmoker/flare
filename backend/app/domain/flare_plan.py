from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from http import HTTPStatus
from typing import Any

MAXIMUM_ACTIVE_FLARE_PLAN_ACTIONS = 10
MAX_FLARE_PLAN_ACTION_TITLE_LENGTH = 120
MAX_FLARE_PLAN_ACTION_DESCRIPTION_LENGTH = 300

_TEMPLATE_CATEGORY_ORDER = {
    "change_the_situation": 1,
    "reset_your_body": 2,
    "interrupt_the_pattern": 3,
    "reach_toward_support": 4,
}


def format_timestamp(value: datetime | str | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    normalized = value.astimezone(timezone.utc).replace(tzinfo=timezone.utc)
    return normalized.isoformat().replace("+00:00", "Z")


def starter_template_sort_key(template: "StarterTemplateRecord") -> tuple[int, str, int, str]:
    return (
        _TEMPLATE_CATEGORY_ORDER.get(template.category, 999),
        template.category,
        template.display_position,
        template.template_key,
    )


@dataclass(frozen=True)
class FlarePlanError(RuntimeError):
    code: str
    message: str
    status_code: int
    details: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class StarterTemplateRecord:
    template_key: str
    title: str
    description: str | None
    category: str
    category_label: str
    display_position: int
    is_selected: bool

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "template_key": self.template_key,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "category_label": self.category_label,
            "display_position": self.display_position,
            "is_selected": self.is_selected,
        }


@dataclass(frozen=True)
class FlarePlanActionRecord:
    id: str
    source_template_key: str | None
    title: str
    description: str | None
    position: int
    is_active: bool
    created_at: str
    updated_at: str

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "FlarePlanActionRecord":
        return cls(
            id=str(row["id"]),
            source_template_key=_optional_str(row.get("source_template_key")),
            title=str(row["title"]),
            description=_optional_str(row.get("description")),
            position=int(row["position"]),
            is_active=str(row.get("status") or "active") == "active" and row.get("archived_at") is None,
            created_at=format_timestamp(row.get("created_at")) or "",
            updated_at=format_timestamp(row.get("updated_at")) or "",
        )

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "source_template_key": self.source_template_key,
            "title": self.title,
            "description": self.description,
            "position": self.position,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


@dataclass(frozen=True)
class ActiveFlarePlanRecord:
    id: str
    is_configured: bool
    active_action_count: int
    maximum_active_actions: int
    actions: list[FlarePlanActionRecord]
    updated_at: str

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "is_configured": self.is_configured,
            "active_action_count": self.active_action_count,
            "maximum_active_actions": self.maximum_active_actions,
            "actions": [action.to_public_dict() for action in self.actions],
            "updated_at": self.updated_at,
        }


@dataclass(frozen=True)
class FlarePlanRunActionRecord:
    id: str
    source_action_id: str | None
    source_template_key: str | None
    title: str
    description: str | None
    position: int
    outcome: str
    responded_at: str | None

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "source_action_id": self.source_action_id,
            "source_template_key": self.source_template_key,
            "title": self.title,
            "description": self.description,
            "position": self.position,
            "outcome": self.outcome,
            "responded_at": self.responded_at,
        }


@dataclass(frozen=True)
class FlarePlanRunProgressRecord:
    current_position: int | None
    total_count: int
    done_count: int
    skipped_count: int
    not_reached_count: int
    pending_count: int

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "current_position": self.current_position,
            "total_count": self.total_count,
            "done_count": self.done_count,
            "skipped_count": self.skipped_count,
            "not_reached_count": self.not_reached_count,
            "pending_count": self.pending_count,
        }


@dataclass(frozen=True)
class FlarePlanRunRecord:
    id: str
    flare_event_id: str
    source_plan_id: str | None
    status: str
    current_action: FlarePlanRunActionRecord | None
    progress: FlarePlanRunProgressRecord
    actions: list[FlarePlanRunActionRecord]
    offered_at: str
    started_at: str | None
    declined_at: str | None
    completed_at: str | None
    ended_at: str | None
    updated_at: str

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "flare_event_id": self.flare_event_id,
            "source_plan_id": self.source_plan_id,
            "status": self.status,
            "current_action": None if self.current_action is None else self.current_action.to_public_dict(),
            "progress": self.progress.to_public_dict(),
            "actions": [action.to_public_dict() for action in self.actions],
            "offered_at": self.offered_at,
            "started_at": self.started_at,
            "declined_at": self.declined_at,
            "completed_at": self.completed_at,
            "ended_at": self.ended_at,
            "updated_at": self.updated_at,
        }


@dataclass(frozen=True)
class FlareSupportDeliveryRecord:
    status: str
    attempted_at: str | None
    delivered_at: str | None
    error_code: str | None
    error_message_safe: str | None
    destination_display_name: str | None

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "attempted_at": self.attempted_at,
            "delivered_at": self.delivered_at,
            "error_code": self.error_code,
            "error_message_safe": self.error_message_safe,
            "destination_display_name": self.destination_display_name,
        }


@dataclass(frozen=True)
class FlareEventRecord:
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

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "status": self.status,
            "response_mode": self.response_mode,
            "behavior_label_snapshot": self.behavior_label_snapshot,
            "behavior_description_snapshot": self.behavior_description_snapshot,
            "behavior_pattern_id": self.behavior_pattern_id,
            "anchor_note_id": self.anchor_note_id,
            "anchor_note_version": self.anchor_note_version,
            "support_action_shown": self.support_action_shown,
            "support_action_taken": self.support_action_taken,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "closed_at": self.closed_at,
            "archived_at": self.archived_at,
        }


@dataclass(frozen=True)
class FlareResponseRecord:
    flare_event: FlareEventRecord
    support_delivery: FlareSupportDeliveryRecord | None
    run: FlarePlanRunRecord | None

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "flare_event": self.flare_event.to_public_dict(),
            "support_delivery": None if self.support_delivery is None else self.support_delivery.to_public_dict(),
            "run": None if self.run is None else self.run.to_public_dict(),
        }


@dataclass(frozen=True)
class IdempotentResponseRecord:
    status_code: int
    body: dict[str, Any]
    replayed: bool = False


def build_error_response(error: FlarePlanError) -> dict[str, Any]:
    return {
        "error": {
            "code": error.code,
            "message": error.message,
            "details": error.details,
        }
    }


def raise_not_found(*, code: str, message: str) -> None:
    raise FlarePlanError(
        code=code,
        message=message,
        status_code=HTTPStatus.NOT_FOUND,
        details={},
    )


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value)
    return text
