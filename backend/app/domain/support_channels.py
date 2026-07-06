from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any

SUPPORT_CHANNEL_PROVIDER_GROUPME = "groupme"
SUPPORT_CHANNEL_SEND_KIND_TEST = "test"
SUPPORT_CHANNEL_SEND_KIND_REAL = "real"
SUPPORT_CHANNEL_STATUS_DISABLED = "disabled"
SUPPORT_CHANNEL_STATUS_CONNECTED = "connected"
SUPPORT_CHANNEL_STATUS_RECONNECT_REQUIRED = "reconnect_required"
SUPPORT_CHANNEL_STATUS_DISCONNECTED = "disconnected"
SUPPORT_CHANNEL_DELIVERY_STATUS_SENT = "sent"
SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED = "failed"
SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED = "blocked"
SUPPORT_CHANNEL_PROVIDER_CONFIG_STATUS_AUTHORIZED = "authorized"
SUPPORT_CHANNEL_PROVIDER_CONFIG_STATUS_PROVISIONED = "provisioned"

GROUPME_TEST_MESSAGE = (
    "TEST FLARE: Luke is testing Flare support notifications. No action is needed."
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True)
class SupportChannelRecord:
    id: str
    user_id: str
    provider: str
    status: str
    enabled: bool
    external_group_id: str | None
    external_group_name: str | None
    provider_config_ref: str | None
    default_message: str
    last_delivery_status: str | None = None
    last_delivery_at: str | None = None
    last_error_code: str | None = None
    last_error_message_safe: str | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "SupportChannelRecord":
        return cls(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            provider=str(row["provider"]),
            status=str(row["status"]),
            enabled=bool(row["enabled"]),
            external_group_id=_optional_str(row.get("external_group_id")),
            external_group_name=_optional_str(row.get("external_group_name")),
            provider_config_ref=_optional_str(row.get("provider_config_ref")),
            default_message=str(row["default_message"]),
            last_delivery_status=_optional_str(row.get("last_delivery_status")),
            last_delivery_at=_optional_str(row.get("last_delivery_at")),
            last_error_code=_optional_str(row.get("last_error_code")),
            last_error_message_safe=_optional_str(row.get("last_error_message_safe")),
        )

    def is_configured(self) -> bool:
        return bool(
            self.provider_config_ref
            and self.external_group_id
            and self.default_message.strip()
        )

    def destination_display_name(self) -> str | None:
        return self.external_group_name or self.external_group_id

    def to_safe_public_dict(self) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "configured": self.is_configured(),
            "enabled": self.enabled,
            "status": self.status,
            "destination_display_name": self.destination_display_name(),
            "message_preview": self.default_message,
            "last_delivery_status": self.last_delivery_status,
            "last_delivery_at": self.last_delivery_at,
        }

    def build_test_send_request(self) -> "SupportChannelSendRequest":
        if not self.external_group_id:
            raise ValueError("Support channel must have an external_group_id for test sends.")
        return SupportChannelSendRequest(
            support_channel_id=self.id,
            user_id=self.user_id,
            provider=self.provider,
            destination_id=self.external_group_id,
            destination_name=self.external_group_name,
            message=GROUPME_TEST_MESSAGE,
            send_kind=SUPPORT_CHANNEL_SEND_KIND_TEST,
        )


@dataclass(frozen=True)
class GroupMeRuntimeConfig:
    test_group_id: str
    test_group_name: str
    test_bot_id: str


@dataclass(frozen=True)
class GroupMeUserProfile:
    user_id: str
    name: str | None = None


@dataclass(frozen=True)
class SupportChannelDestination:
    id: str
    name: str
    description: str | None = None
    image_url: str | None = None
    group_type: str | None = None

    def to_safe_public_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "image_url": self.image_url,
            "group_type": self.group_type,
        }


@dataclass(frozen=True)
class SupportChannelProviderConfigRecord:
    id: str
    user_id: str
    provider: str
    status: str
    access_token: str
    provider_user_id: str | None = None
    provider_user_name: str | None = None
    bot_id: str | None = None
    external_group_id: str | None = None
    external_group_name: str | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "SupportChannelProviderConfigRecord":
        return cls(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            provider=str(row["provider"]),
            status=str(row["status"]),
            access_token=str(row["access_token"]),
            provider_user_id=_optional_str(row.get("provider_user_id")),
            provider_user_name=_optional_str(row.get("provider_user_name")),
            bot_id=_optional_str(row.get("bot_id")),
            external_group_id=_optional_str(row.get("external_group_id")),
            external_group_name=_optional_str(row.get("external_group_name")),
        )


@dataclass(frozen=True)
class GroupMeConnectSession:
    connect_session_id: str
    provider: str
    status: str

    def to_safe_public_dict(self) -> dict[str, Any]:
        return {
            "connect_session_id": self.connect_session_id,
            "provider": self.provider,
            "status": self.status,
        }


@dataclass(frozen=True)
class SupportChannelSendRequest:
    support_channel_id: str
    user_id: str
    provider: str
    destination_id: str
    destination_name: str | None
    message: str
    send_kind: str
    flare_event_id: str | None = None


@dataclass(frozen=True)
class SupportChannelSendResult:
    ok: bool
    provider: str
    send_kind: str
    status: str
    attempted_at: str
    delivered_at: str | None
    support_channel_id: str | None
    user_id: str
    destination_id: str | None
    destination_name: str | None
    message_snapshot: str
    provider_message_id: str | None = None
    error_code: str | None = None
    error_message_safe: str | None = None
    raw_provider_status_ref: str | None = None
    blocked_reason: str | None = None

    def to_public_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_safe_public_dict(self) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "send_kind": self.send_kind,
            "status": self.status,
            "attempted_at": self.attempted_at,
            "delivered_at": self.delivered_at,
            "destination_display_name": self.destination_name,
            "message_preview": self.message_snapshot,
            "error_code": self.error_code,
            "error_message_safe": self.error_message_safe,
        }


@dataclass(frozen=True)
class DeliveryAttemptRecord:
    user_id: str
    support_channel_id: str | None
    provider: str
    send_kind: str
    destination_id: str | None
    destination_name: str | None
    message_snapshot: str
    status: str
    attempted_at: str
    delivered_at: str | None
    provider_message_id: str | None
    error_code: str | None
    error_message_safe: str | None
    raw_provider_status_ref: str | None
    flare_event_id: str | None = None

    @classmethod
    def from_result(cls, result: SupportChannelSendResult) -> "DeliveryAttemptRecord":
        return cls(
            user_id=result.user_id,
            support_channel_id=result.support_channel_id,
            provider=result.provider,
            send_kind=result.send_kind,
            destination_id=result.destination_id,
            destination_name=result.destination_name,
            message_snapshot=result.message_snapshot,
            status=result.status,
            attempted_at=result.attempted_at,
            delivered_at=result.delivered_at,
            provider_message_id=result.provider_message_id,
            error_code=result.error_code,
            error_message_safe=result.error_message_safe,
            raw_provider_status_ref=result.raw_provider_status_ref,
        )


def build_blocked_result(
    *,
    provider: str,
    user_id: str,
    support_channel_id: str | None,
    destination_id: str | None,
    destination_name: str | None,
    message: str,
    error_code: str,
    error_message_safe: str,
    blocked_reason: str,
    attempted_at: datetime | None = None,
) -> SupportChannelSendResult:
    attempted = (attempted_at or utc_now()).isoformat()
    return SupportChannelSendResult(
        ok=False,
        provider=provider,
        send_kind=SUPPORT_CHANNEL_SEND_KIND_TEST,
        status=SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED,
        attempted_at=attempted,
        delivered_at=None,
        support_channel_id=support_channel_id,
        user_id=user_id,
        destination_id=destination_id,
        destination_name=destination_name,
        message_snapshot=message,
        provider_message_id=None,
        error_code=error_code,
        error_message_safe=error_message_safe,
        raw_provider_status_ref=None,
        blocked_reason=blocked_reason,
    )


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)
