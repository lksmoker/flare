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
