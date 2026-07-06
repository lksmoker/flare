from __future__ import annotations

import io
import json
import unittest
from urllib import parse

from backend.app.api.support_channels_api import (
    ApiResponse,
    AuthenticatedUser,
    SupportChannelsApi,
)
from backend.app.http.app import SupportChannelHttpApp, SupabaseUserAuthenticator
from backend.app.services.support_channel_config import (
    load_support_channel_http_runtime_config,
)


class SupportChannelHttpAppTests(unittest.TestCase):
    def setUp(self) -> None:
        runtime_config = load_support_channel_http_runtime_config(
            {
                "FLARE_ALLOWED_FRONTEND_ORIGINS": "https://flare-web.tailnet.ts.net,http://100.64.0.10:8081",
                "FLARE_PUBLIC_BACKEND_BASE_URL": "https://flare-api.tailnet.ts.net:9001",
            }
        )
        self.support_api = _FakeSupportApi()
        self.app = SupportChannelHttpApp(
            runtime_config=runtime_config,
            support_api=self.support_api,
        )

    def test_health_endpoint_reports_registered_routes(self) -> None:
        response = _invoke(self.app, method="GET", path="/api/health")

        self.assertEqual(200, response.status_code)
        payload = json.loads(response.body.decode("utf-8"))
        self.assertEqual("ok", payload["status"])
        self.assertIn("/api/support-channel/groupme/connect/callback", payload["routes"])
        self.assertEqual(
            "https://flare-api.tailnet.ts.net:9001",
            payload["public_backend_base_url"],
        )

    def test_preflight_returns_exact_allowed_origin(self) -> None:
        response = _invoke(
            self.app,
            method="OPTIONS",
            path="/api/support-channel",
            origin="https://flare-web.tailnet.ts.net",
        )

        self.assertEqual(204, response.status_code)
        self.assertEqual(
            "https://flare-web.tailnet.ts.net",
            response.headers["Access-Control-Allow-Origin"],
        )
        self.assertNotEqual("*", response.headers["Access-Control-Allow-Origin"])

    def test_disallowed_origin_is_rejected(self) -> None:
        response = _invoke(
            self.app,
            method="GET",
            path="/api/support-channel",
            origin="https://evil.example",
        )

        self.assertEqual(403, response.status_code)
        payload = json.loads(response.body.decode("utf-8"))
        self.assertEqual("origin_not_allowed", payload["error"]["code"])
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)

    def test_connect_start_appends_request_origin_as_oauth_state(self) -> None:
        response = _invoke(
            self.app,
            method="POST",
            path="/api/support-channel/groupme/connect/start",
            origin="http://100.64.0.10:8081",
        )

        self.assertEqual(200, response.status_code)
        payload = json.loads(response.body.decode("utf-8"))
        query = parse.parse_qs(parse.urlsplit(payload["auth_url"]).query)
        self.assertEqual(["http://100.64.0.10:8081"], query["state"])

    def test_groupme_callback_bridge_redirects_to_allowed_frontend_customize_route(self) -> None:
        response = _invoke(
            self.app,
            method="GET",
            path="/api/support-channel/groupme/connect/callback",
            origin="https://flare-web.tailnet.ts.net",
        )

        self.assertEqual(200, response.status_code)
        html = response.body.decode("utf-8")
        self.assertIn("window.location.replace", html)
        self.assertIn('var defaultOrigin = "https://flare-web.tailnet.ts.net";', html)
        self.assertIn('targetOrigin + "/customize?"', html)

    def test_authenticated_callback_query_is_forwarded_to_support_api(self) -> None:
        response = _invoke(
            self.app,
            method="GET",
            path="/api/support-channel/groupme/connect/callback",
            query_string="access_token=provider-token",
            origin="https://flare-web.tailnet.ts.net",
            authorization="Bearer user-session-token",
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual(
            (
                "GET",
                "/api/support-channel/groupme/connect/callback?access_token=provider-token",
                "Bearer user-session-token",
            ),
            self.support_api.requests[-1],
        )


class SupabaseUserAuthenticatorTests(unittest.TestCase):
    def test_authenticator_returns_authenticated_user_from_supabase_lookup(self) -> None:
        authenticator = SupabaseUserAuthenticator(
            supabase_url="https://project.supabase.co",
            service_role_key="service-role-key",
            transport=_FakeUserLookupTransport(payload={"id": "user-123"}),
        )

        user = authenticator.authenticate({"authorization": "Bearer session-token"})

        self.assertEqual(AuthenticatedUser(user_id="user-123"), user)

    def test_authenticator_fails_closed_on_lookup_error(self) -> None:
        authenticator = SupabaseUserAuthenticator(
            supabase_url="https://project.supabase.co",
            service_role_key="service-role-key",
            transport=_FakeUserLookupTransport(error=RuntimeError("boom")),
        )

        user = authenticator.authenticate({"authorization": "Bearer session-token"})

        self.assertIsNone(user)


class _FakeSupportApi(SupportChannelsApi):
    def __init__(self) -> None:
        self.requests: list[tuple[str, str, str | None]] = []

    def handle_request(self, *, method: str, path: str, headers=None, body=None) -> ApiResponse:
        self.requests.append((method, path, None if headers is None else headers.get("authorization")))
        if path == "/api/support-channel/groupme/connect/start":
            return ApiResponse(
                status_code=200,
                body={
                    "provider": "groupme",
                    "auth_url": "https://oauth.groupme.com/oauth/authorize?client_id=client-123",
                },
            )
        return ApiResponse(status_code=200, body={"ok": True})


class _FakeUserLookupTransport:
    def __init__(self, *, payload=None, error: Exception | None = None) -> None:
        self.payload = payload
        self.error = error

    def request_json(self, *, url: str, access_token: str, api_key: str):
        if self.error is not None:
            raise self.error
        return self.payload


def _invoke(
    app,
    *,
    method: str,
    path: str,
    query_string: str = "",
    origin: str | None = None,
    authorization: str | None = None,
    body: bytes | None = None,
):
    raw_body = body or b""
    environ = {
        "REQUEST_METHOD": method,
        "PATH_INFO": path,
        "QUERY_STRING": query_string,
        "CONTENT_LENGTH": str(len(raw_body)) if raw_body else "",
        "CONTENT_TYPE": "application/json" if raw_body else "",
        "wsgi.input": io.BytesIO(raw_body),
    }
    if origin is not None:
        environ["HTTP_ORIGIN"] = origin
    if authorization is not None:
        environ["HTTP_AUTHORIZATION"] = authorization

    captured: dict[str, object] = {}

    def start_response(status: str, headers: list[tuple[str, str]]) -> None:
        captured["status"] = status
        captured["headers"] = dict(headers)

    chunks = list(app(environ, start_response))
    return _SimpleResponse(
        status_code=int(str(captured["status"]).split(" ", 1)[0]),
        headers=captured["headers"],  # type: ignore[arg-type]
        body=b"".join(chunks),
    )


class _SimpleResponse:
    def __init__(self, *, status_code: int, headers: dict[str, str], body: bytes) -> None:
        self.status_code = status_code
        self.headers = headers
        self.body = body
