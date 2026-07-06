from __future__ import annotations

import json
import unittest
from dataclasses import replace

from backend.app.api.support_channels_api import (
    AuthenticatedUser,
    SupportChannelsApi,
)
from backend.app.domain.support_channels import (
    GROUPME_TEST_MESSAGE,
    SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED,
    SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED,
    SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    SUPPORT_CHANNEL_STATUS_CONNECTED,
    SUPPORT_CHANNEL_STATUS_DISABLED,
    GroupMeConnectSession,
    SupportChannelDestination,
    SupportChannelRecord,
    SupportChannelSendResult,
)
from backend.app.services.support_channel_management import (
    ProvisionedGroupMeChannel,
    SupportChannelManager,
)
from backend.app.services.support_channel_provider_config import ProviderConfigResolver
from backend.app.services.support_channel_sender import SupportChannelSender


class SupportChannelsApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = _FakeRepository()
        self.provider = _FakeProvider()
        self.onboarding = _FakeOnboarding()
        self.api = SupportChannelsApi(
            authenticator=_FakeAuthenticator(user_id="user-123"),
            manager=SupportChannelManager(
                repository=self.repository,
                groupme_onboarding=self.onboarding,
            ),
            sender=SupportChannelSender(
                repository=self.repository,
                groupme_provider=self.provider,
                provider_config_resolver=ProviderConfigResolver(repository=self.repository),
            ),
        )

    def test_get_returns_null_when_user_has_no_configured_support_channel(self) -> None:
        response = self._request("GET", "/api/support-channel")

        self.assertEqual(200, response.status_code)
        self.assertEqual({"channel": None}, response.body)

    def test_groupme_connect_start_returns_safe_authorize_url(self) -> None:
        response = self._request("POST", "/api/support-channel/groupme/connect/start")

        self.assertEqual(200, response.status_code)
        self.assertEqual(SUPPORT_CHANNEL_PROVIDER_GROUPME, response.body["provider"])
        self.assertIn("oauth.groupme.com", response.body["auth_url"])
        self._assert_no_provider_secrets(response.body)

    def test_groupme_callback_returns_safe_connect_session(self) -> None:
        response = self._request(
            "GET",
            "/api/support-channel/groupme/connect/callback?access_token=access-token-1",
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual(
            {
                "connect_session_id": "session-123",
                "provider": SUPPORT_CHANNEL_PROVIDER_GROUPME,
                "status": "authorized",
            },
            response.body["connection"],
        )
        self._assert_no_provider_secrets(response.body)

    def test_groupme_callback_surfaces_auth_error_without_leaking_token(self) -> None:
        self.onboarding.complete_error = ("groupme_auth_invalid", "GroupMe authorization is invalid or expired.", 401)

        response = self._request(
            "GET",
            "/api/support-channel/groupme/connect/callback?access_token=bad-token",
        )

        self.assertEqual(401, response.status_code)
        self.assertEqual("groupme_auth_invalid", response.body["error"]["code"])
        self._assert_no_provider_secrets(response.body)

    def test_groupme_destinations_returns_safe_group_list(self) -> None:
        response = self._request(
            "GET",
            "/api/support-channel/groupme/destinations?connect_session_id=session-123",
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual(
            [
                {
                    "id": "group-1",
                    "name": "Group One",
                    "description": None,
                    "image_url": None,
                    "group_type": None,
                },
                {
                    "id": "group-2",
                    "name": "Group Two",
                    "description": "close friends",
                    "image_url": None,
                    "group_type": "private",
                },
            ],
            response.body["destinations"],
        )
        self._assert_no_provider_secrets(response.body)

    def test_configure_selects_destination_and_hides_provider_secrets(self) -> None:
        response = self._request(
            "POST",
            "/api/support-channel/configure",
            {
                "connect_session_id": "session-123",
                "external_group_id": "group-2",
                "default_message": "Please check in when you can.",
                "enabled": True,
            },
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual("session-123", self.onboarding.last_connect_session_id)
        self.assertEqual("group-2", self.onboarding.last_external_group_id)
        self.assertTrue(self.repository.current is not None)
        self.assertEqual("Group Two", self.repository.current.external_group_name)
        self.assertTrue(self.repository.current.enabled)
        self._assert_no_provider_secrets(response.body)

    def test_configure_surfaces_provisioning_failure(self) -> None:
        self.onboarding.provision_error = (
            "groupme_provider_error",
            "GroupMe request failed with status 500.",
            502,
        )

        response = self._request(
            "POST",
            "/api/support-channel/configure",
            {
                "connect_session_id": "session-123",
                "external_group_id": "group-2",
                "default_message": "Please check in when you can.",
                "enabled": True,
            },
        )

        self.assertEqual(502, response.status_code)
        self.assertEqual("groupme_provider_error", response.body["error"]["code"])
        self._assert_no_provider_secrets(response.body)

    def test_reconnect_updates_current_channel_without_leaking_provider_config(self) -> None:
        self.repository.current = _build_channel(
            enabled=False,
            status="reconnect_required",
            provider_config_ref="groupme:config:Y29uZmlnLTE",
            external_group_name="Old Group",
        )
        self.repository.current = replace(
            self.repository.current,
            external_group_id="group-1",
        )

        response = self._request(
            "POST",
            "/api/support-channel/reconnect",
            {
                "connect_session_id": "session-123",
                "enabled": True,
            },
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual("session-123", self.onboarding.last_connect_session_id)
        self.assertTrue(self.onboarding.last_reconnect)
        self.assertTrue(self.repository.current is not None)
        self.assertEqual(SUPPORT_CHANNEL_STATUS_CONNECTED, self.repository.current.status)
        self.assertEqual("group-1", self.repository.current.external_group_id)
        self.assertEqual("Group One", self.repository.current.external_group_name)
        self._assert_no_provider_secrets(response.body)

    def test_disabled_channel_cannot_send_test_flare(self) -> None:
        self.repository.current = _build_channel(
            enabled=False,
            status=SUPPORT_CHANNEL_STATUS_DISABLED,
            provider_config_ref="groupme:config:Y29uZmlnLTE",
        )
        self.repository.provider_configs["config-1"] = _build_provider_config(bot_id="bot-123")

        response = self._request("POST", "/api/support-channel/test")

        self.assertEqual(409, response.status_code)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED, response.body["result"]["status"])
        self.assertEqual("support_channel_not_ready", response.body["result"]["error_code"])
        self.assertFalse(self.provider.was_called)
        self.assertEqual(1, len(self.repository.attempts))
        self._assert_no_provider_secrets(response.body)

    def test_successful_test_send_persists_attempt_and_updates_channel_status(self) -> None:
        self.repository.current = _build_channel(
            enabled=True,
            status=SUPPORT_CHANNEL_STATUS_CONNECTED,
            provider_config_ref="groupme:config:Y29uZmlnLTE",
        )
        self.repository.provider_configs["config-1"] = _build_provider_config(bot_id="bot-123")
        self.provider.result = SupportChannelSendResult(
            ok=True,
            provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
            send_kind="test",
            status=SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
            attempted_at="2026-07-06T03:10:00Z",
            delivered_at="2026-07-06T03:10:00Z",
            support_channel_id=self.repository.current.id,
            user_id=self.repository.current.user_id,
            destination_id=self.repository.current.external_group_id,
            destination_name=self.repository.current.external_group_name,
            message_snapshot=GROUPME_TEST_MESSAGE,
            provider_message_id="provider-message-1",
            error_code=None,
            error_message_safe=None,
            raw_provider_status_ref="http_status:202",
        )

        response = self._request("POST", "/api/support-channel/test")

        self.assertEqual(200, response.status_code)
        self.assertTrue(self.provider.was_called)
        self.assertEqual(1, len(self.repository.attempts))
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_SENT, self.repository.current.last_delivery_status)
        self.assertEqual("2026-07-06T03:10:00Z", self.repository.current.last_delivery_at)
        self._assert_no_provider_secrets(response.body)

    def test_provider_failure_persists_failed_attempt_and_safe_response(self) -> None:
        self.repository.current = _build_channel(
            enabled=True,
            status=SUPPORT_CHANNEL_STATUS_CONNECTED,
            provider_config_ref="groupme:config:Y29uZmlnLTE",
        )
        self.repository.provider_configs["config-1"] = _build_provider_config(bot_id="bot-123")
        self.provider.result = SupportChannelSendResult(
            ok=False,
            provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
            send_kind="test",
            status=SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED,
            attempted_at="2026-07-06T03:20:00Z",
            delivered_at=None,
            support_channel_id=self.repository.current.id,
            user_id=self.repository.current.user_id,
            destination_id=self.repository.current.external_group_id,
            destination_name=self.repository.current.external_group_name,
            message_snapshot=GROUPME_TEST_MESSAGE,
            provider_message_id=None,
            error_code="groupme_http_500",
            error_message_safe="GroupMe rejected the test message.",
            raw_provider_status_ref="http_status:500",
        )

        response = self._request("POST", "/api/support-channel/test")

        self.assertEqual(502, response.status_code)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED, response.body["result"]["status"])
        self.assertEqual(1, len(self.repository.attempts))
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED, self.repository.current.last_delivery_status)
        self.assertEqual("groupme_http_500", self.repository.current.last_error_code)
        self._assert_no_provider_secrets(response.body)

    def test_disable_endpoint_preserves_channel_and_marks_it_disabled(self) -> None:
        self.repository.current = _build_channel(
            enabled=True,
            status=SUPPORT_CHANNEL_STATUS_CONNECTED,
            provider_config_ref="groupme:config:Y29uZmlnLTE",
        )

        response = self._request("POST", "/api/support-channel/disable")

        self.assertEqual(200, response.status_code)
        self.assertFalse(self.repository.current.enabled)
        self.assertEqual(SUPPORT_CHANNEL_STATUS_DISABLED, self.repository.current.status)
        self._assert_no_provider_secrets(response.body)

    def _request(
        self,
        method: str,
        path: str,
        payload: dict[str, object] | None = None,
    ):
        body = None if payload is None else json.dumps(payload).encode("utf-8")
        return self.api.handle_request(
            method=method,
            path=path,
            headers={"authorization": "Bearer whatever"},
            body=body,
        )

    def _assert_no_provider_secrets(self, body: dict[str, object]) -> None:
        serialized = json.dumps(body, sort_keys=True)
        self.assertNotIn("provider_config_ref", serialized)
        self.assertNotIn("access_token", serialized)
        self.assertNotIn("connect_token", serialized)
        self.assertNotIn("bot-123", serialized)
        self.assertNotIn("Ym90", serialized)
        self.assertNotIn("access-token-1", serialized)


class _FakeAuthenticator:
    def __init__(self, *, user_id: str) -> None:
        self.user_id = user_id

    def authenticate(self, headers: dict[str, str]) -> AuthenticatedUser | None:
        if "authorization" not in headers:
            return None
        return AuthenticatedUser(user_id=self.user_id)


class _FakeOnboarding:
    def __init__(self) -> None:
        self.last_connect_session_id = None
        self.last_external_group_id = None
        self.last_reconnect = False
        self.complete_error: tuple[str, str, int] | None = None
        self.provision_error: tuple[str, str, int] | None = None

    def build_connect_url(self) -> str:
        return "https://oauth.groupme.com/oauth/authorize?client_id=client-123&response_type=token"

    def create_connect_session(self, *, user_id: str, access_token: str) -> GroupMeConnectSession:
        if self.complete_error is not None:
            code, message, status_code = self.complete_error
            raise _management_error(code=code, message=message, status_code=status_code)
        return GroupMeConnectSession(
            connect_session_id="session-123",
            provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
            status="authorized",
        )

    def list_destinations(self, *, user_id: str, connect_session_id: str):
        self.last_connect_session_id = connect_session_id
        return [
            SupportChannelDestination(id="group-1", name="Group One"),
            SupportChannelDestination(
                id="group-2",
                name="Group Two",
                description="close friends",
                group_type="private",
            ),
        ]

    def provision_channel(
        self,
        *,
        user_id: str,
        connect_session_id: str,
        external_group_id: str,
        reconnect: bool,
    ) -> ProvisionedGroupMeChannel:
        self.last_connect_session_id = connect_session_id
        self.last_external_group_id = external_group_id
        self.last_reconnect = reconnect
        if self.provision_error is not None:
            code, message, status_code = self.provision_error
            raise _management_error(code=code, message=message, status_code=status_code)
        name = "Group One" if external_group_id == "group-1" else "Group Two"
        return ProvisionedGroupMeChannel(
            provider_config_ref="groupme:config:Y29uZmlnLTE",
            external_group_id=external_group_id,
            external_group_name=name,
        )


class _FakeRepository:
    def __init__(self) -> None:
        self.current: SupportChannelRecord | None = None
        self.attempts = []
        self.provider_configs = {}

    def get_current_support_channel(self, *, user_id: str) -> SupportChannelRecord | None:
        if self.current is None or self.current.user_id != user_id:
            return None
        return self.current

    def create_support_channel(
        self,
        *,
        user_id: str,
        provider: str,
        status: str,
        enabled: bool,
        external_group_id: str | None,
        external_group_name: str | None,
        provider_config_ref: str | None,
        default_message: str,
    ) -> SupportChannelRecord:
        self.current = SupportChannelRecord(
            id="channel-123",
            user_id=user_id,
            provider=provider,
            status=status,
            enabled=enabled,
            external_group_id=external_group_id,
            external_group_name=external_group_name,
            provider_config_ref=provider_config_ref,
            default_message=default_message,
        )
        return self.current

    def update_support_channel(
        self,
        *,
        support_channel_id: str,
        user_id: str,
        patch: dict[str, object],
    ) -> SupportChannelRecord | None:
        if self.current is None:
            return None
        if self.current.id != support_channel_id or self.current.user_id != user_id:
            return None
        self.current = replace(self.current, **patch)
        return self.current

    def get_support_channel(self, *, support_channel_id: str, user_id: str):
        if self.current is None:
            return None
        if self.current.id == support_channel_id and self.current.user_id == user_id:
            return self.current
        return None

    def insert_delivery_attempt(self, attempt):
        self.attempts.append(attempt)
        return {"id": "attempt-1"}

    def update_last_delivery(
        self,
        *,
        support_channel_id: str,
        user_id: str,
        status: str,
        delivered_at: str | None,
        error_code: str | None,
        error_message_safe: str | None,
    ) -> None:
        if self.current is None:
            raise AssertionError("Channel must exist before updating delivery status.")
        self.current = replace(
            self.current,
            last_delivery_status=status,
            last_delivery_at=delivered_at,
            last_error_code=error_code,
            last_error_message_safe=error_message_safe,
        )

    def get_provider_config(self, *, provider_config_id: str, user_id: str):
        record = self.provider_configs.get(provider_config_id)
        if record is None or record.user_id != user_id:
            return None
        return record


class _FakeProvider:
    def __init__(self) -> None:
        self.result = None
        self.was_called = False

    def send_message(self, *, provider_config, send_request):
        self.was_called = True
        if self.result is None:
            raise AssertionError("Provider result was not configured for this test.")
        return self.result


def _build_channel(
    *,
    enabled: bool,
    status: str,
    provider_config_ref: str | None,
    external_group_name: str = "Flare Support",
    last_delivery_status: str | None = None,
    last_delivery_at: str | None = None,
) -> SupportChannelRecord:
    return SupportChannelRecord(
        id="channel-123",
        user_id="user-123",
        provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
        status=status,
        enabled=enabled,
        external_group_id="group-123",
        external_group_name=external_group_name,
        provider_config_ref=provider_config_ref,
        default_message="Luke sent a Flare and may need support. Please check in when you can.",
        last_delivery_status=last_delivery_status,
        last_delivery_at=last_delivery_at,
    )


def _build_provider_config(*, bot_id: str):
    from backend.app.domain.support_channels import SupportChannelProviderConfigRecord

    return SupportChannelProviderConfigRecord(
        id="config-1",
        user_id="user-123",
        provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
        status="provisioned",
        access_token="access-token-stored",
        bot_id=bot_id,
    )


def _management_error(*, code: str, message: str, status_code: int):
    from backend.app.services.support_channel_management import SupportChannelManagementError

    return SupportChannelManagementError(code=code, message=message, status_code=status_code)
