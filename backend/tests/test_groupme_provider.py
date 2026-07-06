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
    GroupMeProvider,
    GroupMeProviderConfig,
)


class GroupMeProviderTests(unittest.TestCase):
    def test_send_message_posts_expected_payload_and_normalizes_success(self) -> None:
        transport = _FakeTransport(response={"meta": {"request_id": "request-123"}})
        provider = GroupMeProvider(transport=transport)

        result = provider.send_message(
            provider_config=GroupMeProviderConfig(bot_id="bot-123"),
            send_request=_build_request(),
        )

        self.assertEqual(
            {
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
        transport = _FakeTransport(http_error_code=429)
        provider = GroupMeProvider(transport=transport)

        result = provider.send_message(
            provider_config=GroupMeProviderConfig(bot_id="bot-123"),
            send_request=_build_request(),
        )

        self.assertFalse(result.ok)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED, result.status)
        self.assertEqual("groupme_http_429", result.error_code)


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
        response: dict[str, object] | None = None,
        http_error_code: int | None = None,
    ) -> None:
        self.response = response
        self.http_error_code = http_error_code
        self.last_request = None

    def post_json(self, url: str, payload: dict[str, str]):
        self.last_request = {"url": url, "payload": payload}
        if self.http_error_code is not None:
            raise error.HTTPError(url, self.http_error_code, "error", {}, None)
        return self.response
