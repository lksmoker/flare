from __future__ import annotations

import json
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any, Protocol
from urllib import parse

from backend.app.domain.support_channels import (
    SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED,
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    SUPPORT_CHANNEL_SEND_KIND_REAL,
    build_blocked_result,
)
from backend.app.services.support_channel_management import (
    ConfigureSupportChannelCommand,
    ReconnectSupportChannelCommand,
    SupportChannelManagementError,
    SupportChannelManager,
)
from backend.app.services.support_channel_sender import (
    SendSupportChannelRealMessageCommand,
    SendSupportChannelTestMessageCommand,
    SupportChannelSender,
)


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: str


class AuthenticatorLike(Protocol):
    def authenticate(self, headers: dict[str, str]) -> AuthenticatedUser | None:
        ...


@dataclass(frozen=True)
class ApiResponse:
    status_code: int
    body: dict[str, Any]

    def json_bytes(self) -> bytes:
        return json.dumps(self.body, sort_keys=True).encode("utf-8")


class SupportChannelsApi:
    def __init__(
        self,
        *,
        authenticator: AuthenticatorLike,
        manager: SupportChannelManager,
        sender: SupportChannelSender,
    ) -> None:
        self._authenticator = authenticator
        self._manager = manager
        self._sender = sender

    def handle_request(
        self,
        *,
        method: str,
        path: str,
        headers: dict[str, str] | None = None,
        body: bytes | None = None,
    ) -> ApiResponse:
        normalized_headers = _normalize_headers(headers or {})
        user = self._authenticator.authenticate(normalized_headers)
        if user is None:
            return _json_response(
                HTTPStatus.UNAUTHORIZED,
                {"error": {"code": "unauthorized", "message": "Authentication is required."}},
            )
        parsed = parse.urlsplit(path)
        route_path = parsed.path
        query = {key: values[-1] for key, values in parse.parse_qs(parsed.query).items()}
        try:
            if method == "GET" and route_path == "/api/support-channel":
                channel = self._manager.get_current_channel(user_id=user.user_id)
                return _json_response(
                    HTTPStatus.OK,
                    {"channel": channel.to_safe_public_dict() if channel is not None else None},
                )
            if method == "POST" and route_path == "/api/support-channel/groupme/connect/start":
                return _json_response(HTTPStatus.OK, self._manager.start_groupme_connect())
            if method == "GET" and route_path == "/api/support-channel/groupme/connect/callback":
                session = self._manager.complete_groupme_connect(
                    user_id=user.user_id,
                    access_token=str(query.get("access_token") or ""),
                )
                return _json_response(HTTPStatus.OK, {"connection": session.to_safe_public_dict()})
            if method == "GET" and route_path == "/api/support-channel/groupme/destinations":
                destinations = self._manager.list_groupme_destinations(
                    user_id=user.user_id,
                    connect_session_id=str(query.get("connect_session_id") or ""),
                )
                return _json_response(
                    HTTPStatus.OK,
                    {"destinations": [item.to_safe_public_dict() for item in destinations]},
                )
            if method == "POST" and route_path == "/api/support-channel/configure":
                payload = _parse_json_body(body)
                channel = self._manager.configure_groupme(
                    ConfigureSupportChannelCommand(
                        user_id=user.user_id,
                        connect_session_id=str(payload.get("connect_session_id") or ""),
                        external_group_id=str(payload.get("external_group_id") or ""),
                        default_message=str(payload.get("default_message") or ""),
                        enabled=bool(payload.get("enabled", False)),
                    )
                )
                return _json_response(HTTPStatus.OK, {"channel": channel.to_safe_public_dict()})
            if method == "POST" and route_path == "/api/support-channel/reconnect":
                payload = _parse_json_body(body)
                channel = self._manager.reconnect_groupme(
                    ReconnectSupportChannelCommand(
                        user_id=user.user_id,
                        connect_session_id=str(payload.get("connect_session_id") or ""),
                        external_group_id=_optional_str(payload.get("external_group_id")),
                        default_message=_optional_str(payload.get("default_message")),
                        enabled=bool(payload.get("enabled", True)),
                    )
                )
                return _json_response(HTTPStatus.OK, {"channel": channel.to_safe_public_dict()})
            if method == "POST" and route_path == "/api/support-channel/disable":
                channel = self._manager.disable_current_channel(user_id=user.user_id)
                if channel is None:
                    return _json_response(
                        HTTPStatus.NOT_FOUND,
                        {
                            "error": {
                                "code": "support_channel_not_found",
                                "message": "Support channel could not be found for this user.",
                            }
                        },
                    )
                return _json_response(HTTPStatus.OK, {"channel": channel.to_safe_public_dict()})
            if method == "POST" and route_path == "/api/support-channel/test":
                channel = self._manager.require_current_channel(user_id=user.user_id)
                result = self._sender.send_test_message(
                    SendSupportChannelTestMessageCommand(
                        support_channel_id=channel.id,
                        user_id=user.user_id,
                    )
                )
                status = (
                    HTTPStatus.OK
                    if result.ok
                    else HTTPStatus.CONFLICT
                    if result.status == "blocked"
                    else HTTPStatus.BAD_GATEWAY
                )
                return _json_response(status, {"result": result.to_safe_public_dict()})
            if method == "POST" and route_path == "/api/support-channel/send-flare":
                payload = _parse_json_body(body)
                channel = self._manager.get_current_channel(user_id=user.user_id)
                if channel is None:
                    result = build_blocked_result(
                        provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
                        user_id=user.user_id,
                        support_channel_id=None,
                        destination_id=None,
                        destination_name=None,
                        message="",
                        error_code="support_channel_not_configured",
                        error_message_safe="No support group is configured for this account.",
                        blocked_reason="missing_channel",
                        send_kind=SUPPORT_CHANNEL_SEND_KIND_REAL,
                        flare_event_id=_optional_str(payload.get("flare_event_id")),
                    )
                    return _json_response(HTTPStatus.CONFLICT, {"result": result.to_safe_public_dict()})
                result = self._sender.send_real_message(
                    SendSupportChannelRealMessageCommand(
                        support_channel_id=channel.id,
                        user_id=user.user_id,
                        flare_event_id=_optional_str(payload.get("flare_event_id")),
                    )
                )
                status = (
                    HTTPStatus.OK
                    if result.ok
                    else HTTPStatus.CONFLICT
                    if result.status == SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED
                    else HTTPStatus.BAD_GATEWAY
                )
                return _json_response(status, {"result": result.to_safe_public_dict()})
        except ValueError:
            return _json_response(
                HTTPStatus.BAD_REQUEST,
                {"error": {"code": "invalid_json", "message": "Request body must be valid JSON."}},
            )
        except SupportChannelManagementError as exc:
            return _json_response(
                exc.status_code,
                {"error": {"code": exc.code, "message": exc.message}},
            )

        return _json_response(
            HTTPStatus.NOT_FOUND,
            {"error": {"code": "not_found", "message": "Route not found."}},
        )


def _json_response(status: HTTPStatus | int, body: dict[str, Any]) -> ApiResponse:
    status_code = status.value if isinstance(status, HTTPStatus) else int(status)
    return ApiResponse(status_code=status_code, body=body)


def _normalize_headers(headers: dict[str, str]) -> dict[str, str]:
    return {str(key).lower(): value for key, value in headers.items()}


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)


def _parse_json_body(body: bytes | None) -> dict[str, Any]:
    if body is None:
        return {}
    decoded = json.loads(body.decode("utf-8"))
    if not isinstance(decoded, dict):
        raise ValueError("JSON body must decode to an object.")
    return decoded
