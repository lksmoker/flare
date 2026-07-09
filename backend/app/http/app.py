from __future__ import annotations

import json
from dataclasses import dataclass
from html import escape
from http import HTTPStatus
from typing import Any, Callable, Iterable, Protocol
from urllib import error, parse, request

from backend.app.api.support_channels_api import (
    ApiResponse,
    AuthenticatedUser,
    SupportChannelsApi,
)
from backend.app.api.flare_plan_api import FlarePlanApi
from backend.app.db.support_channel_repository import SupportChannelRepository
from backend.app.db.flare_plan_repository import PostgresFlarePlanRepository
from backend.app.integrations.groupme_provider import GroupMeProvider
from backend.app.services.support_channel_config import (
    SupportChannelHttpRuntimeConfig,
    load_groupme_bot_provisioning_config,
    load_groupme_oauth_config,
    load_support_channel_http_runtime_config,
    load_supabase_admin_config,
)
from backend.app.services.flare_plan_config import load_flare_plan_database_config
from backend.app.services.flare_plan_service import FlarePlanService
from backend.app.services.support_channel_groupme_provisioner import (
    GroupMeBotManager,
    GroupMeChannelProvisioner,
)
from backend.app.services.support_channel_management import SupportChannelManager
from backend.app.services.support_channel_provider_config import ProviderConfigResolver
from backend.app.services.support_channel_sender import SupportChannelSender

StartResponse = Callable[[str, list[tuple[str, str]]], Any]

_CORS_ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
_CORS_ALLOWED_HEADERS = "authorization, content-type, idempotency-key"
_API_PREFIX = "/api/"
_GROUPME_CALLBACK_PATH = "/api/support-channel/groupme/connect/callback"
_GROUPME_PUBLIC_CALLBACK_PATH = "/api/support-channel/groupme/callback"
_GROUPME_CONNECT_START_PATH = "/api/support-channel/groupme/connect/start"


class UserLookupTransport(Protocol):
    def request_json(self, *, url: str, access_token: str, api_key: str) -> dict[str, Any] | None:
        ...


@dataclass(frozen=True)
class SupabaseUserAuthenticator:
    supabase_url: str
    service_role_key: str
    transport: UserLookupTransport | None = None

    def authenticate(self, headers: dict[str, str]) -> AuthenticatedUser | None:
        authorization = headers.get("authorization") or ""
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token.strip():
            return None
        transport = self.transport or _UrllibUserLookupTransport()
        try:
            payload = transport.request_json(
                url=f"{self.supabase_url}/auth/v1/user",
                access_token=token.strip(),
                api_key=self.service_role_key,
            )
        except (RuntimeError, error.HTTPError, error.URLError, json.JSONDecodeError):
            return None
        user_id = None if not isinstance(payload, dict) else payload.get("id")
        if user_id is None:
            return None
        return AuthenticatedUser(
            user_id=str(user_id),
            first_name=_extract_authenticated_first_name(payload),
        )


class SupportChannelHttpApp:
    def __init__(
        self,
        *,
        runtime_config: SupportChannelHttpRuntimeConfig,
        support_api: SupportChannelsApi,
        flare_plan_api: FlarePlanApi | None = None,
    ) -> None:
        self._runtime_config = runtime_config
        self._support_api = support_api
        self._flare_plan_api = flare_plan_api

    def __call__(self, environ: dict[str, Any], start_response: StartResponse) -> Iterable[bytes]:
        method = str(environ.get("REQUEST_METHOD") or "GET").upper()
        path = str(environ.get("PATH_INFO") or "/")
        query_string = str(environ.get("QUERY_STRING") or "")
        origin = _clean_origin(environ.get("HTTP_ORIGIN"))

        if path.startswith(_API_PREFIX):
            rejected = self._reject_disallowed_origin(path=path, origin=origin, start_response=start_response)
            if rejected is not None:
                return rejected

        if method == "OPTIONS" and path.startswith(_API_PREFIX):
            return self._respond(
                start_response,
                HTTPStatus.NO_CONTENT,
                b"",
                content_type="text/plain; charset=utf-8",
                extra_headers=self._cors_headers(origin),
            )

        if method == "GET" and path == "/api/health":
            body = json.dumps(
                {
                    "status": "ok",
                    "public_backend_base_url": self._runtime_config.public_backend_base_url,
                    "allowed_frontend_origins": list(self._runtime_config.allowed_frontend_origins),
                    "routes": [
                        "/api/health",
                        "/api/support-channel",
                        "/api/support-channel/groupme/connect/start",
                        "/api/support-channel/groupme/callback",
                        "/api/support-channel/groupme/connect/callback",
                        "/api/support-channel/groupme/destinations",
                        "/api/support-channel/configure",
                        "/api/support-channel/reconnect",
                        "/api/support-channel/disable",
                        "/api/support-channel/test",
                        "/api/support-channel/send-flare",
                        "/api/flare-events",
                        "/api/flare-events/{flare_event_id}/response",
                        "/api/flare-events/{flare_event_id}/flare-plan-run",
                        "/api/flare-plan/templates",
                        "/api/flare-plan",
                        "/api/flare-plan/actions/from-template",
                        "/api/flare-plan/actions",
                        "/api/flare-plan/actions/{action_id}",
                        "/api/flare-plan/actions/order",
                        "/api/flare-plan-runs/{run_id}/begin",
                        "/api/flare-plan-runs/{run_id}/decline",
                        "/api/flare-plan-runs/{run_id}/actions/{event_action_id}/done",
                        "/api/flare-plan-runs/{run_id}/actions/{event_action_id}/skip",
                        "/api/flare-plan-runs/{run_id}/end-early",
                    ],
                },
                sort_keys=True,
            ).encode("utf-8")
            return self._respond(
                start_response,
                HTTPStatus.OK,
                body,
                content_type="application/json; charset=utf-8",
                extra_headers=self._cors_headers(origin),
            )

        if method == "GET" and path == _GROUPME_PUBLIC_CALLBACK_PATH:
            default_origin = self._select_callback_frontend_origin(origin)
            html = _build_groupme_callback_bridge_html(
                default_frontend_origin=default_origin,
                allowed_origins=self._runtime_config.allowed_frontend_origins,
            ).encode("utf-8")
            return self._respond(
                start_response,
                HTTPStatus.OK,
                html,
                content_type="text/html; charset=utf-8",
                extra_headers=self._cors_headers(origin),
            )

        if method == "GET" and path == _GROUPME_CALLBACK_PATH and "access_token=" not in query_string:
            default_origin = self._select_callback_frontend_origin(origin)
            html = _build_groupme_callback_bridge_html(
                default_frontend_origin=default_origin,
                allowed_origins=self._runtime_config.allowed_frontend_origins,
            ).encode("utf-8")
            return self._respond(
                start_response,
                HTTPStatus.OK,
                html,
                content_type="text/html; charset=utf-8",
                extra_headers=self._cors_headers(origin),
            )

        body = _read_request_body(environ)
        headers = _extract_headers(environ)
        api_path = path if not query_string else f"{path}?{query_string}"
        if self._flare_plan_api is not None and (
            path.startswith("/api/flare-plan")
            or path.startswith("/api/flare-events")
        ):
            response = self._flare_plan_api.handle_request(
                method=method,
                path=api_path,
                headers=headers,
                body=body,
            )
        else:
            response = self._support_api.handle_request(
                method=method,
                path=api_path,
                headers=headers,
                body=body,
            )
        if path == _GROUPME_CONNECT_START_PATH and response.status_code == HTTPStatus.OK:
            response = _append_groupme_oauth_state(
                response=response,
                origin=self._select_callback_frontend_origin(origin),
            )
        return self._respond(
            start_response,
            response.status_code,
            response.json_bytes(),
            content_type="application/json; charset=utf-8",
            extra_headers=self._cors_headers(origin),
        )

    def _reject_disallowed_origin(
        self,
        *,
        path: str,
        origin: str | None,
        start_response: StartResponse,
    ) -> Iterable[bytes] | None:
        if origin is None:
            return None
        if origin in self._runtime_config.allowed_frontend_origins:
            return None
        body = json.dumps(
            {
                "error": {
                    "code": "origin_not_allowed",
                    "message": "Browser origin is not allowed for this backend.",
                }
            },
            sort_keys=True,
        ).encode("utf-8")
        return self._respond(
            start_response,
            HTTPStatus.FORBIDDEN,
            body,
            content_type="application/json; charset=utf-8",
            extra_headers=[],
        )

    def _cors_headers(self, origin: str | None) -> list[tuple[str, str]]:
        if origin is None or origin not in self._runtime_config.allowed_frontend_origins:
            return []
        return [
            ("Access-Control-Allow-Origin", origin),
            ("Access-Control-Allow-Headers", _CORS_ALLOWED_HEADERS),
            ("Access-Control-Allow-Methods", _CORS_ALLOWED_METHODS),
            ("Access-Control-Allow-Credentials", "true"),
            ("Vary", "Origin"),
        ]

    def _respond(
        self,
        start_response: StartResponse,
        status_code: int | HTTPStatus,
        body: bytes,
        *,
        content_type: str,
        extra_headers: list[tuple[str, str]],
    ) -> Iterable[bytes]:
        code = status_code.value if isinstance(status_code, HTTPStatus) else int(status_code)
        reason = HTTPStatus(code).phrase
        headers = [
            ("Content-Type", content_type),
            ("Content-Length", str(len(body))),
            *extra_headers,
        ]
        start_response(f"{code} {reason}", headers)
        return [body]

    def _select_callback_frontend_origin(self, request_origin: str | None) -> str:
        if request_origin and request_origin in self._runtime_config.allowed_frontend_origins:
            return request_origin
        return self._runtime_config.allowed_frontend_origins[0]


def build_support_channel_http_app(
    *,
    env: dict[str, str] | None = None,
    auth_transport: UserLookupTransport | None = None,
) -> SupportChannelHttpApp:
    runtime_config = load_support_channel_http_runtime_config(env)
    supabase_config = load_supabase_admin_config(env)
    repository = SupportChannelRepository(config=supabase_config)
    provider = GroupMeProvider()
    provisioner = GroupMeChannelProvisioner(
        provider=provider,
        repository=repository,
        oauth_config=load_groupme_oauth_config(env),
        bot_manager=GroupMeBotManager(
            provider=provider,
            config=load_groupme_bot_provisioning_config(env),
        ),
    )
    flare_plan_repository = PostgresFlarePlanRepository(
        config=load_flare_plan_database_config(env),
    )
    support_api = SupportChannelsApi(
        authenticator=SupabaseUserAuthenticator(
            supabase_url=supabase_config.url,
            service_role_key=supabase_config.service_role_key,
            transport=auth_transport,
        ),
        manager=SupportChannelManager(
            repository=repository,
            groupme_onboarding=provisioner,
        ),
        sender=SupportChannelSender(
            repository=repository,
            groupme_provider=provider,
            provider_config_resolver=ProviderConfigResolver(repository=repository),
        ),
    )
    flare_plan_api = FlarePlanApi(
        authenticator=SupabaseUserAuthenticator(
            supabase_url=supabase_config.url,
            service_role_key=supabase_config.service_role_key,
            transport=auth_transport,
        ),
        service=FlarePlanService(repository=flare_plan_repository),
    )
    return SupportChannelHttpApp(
        runtime_config=runtime_config,
        support_api=support_api,
        flare_plan_api=flare_plan_api,
    )


def _append_groupme_oauth_state(*, response: ApiResponse, origin: str) -> ApiResponse:
    auth_url = response.body.get("auth_url")
    if not isinstance(auth_url, str) or not auth_url:
        return response
    parsed = parse.urlsplit(auth_url)
    query = parse.parse_qs(parsed.query, keep_blank_values=True)
    query["state"] = [origin]
    next_query = parse.urlencode(query, doseq=True)
    next_url = parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, next_query, parsed.fragment))
    return ApiResponse(
        status_code=response.status_code,
        body={**response.body, "auth_url": next_url},
    )


def _read_request_body(environ: dict[str, Any]) -> bytes | None:
    content_length = environ.get("CONTENT_LENGTH")
    if content_length in (None, ""):
        return None
    try:
        length = int(content_length)
    except (TypeError, ValueError):
        return None
    if length <= 0:
        return None
    stream = environ.get("wsgi.input")
    if stream is None:
        return None
    return stream.read(length)


def _extract_headers(environ: dict[str, Any]) -> dict[str, str]:
    headers: dict[str, str] = {}
    for key, value in environ.items():
        if not key.startswith("HTTP_"):
            continue
        header_name = key[5:].replace("_", "-").lower()
        headers[header_name] = str(value)
    if "CONTENT_TYPE" in environ:
        headers["content-type"] = str(environ["CONTENT_TYPE"])
    if "CONTENT_LENGTH" in environ and environ["CONTENT_LENGTH"] not in ("", None):
        headers["content-length"] = str(environ["CONTENT_LENGTH"])
    return headers


def _clean_origin(value: object) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


def _build_groupme_callback_bridge_html(
    *,
    default_frontend_origin: str,
    allowed_origins: tuple[str, ...],
) -> str:
    allowed = ",".join(allowed_origins)
    safe_origin = escape(default_frontend_origin, quote=True)
    safe_allowed = escape(allowed, quote=True)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Flare GroupMe Callback</title>
</head>
<body>
  <p>Completing GroupMe connection...</p>
  <script>
    (function () {{
      var defaultOrigin = {json.dumps(default_frontend_origin)};
      var allowedOrigins = {json.dumps(list(allowed_origins))};
      var hashParams = new URLSearchParams(window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash);
      var searchParams = new URLSearchParams(window.location.search.startsWith("?") ? window.location.search.slice(1) : window.location.search);
      var accessToken = hashParams.get("access_token") || searchParams.get("access_token") || hashParams.get("code") || searchParams.get("code");
      var stateOrigin = hashParams.get("state") || searchParams.get("state");
      var targetOrigin = allowedOrigins.indexOf(stateOrigin) >= 0 ? stateOrigin : defaultOrigin;
      if (!accessToken) {{
        document.body.innerHTML = "<p>GroupMe callback is missing an access token or code.</p>";
        return;
      }}
      var redirectParams = new URLSearchParams();
      var callbackToken = hashParams.get("access_token") || searchParams.get("access_token");
      var callbackCode = hashParams.get("code") || searchParams.get("code");

      if (callbackToken) {{
        redirectParams.set("access_token", callbackToken);
      }}

      if (callbackCode) {{
        redirectParams.set("groupme_code", callbackCode);
      }}

      ["token_type", "expires_in", "state"].forEach(function (name) {{
        var value = hashParams.get(name) || searchParams.get(name);
        if (value) {{
          redirectParams.set(name, value);
        }}
      }});
      window.location.replace(targetOrigin + "/customize?" + redirectParams.toString());
    }})();
  </script>
  <noscript>
    <p>JavaScript is required to complete the GroupMe callback.</p>
    <p data-default-origin="{safe_origin}" data-allowed-origins="{safe_allowed}"></p>
  </noscript>
</body>
</html>
"""


class _UrllibUserLookupTransport:
    def request_json(self, *, url: str, access_token: str, api_key: str) -> dict[str, Any] | None:
        raw_request = request.Request(
            url=url,
            headers={
                "apikey": api_key,
                "Authorization": f"Bearer {access_token}",
            },
            method="GET",
        )
        with request.urlopen(raw_request, timeout=10) as response:
            raw_body = response.read()
        if not raw_body:
            return None
        decoded = json.loads(raw_body.decode("utf-8"))
        if not isinstance(decoded, dict):
            raise RuntimeError("Unexpected Supabase auth response shape.")
        return decoded


def _extract_authenticated_first_name(payload: dict[str, Any]) -> str | None:
    metadata = payload.get("user_metadata")
    if isinstance(metadata, dict):
        for key in ("first_name", "given_name"):
            value = metadata.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        for key in ("full_name", "name"):
            value = metadata.get(key)
            if isinstance(value, str):
                extracted = _extract_first_token(value)
                if extracted is not None:
                    return extracted
    return None


def _extract_first_token(value: str) -> str | None:
    pieces = value.strip().split()
    if not pieces:
        return None
    return pieces[0]




