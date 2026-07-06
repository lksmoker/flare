from __future__ import annotations

import unittest

from backend.app.domain.support_channels import (
    GROUPME_TEST_MESSAGE,
    SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED,
    SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED,
    SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    SupportChannelRecord,
    SupportChannelSendResult,
)
from backend.app.integrations.groupme_provider import GroupMeProviderConfig
from backend.app.services.support_channel_provider_config import ProviderConfigResolver
from backend.app.services.support_channel_sender import (
    SendSupportChannelTestMessageCommand,
    SupportChannelSender,
)


class SupportChannelSenderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.channel = SupportChannelRecord(
            id="channel-123",
            user_id="user-123",
            provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
            status="connected",
            enabled=True,
            external_group_id="group-123",
            external_group_name="Flare Test Group",
            provider_config_ref="groupme:bot:Ym90LTEyMw",
            default_message="Luke sent a Flare and may need support. Please check in when you can.",
        )

    def test_send_test_message_success_records_sent_attempt(self) -> None:
        repository = _FakeRepository(channel=self.channel)
        provider = _FakeProvider(
            result=SupportChannelSendResult(
                ok=True,
                provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
                send_kind="test",
                status=SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
                attempted_at="2026-07-06T02:00:00Z",
                delivered_at="2026-07-06T02:00:00Z",
                support_channel_id=self.channel.id,
                user_id=self.channel.user_id,
                destination_id=self.channel.external_group_id,
                destination_name=self.channel.external_group_name,
                message_snapshot=GROUPME_TEST_MESSAGE,
                provider_message_id="provider-msg-1",
                error_code=None,
                error_message_safe=None,
                raw_provider_status_ref="http_status:202",
            )
        )
        sender = SupportChannelSender(
            repository=repository,
            groupme_provider=provider,
            provider_config_resolver=ProviderConfigResolver(),
        )

        result = sender.send_test_message(
            SendSupportChannelTestMessageCommand(
                support_channel_id=self.channel.id,
                user_id=self.channel.user_id,
            )
        )

        self.assertTrue(result.ok)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_SENT, result.status)
        self.assertEqual(1, len(repository.attempts))
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_SENT, repository.attempts[0].status)
        self.assertEqual(GROUPME_TEST_MESSAGE, repository.attempts[0].message_snapshot)
        self.assertEqual(
            {
                "support_channel_id": self.channel.id,
                "user_id": self.channel.user_id,
                "status": SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
                "delivered_at": "2026-07-06T02:00:00Z",
                "error_code": None,
                "error_message_safe": None,
            },
            repository.last_update,
        )
        self.assertEqual("bot-123", provider.last_bot_id)

    def test_send_test_message_provider_failure_records_failed_attempt(self) -> None:
        repository = _FakeRepository(channel=self.channel)
        provider = _FakeProvider(
            result=SupportChannelSendResult(
                ok=False,
                provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
                send_kind="test",
                status=SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED,
                attempted_at="2026-07-06T02:00:00Z",
                delivered_at=None,
                support_channel_id=self.channel.id,
                user_id=self.channel.user_id,
                destination_id=self.channel.external_group_id,
                destination_name=self.channel.external_group_name,
                message_snapshot=GROUPME_TEST_MESSAGE,
                provider_message_id=None,
                error_code="groupme_http_500",
                error_message_safe="GroupMe rejected the test message.",
                raw_provider_status_ref="http_status:500",
            )
        )
        sender = SupportChannelSender(
            repository=repository,
            groupme_provider=provider,
            provider_config_resolver=ProviderConfigResolver(),
        )

        result = sender.send_test_message(
            SendSupportChannelTestMessageCommand(
                support_channel_id=self.channel.id,
                user_id=self.channel.user_id,
            )
        )

        self.assertFalse(result.ok)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED, result.status)
        self.assertEqual(1, len(repository.attempts))
        self.assertEqual("groupme_http_500", repository.attempts[0].error_code)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED, repository.last_update["status"])

    def test_send_test_message_blocked_config_records_blocked_attempt_without_provider_call(
        self,
    ) -> None:
        blocked_channel = SupportChannelRecord(
            id=self.channel.id,
            user_id=self.channel.user_id,
            provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
            status="disabled",
            enabled=False,
            external_group_id=self.channel.external_group_id,
            external_group_name=self.channel.external_group_name,
            provider_config_ref=None,
            default_message=self.channel.default_message,
        )
        repository = _FakeRepository(channel=blocked_channel)
        provider = _FakeProvider(result=None)
        sender = SupportChannelSender(
            repository=repository,
            groupme_provider=provider,
            provider_config_resolver=ProviderConfigResolver(),
        )

        result = sender.send_test_message(
            SendSupportChannelTestMessageCommand(
                support_channel_id=blocked_channel.id,
                user_id=blocked_channel.user_id,
            )
        )

        self.assertFalse(result.ok)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED, result.status)
        self.assertEqual("support_channel_not_ready", result.error_code)
        self.assertFalse(provider.was_called)
        self.assertEqual(1, len(repository.attempts))
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED, repository.attempts[0].status)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED, repository.last_update["status"])

    def test_send_test_message_blocks_missing_provider_config_without_provider_call(self) -> None:
        disconnected_channel = SupportChannelRecord(
            id=self.channel.id,
            user_id=self.channel.user_id,
            provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
            status="connected",
            enabled=True,
            external_group_id=self.channel.external_group_id,
            external_group_name=self.channel.external_group_name,
            provider_config_ref=None,
            default_message=self.channel.default_message,
        )
        repository = _FakeRepository(channel=disconnected_channel)
        provider = _FakeProvider(result=None)
        sender = SupportChannelSender(
            repository=repository,
            groupme_provider=provider,
            provider_config_resolver=ProviderConfigResolver(),
        )

        result = sender.send_test_message(
            SendSupportChannelTestMessageCommand(
                support_channel_id=disconnected_channel.id,
                user_id=disconnected_channel.user_id,
            )
        )

        self.assertFalse(result.ok)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED, result.status)
        self.assertEqual("provider_config_unavailable", result.error_code)
        self.assertFalse(provider.was_called)


class _FakeRepository:
    def __init__(self, *, channel: SupportChannelRecord | None) -> None:
        self.channel = channel
        self.attempts = []
        self.last_update = None

    def get_support_channel(self, *, support_channel_id: str, user_id: str):
        if self.channel is None:
            return None
        if self.channel.id == support_channel_id and self.channel.user_id == user_id:
            return self.channel
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
        self.last_update = {
            "support_channel_id": support_channel_id,
            "user_id": user_id,
            "status": status,
            "delivered_at": delivered_at,
            "error_code": error_code,
            "error_message_safe": error_message_safe,
        }


class _FakeProvider:
    def __init__(self, *, result: SupportChannelSendResult | None) -> None:
        self.result = result
        self.was_called = False
        self.last_bot_id = None

    def send_message(self, *, provider_config: GroupMeProviderConfig, send_request):
        self.was_called = True
        self.last_bot_id = provider_config.bot_id
        if self.result is None:
            raise AssertionError("Provider should not have been called.")
        if send_request.message != GROUPME_TEST_MESSAGE:
            raise AssertionError(f"Unexpected message: {send_request.message!r}")
        return self.result
