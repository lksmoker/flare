from __future__ import annotations

import json
from http import HTTPStatus
from typing import Any
from urllib import parse

from backend.app.api.support_channels_api import ApiResponse, AuthenticatedUser, AuthenticatorLike
from backend.app.domain.flare_plan import FlarePlanError, build_error_response
from backend.app.services.flare_plan_service import (
    ArchiveFlarePlanActionCommand,
    CreateCustomFlarePlanActionCommand,
    CreateFlarePlanActionFromTemplateCommand,
    FlarePlanService,
    ReorderFlarePlanActionsCommand,
    UpdateFlarePlanActionCommand,
)


class FlarePlanApi:
    def __init__(
        self,
        *,
        authenticator: AuthenticatorLike,
        service: FlarePlanService,
    ) -> None:
        self._authenticator = authenticator
        self._service = service

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
        try:
            if method == "GET" and route_path == "/api/flare-plan/templates":
                templates = self._service.list_starter_templates(user_id=user.user_id)
                return _json_response(
                    HTTPStatus.OK,
                    {"templates": [template.to_public_dict() for template in templates]},
                )
            if method == "GET" and route_path == "/api/flare-plan":
                plan = self._service.read_active_plan(user_id=user.user_id)
                return _json_response(HTTPStatus.OK, {"plan": plan.to_public_dict()})
            if method == "POST" and route_path == "/api/flare-plan/actions/from-template":
                payload = _parse_json_body(body)
                response = self._service.create_action_from_template(
                    CreateFlarePlanActionFromTemplateCommand(
                        user_id=user.user_id,
                        template_key=_optional_str(payload.get("template_key")),
                        idempotency_key=normalized_headers.get("idempotency-key") or "",
                    )
                )
                return _json_response(response.status_code, response.body)
            if method == "POST" and route_path == "/api/flare-plan/actions":
                payload = _parse_json_body(body)
                response = self._service.create_custom_action(
                    CreateCustomFlarePlanActionCommand(
                        user_id=user.user_id,
                        title=_optional_str(payload.get("title")),
                        description=_optional_str(payload.get("description")),
                        idempotency_key=normalized_headers.get("idempotency-key") or "",
                    )
                )
                return _json_response(response.status_code, response.body)
            if method == "PUT" and route_path == "/api/flare-plan/actions/order":
                payload = _parse_json_body(body)
                action_ids = payload.get("action_ids")
                if action_ids is None:
                    action_ids = []
                if not isinstance(action_ids, list):
                    raise FlarePlanError(
                        code="FLARE_PLAN_REORDER_UNKNOWN_ACTION",
                        message="Active action reorder must include an action_ids array.",
                        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                        details={},
                    )
                response = self._service.reorder_actions(
                    ReorderFlarePlanActionsCommand(
                        user_id=user.user_id,
                        action_ids=[str(action_id) for action_id in action_ids],
                        idempotency_key=normalized_headers.get("idempotency-key") or "",
                    )
                )
                return _json_response(response.status_code, response.body)
            if method == "PATCH" and route_path.startswith("/api/flare-plan/actions/"):
                action_id = route_path.removeprefix("/api/flare-plan/actions/")
                payload = _parse_json_body(body)
                response = self._service.update_action(
                    UpdateFlarePlanActionCommand(
                        user_id=user.user_id,
                        action_id=action_id,
                        title=_optional_str(payload.get("title")) if "title" in payload else None,
                        title_provided="title" in payload,
                        description=_optional_str(payload.get("description")) if "description" in payload else None,
                        description_provided="description" in payload,
                        idempotency_key=normalized_headers.get("idempotency-key") or "",
                    )
                )
                return _json_response(response.status_code, response.body)
            if method == "DELETE" and route_path.startswith("/api/flare-plan/actions/"):
                action_id = route_path.removeprefix("/api/flare-plan/actions/")
                response = self._service.archive_action(
                    ArchiveFlarePlanActionCommand(
                        user_id=user.user_id,
                        action_id=action_id,
                        idempotency_key=normalized_headers.get("idempotency-key") or "",
                    )
                )
                return _json_response(response.status_code, response.body)
        except ValueError:
            return _json_response(
                HTTPStatus.BAD_REQUEST,
                {"error": {"code": "invalid_json", "message": "Request body must be valid JSON."}},
            )
        except FlarePlanError as exc:
            return _json_response(exc.status_code, build_error_response(exc))
        return _json_response(
            HTTPStatus.NOT_FOUND,
            {"error": {"code": "not_found", "message": "Route not found."}},
        )


def _json_response(status: HTTPStatus | int, body: dict[str, Any]) -> ApiResponse:
    status_code = status.value if isinstance(status, HTTPStatus) else int(status)
    return ApiResponse(status_code=status_code, body=body)


def _normalize_headers(headers: dict[str, str]) -> dict[str, str]:
    return {str(key).lower(): value for key, value in headers.items()}


def _parse_json_body(body: bytes | None) -> dict[str, Any]:
    if body is None:
        return {}
    decoded = json.loads(body.decode("utf-8"))
    if not isinstance(decoded, dict):
        raise ValueError("JSON body must decode to an object.")
    return decoded


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)
