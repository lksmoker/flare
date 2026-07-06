from __future__ import annotations

import unittest
from urllib import error

from backend.app.domain.support_channels import (
    SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED,
    SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
    SupportChannelSendRequest,
)
from backend.app.integrations.groupme_provider import (
    GROUPME_BOT_POST_URL,
    GROUPME_BOTS_URL,
    GROUPME_GROUPS_URL,
    GROUPME_USER_ME_URL,
    GroupMeApiError,
    GroupMeProvider,
    GroupMeProviderConfig,
)


class GroupMeProviderTests(unittest.TestCase):
    def test_send_message_posts_expected_payload_and_normalizes_success(self) -> None:
        transport = _FakeTransport(
            responses={("POST", GROUPME_BOT_POST_URL): {"meta": {"request_id": "request-123"}}}
        )
        provider = GroupMeProvider(transport=transport)

        result = provider.send_message(
            provider_config=GroupMeProviderConfig(bot_id="bot-123"),
            send_request=_build_request(),
        )

        self.assertEqual(
            {
                "method": "POST",
                "url": GROUPME_BOT_POST_URL,
                "payload": {
                    "bot_id": "bot-123",
                    "text": "TEST FLARE: Luke is testing Flare support notifications. No action is needed.",
                },
            },
            transport.last_request,
        )
        self.assertTrue(result.ok)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_SENT, result.status)
        self.assertEqual("request-123", result.provider_message_id)

    def test_send_message_normalizes_http_failure(self) -> None:
        transport = _FakeTransport(http_errors={("POST", GROUPME_BOT_POST_URL): 429})
        provider = GroupMeProvider(transport=transport)

        result = provider.send_message(
            provider_config=GroupMeProviderConfig(bot_id="bot-123"),
            send_request=_build_request(),
        )

        self.assertFalse(result.ok)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED, result.status)
        self.assertEqual("groupme_http_429", result.error_code)

    def test_get_authenticated_user_returns_safe_profile(self) -> None:
        transport = _FakeTransport(
            responses={
                ("GET", GROUPME_USER_ME_URL): {
                    "response": {"user": {"id": "groupme-user-1", "name": "Luke"}}
                }
            }
        )
        provider = GroupMeProvider(transport=transport)

        user = provider.get_authenticated_user(access_token="access-token-1")

        self.assertEqual("groupme-user-1", user.user_id)
        self.assertEqual("Luke", user.name)
        self.assertEqual("access-token-1", transport.last_headers["X-Access-Token"])

    def test_list_groups_loads_multiple_pages(self) -> None:
        first_page = {
            "response": [{"id": f"group-{index}", "name": f"Group {index}"} for index in range(100)]
        }
        second_page = {"response": [{"id": "group-100", "name": "Group 100"}]}
        transport = _FakeTransport(
            responses={
                ("GET", f"{GROUPME_GROUPS_URL}?page=1&per_page=100"): first_page,
                ("GET", f"{GROUPME_GROUPS_URL}?page=2&per_page=100"): second_page,
            }
        )
        provider = GroupMeProvider(transport=transport)

        destinations = provider.list_groups(access_token="access-token-2")

        self.assertEqual(101, len(destinations))
        self.assertEqual("group-100", destinations[-1].id)

    def test_create_bot_returns_groupme_bot_id(self) -> None:
        transport = _FakeTransport(
            responses={
                ("POST", GROUPME_BOTS_URL): {
                    "response": {"bot": {"bot_id": "bot-live-1"}}
                }
            }
        )
        provider = GroupMeProvider(transport=transport)

        bot_id = provider.create_bot(
            access_token="access-token-3",
            group_id="group-123",
            bot_name="Flare Bot",
            callback_url=None,
            avatar_url=None,
        )

        self.assertEqual("bot-live-1", bot_id)
        self.assertEqual("group-123", transport.last_request["payload"]["bot"]["group_id"])

    def test_invalid_auth_raises_groupme_api_error(self) -> None:
        transport = _FakeTransport(http_errors={("GET", GROUPME_USER_ME_URL): 401})
        provider = GroupMeProvider(transport=transport)

        with self.assertRaises(GroupMeApiError) as raised:
            provider.get_authenticated_user(access_token="bad-token")

        self.assertEqual("groupme_auth_invalid", raised.exception.code)
        self.assertEqual(401, raised.exception.status_code)


def _build_request() -> SupportChannelSendRequest:
    return SupportChannelSendRequest(
        support_channel_id="channel-123",
        user_id="user-123",
        provider="groupme",
        destination_id="group-123",
        destination_name="Flare Test Group",
        message="TEST FLARE: Luke is testing Flare support notifications. No action is needed.",
        send_kind="test",
    )


class _FakeTransport:
    def __init__(
        self,
        *,
        responses: dict[tuple[str, str], dict[str, object] | None] | None = None,
        http_errors: dict[tuple[str, str], int] | None = None,
    ) -> None:
        self.responses = responses or {}
        self.http_errors = http_errors or {}
        self.last_request = None
        self.last_headers = None

    def request_json(self, *, method: str, url: str, payload, headers):
        self.last_request = {"method": method, "url": url, "payload": payload}
        self.last_headers = headers
        key = (method, url)
        if key in self.http_errors:
            raise error.HTTPError(url, self.http_errors[key], "error", {}, None)
        return self.responses.get(key)
