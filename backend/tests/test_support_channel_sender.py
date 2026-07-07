from __future__ import annotations

import unittest
from dataclasses import replace

from backend.app.domain.support_channels import (
    GROUPME_TEST_MESSAGE,
    SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED,
    SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED,
    SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    SUPPORT_CHANNEL_SEND_KIND_REAL,
    SupportChannelRecord,
    SupportChannelSendResult,
)
from backend.app.integrations.groupme_provider import GroupMeProviderConfig
from backend.app.services.support_channel_provider_config import ProviderConfigResolver
from backend.app.services.support_channel_sender import (
    SendSupportChannelRealMessageCommand,
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
                flare_event_id=None,
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
                flare_event_id=None,
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

    def test_send_test_message_blocks_missing_bot_id_without_provider_call(self) -> None:
        connected_channel = SupportChannelRecord(
            id=self.channel.id,
            user_id=self.channel.user_id,
            provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
            status="connected",
            enabled=True,
            external_group_id=self.channel.external_group_id,
            external_group_name=self.channel.external_group_name,
            provider_config_ref="groupme:config:Y29uZmlnLTE",
            default_message=self.channel.default_message,
        )
        repository = _FakeRepository(channel=connected_channel)
        provider = _FakeProvider(result=None)
        sender = SupportChannelSender(
            repository=repository,
            groupme_provider=provider,
            provider_config_resolver=ProviderConfigResolver(repository=_FakeProviderConfigRepository(bot_id=None)),
        )

        result = sender.send_test_message(
            SendSupportChannelTestMessageCommand(
                support_channel_id=connected_channel.id,
                user_id=connected_channel.user_id,
            )
        )

        self.assertFalse(result.ok)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED, result.status)
        self.assertEqual("provider_bot_missing", result.error_code)
        self.assertFalse(provider.was_called)

    def test_send_real_message_success_persists_real_attempt(self) -> None:
        repository = _FakeRepository(channel=self.channel)
        provider = _FakeProvider(
            result=SupportChannelSendResult(
                ok=True,
                provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
                send_kind=SUPPORT_CHANNEL_SEND_KIND_REAL,
                status=SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
                attempted_at="2026-07-06T02:30:00Z",
                delivered_at="2026-07-06T02:30:00Z",
                support_channel_id=self.channel.id,
                user_id=self.channel.user_id,
                destination_id=self.channel.external_group_id,
                destination_name=self.channel.external_group_name,
                message_snapshot=self.channel.default_message,
                provider_message_id="provider-msg-2",
                error_code=None,
                error_message_safe=None,
                raw_provider_status_ref="http_status:202",
                flare_event_id="event-123",
            )
        )
        sender = SupportChannelSender(
            repository=repository,
            groupme_provider=provider,
            provider_config_resolver=ProviderConfigResolver(),
        )

        result = sender.send_real_message(
            SendSupportChannelRealMessageCommand(
                support_channel_id=self.channel.id,
                user_id=self.channel.user_id,
                flare_event_id="event-123",
            )
        )

        self.assertTrue(result.ok)
        self.assertEqual(SUPPORT_CHANNEL_SEND_KIND_REAL, result.send_kind)
        self.assertEqual(1, len(repository.attempts))
        self.assertEqual(SUPPORT_CHANNEL_SEND_KIND_REAL, repository.attempts[0].send_kind)
        self.assertEqual("event-123", repository.attempts[0].flare_event_id)
        self.assertEqual(self.channel.default_message, repository.attempts[0].message_snapshot)

    def test_send_real_message_disabled_channel_records_blocked_real_attempt(self) -> None:
        blocked_channel = SupportChannelRecord(
            id=self.channel.id,
            user_id=self.channel.user_id,
            provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
            status="disabled",
            enabled=False,
            external_group_id=self.channel.external_group_id,
            external_group_name=self.channel.external_group_name,
            provider_config_ref="groupme:config:Y29uZmlnLTE",
            default_message=self.channel.default_message,
        )
        repository = _FakeRepository(channel=blocked_channel)
        provider = _FakeProvider(result=None)
        sender = SupportChannelSender(
            repository=repository,
            groupme_provider=provider,
            provider_config_resolver=ProviderConfigResolver(),
        )

        result = sender.send_real_message(
            SendSupportChannelRealMessageCommand(
                support_channel_id=blocked_channel.id,
                user_id=blocked_channel.user_id,
            )
        )

        self.assertFalse(result.ok)
        self.assertEqual(SUPPORT_CHANNEL_DELIVERY_STATUS_BLOCKED, result.status)
        self.assertEqual("support_channel_disabled", result.error_code)
        self.assertEqual(SUPPORT_CHANNEL_SEND_KIND_REAL, repository.attempts[0].send_kind)
        self.assertFalse(provider.was_called)

    def test_send_real_message_reuses_persisted_provider_config_bot_id(self) -> None:
        repository = _FakeRepository(channel=replace(self.channel, provider_config_ref="groupme:config:Y29uZmlnLTE"))
        provider = _FakeProvider(
            result=SupportChannelSendResult(
                ok=True,
                provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
                send_kind=SUPPORT_CHANNEL_SEND_KIND_REAL,
                status=SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
                attempted_at="2026-07-06T02:30:00Z",
                delivered_at="2026-07-06T02:30:00Z",
                support_channel_id=self.channel.id,
                user_id=self.channel.user_id,
                destination_id=self.channel.external_group_id,
                destination_name=self.channel.external_group_name,
                message_snapshot=self.channel.default_message,
                provider_message_id="provider-msg-2",
                error_code=None,
                error_message_safe=None,
                raw_provider_status_ref="http_status:202",
                flare_event_id="event-123",
            )
        )
        sender = SupportChannelSender(
            repository=repository,
            groupme_provider=provider,
            provider_config_resolver=ProviderConfigResolver(
                repository=_FakeProviderConfigRepository(bot_id="persisted-bot-9")
            ),
        )

        sender.send_real_message(
            SendSupportChannelRealMessageCommand(
                support_channel_id=self.channel.id,
                user_id=self.channel.user_id,
                flare_event_id="event-123",
            )
        )

        self.assertEqual("persisted-bot-9", provider.last_bot_id)


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
        expected_message = (
            GROUPME_TEST_MESSAGE
            if send_request.send_kind == "test"
            else self.result.message_snapshot
        )
        if send_request.message != expected_message:
            raise AssertionError(f"Unexpected message: {send_request.message!r}")
        return self.result


class _FakeProviderConfigRepository:
    def __init__(self, *, bot_id: str | None) -> None:
        self.bot_id = bot_id

    def get_provider_config(self, *, provider_config_id: str, user_id: str):
        from backend.app.domain.support_channels import SupportChannelProviderConfigRecord

        return SupportChannelProviderConfigRecord(
            id=provider_config_id,
            user_id=user_id,
            provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
            status="provisioned",
            access_token="access-token-stored",
            bot_id=self.bot_id,
        )
