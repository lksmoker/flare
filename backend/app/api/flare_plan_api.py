from __future__ import annotations

import json
from http import HTTPStatus
from typing import Any
from urllib import parse

from backend.app.api.support_channels_api import ApiResponse, AuthenticatedUser, AuthenticatorLike
from backend.app.domain.flare_plan import FlarePlanError, build_error_response
from backend.app.services.flare_plan_service import (
    ArchiveFlarePlanActionCommand,
    CreateFlareEventCommand,
    CreateCustomFlarePlanActionCommand,
    CreateFlarePlanActionFromTemplateCommand,
    FlarePlanService,
    ResolveFlarePlanRunActionCommand,
    ReorderFlarePlanActionsCommand,
    TransitionFlarePlanRunCommand,
    UpdateFlarePlanActionCommand,
)
from backend.app.services.flare_trace_service import FlareTraceLifecycle, NoOpFlareTraceService


class FlarePlanApi:
    def __init__(
        self,
        *,
        authenticator: AuthenticatorLike,
        service: FlarePlanService,
        trace_lifecycle: FlareTraceLifecycle | None = None,
    ) -> None:
        self._authenticator = authenticator
        self._service = service
        self._trace_lifecycle = trace_lifecycle or NoOpFlareTraceService()

    def handle_request(
        self,
        *,
        method: str,
        path: str,
        headers: dict[str, str] | None = None,
        body: bytes | None = None,
    ) -> ApiResponse:
        normalized_headers = _normalize_headers(headers or {})
        trace_id = (normalized_headers.get("idempotency-key") or "").strip()
        user = self._authenticator.authenticate(normalized_headers)
        if user is None:
            return _json_response(
                HTTPStatus.UNAUTHORIZED,
                {"error": {"code": "unauthorized", "message": "Authentication is required."}},
            )
        self._trace_lifecycle.record_backend_received(trace_id=trace_id, user_id=user.user_id)
        self._trace_lifecycle.record_authenticated(trace_id=trace_id, user_id=user.user_id)
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
            if method == "POST" and route_path == "/api/flare-events":
                payload = _parse_json_body(body)
                response = self._service.create_flare_event(
                    CreateFlareEventCommand(
                        user_id=user.user_id,
                        anchor_note_id=_optional_str(payload.get("anchor_note_id")),
                        anchor_note_version=_optional_int(payload.get("anchor_note_version")),
                        behavior_description_snapshot=_optional_str(payload.get("behavior_description_snapshot")),
                        behavior_label_snapshot=_optional_str(payload.get("behavior_label_snapshot")) or "",
                        behavior_pattern_id=_optional_str(payload.get("behavior_pattern_id")),
                        response_mode=_optional_str(payload.get("response_mode")) or "fallback-generic",
                        support_action_shown=_optional_str(payload.get("support_action_shown")),
                        idempotency_key=normalized_headers.get("idempotency-key") or "",
                        trace_id=trace_id,
                    )
                )
                flare_event = response.body["flare_event"]
                flare_event_id = _optional_str(flare_event.get("id")) or ""
                flare_event_created_at = _optional_str(flare_event.get("created_at")) or ""
                if trace_id and flare_event_id and flare_event_created_at:
                    self._trace_lifecycle.record_completed(
                        trace_id=trace_id,
                        user_id=user.user_id,
                        flare_event_id=flare_event_id,
                        flare_event_created_at=flare_event_created_at,
                        terminal_http_status=response.status_code,
                    )
                return _json_response(response.status_code, response.body)
            if method == "GET" and route_path.startswith("/api/flare-events/") and route_path.endswith("/response"):
                flare_event_id = route_path.removeprefix("/api/flare-events/").removesuffix("/response")
                response_state = self._service.read_flare_response(user_id=user.user_id, flare_event_id=flare_event_id)
                return _json_response(HTTPStatus.OK, {"response": response_state.to_public_dict()})
            if route_path.startswith("/api/flare-events/") and route_path.endswith("/flare-plan-run"):
                flare_event_id = route_path.removeprefix("/api/flare-events/").removesuffix("/flare-plan-run")
                if method == "POST":
                    response = self._service.create_or_read_run_for_event(
                        user_id=user.user_id,
                        flare_event_id=flare_event_id,
                        idempotency_key=normalized_headers.get("idempotency-key") or "",
                    )
                    return _json_response(response.status_code, response.body)
                if method == "GET":
                    run = self._service.read_run_for_event(user_id=user.user_id, flare_event_id=flare_event_id)
                    return _json_response(HTTPStatus.OK, {"run": None if run is None else run.to_public_dict()})
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
            if method == "POST" and route_path.startswith("/api/flare-plan-runs/"):
                run_path = route_path.removeprefix("/api/flare-plan-runs/")
                run_id, _, action_path = run_path.partition("/")
                if action_path == "begin":
                    response = self._service.begin_run(
                        TransitionFlarePlanRunCommand(
                            user_id=user.user_id,
                            run_id=run_id,
                            idempotency_key=normalized_headers.get("idempotency-key") or "",
                        )
                    )
                    return _json_response(response.status_code, response.body)
                if action_path == "decline":
                    response = self._service.decline_run(
                        TransitionFlarePlanRunCommand(
                            user_id=user.user_id,
                            run_id=run_id,
                            idempotency_key=normalized_headers.get("idempotency-key") or "",
                        )
                    )
                    return _json_response(response.status_code, response.body)
                if action_path == "end-early":
                    response = self._service.end_run_early(
                        TransitionFlarePlanRunCommand(
                            user_id=user.user_id,
                            run_id=run_id,
                            idempotency_key=normalized_headers.get("idempotency-key") or "",
                        )
                    )
                    return _json_response(response.status_code, response.body)
                if action_path.startswith("actions/") and action_path.endswith("/done"):
                    event_action_id = action_path.removeprefix("actions/").removesuffix("/done")
                    response = self._service.mark_action_done(
                        ResolveFlarePlanRunActionCommand(
                            user_id=user.user_id,
                            run_id=run_id,
                            event_action_id=event_action_id,
                            idempotency_key=normalized_headers.get("idempotency-key") or "",
                        )
                    )
                    return _json_response(response.status_code, response.body)
                if action_path.startswith("actions/") and action_path.endswith("/skip"):
                    event_action_id = action_path.removeprefix("actions/").removesuffix("/skip")
                    response = self._service.mark_action_skipped(
                        ResolveFlarePlanRunActionCommand(
                            user_id=user.user_id,
                            run_id=run_id,
                            event_action_id=event_action_id,
                            idempotency_key=normalized_headers.get("idempotency-key") or "",
                        )
                    )
                    return _json_response(response.status_code, response.body)
        except ValueError:
            if trace_id:
                self._trace_lifecycle.record_failed(
                    trace_id=trace_id,
                    user_id=user.user_id,
                    failure_stage="validation",
                    failure_code="validation_rejected",
                    terminal_http_status=HTTPStatus.BAD_REQUEST,
                )
            return _json_response(
                HTTPStatus.BAD_REQUEST,
                {"error": {"code": "invalid_json", "message": "Request body must be valid JSON."}},
            )
        except FlarePlanError as exc:
            if trace_id and route_path == "/api/flare-events":
                failure_code = "idempotency_conflict" if exc.code == "FLARE_PLAN_IDEMPOTENCY_KEY_REUSED" else "validation_rejected"
                self._trace_lifecycle.record_failed(
                    trace_id=trace_id,
                    user_id=user.user_id,
                    failure_stage="validation",
                    failure_code=failure_code,
                    terminal_http_status=exc.status_code,
                )
            return _json_response(exc.status_code, build_error_response(exc))
        except Exception:
            if trace_id and route_path == "/api/flare-events":
                self._trace_lifecycle.record_failed(
                    trace_id=trace_id,
                    user_id=user.user_id,
                    failure_stage="backend_unexpected",
                    failure_code="unexpected_server_error",
                    terminal_http_status=HTTPStatus.INTERNAL_SERVER_ERROR,
                )
            raise
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


def _optional_int(value: Any) -> int | None:
    if value is None:
        return None
    return int(value)
