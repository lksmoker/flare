from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from backend.app.domain.support_channels import (
    GROUPME_TEST_MESSAGE,
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    SUPPORT_CHANNEL_SEND_KIND_TEST,
    SUPPORT_CHANNEL_STATUS_CONNECTED,
    DeliveryAttemptRecord,
    GroupMeRuntimeConfig,
    SupportChannelRecord,
    SupportChannelSendRequest,
    SupportChannelSendResult,
    build_blocked_result,
)
from backend.app.integrations.groupme_provider import GroupMeProvider, GroupMeProviderConfig


class SupportChannelRepositoryLike(Protocol):
    def get_support_channel(
        self,
        *,
        support_channel_id: str,
        user_id: str,
    ) -> SupportChannelRecord | None:
        ...

    def insert_delivery_attempt(self, attempt: DeliveryAttemptRecord) -> dict[str, object]:
        ...

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
        ...


@dataclass(frozen=True)
class SendSupportChannelTestMessageCommand:
    support_channel_id: str
    user_id: str


class SupportChannelSender:
    def __init__(
        self,
        *,
        repository: SupportChannelRepositoryLike,
        groupme_provider: GroupMeProvider,
        groupme_config: GroupMeRuntimeConfig,
    ) -> None:
        self._repository = repository
        self._groupme_provider = groupme_provider
        self._groupme_config = groupme_config

    def send_test_message(
        self,
        command: SendSupportChannelTestMessageCommand,
    ) -> SupportChannelSendResult:
        channel = self._repository.get_support_channel(
            support_channel_id=command.support_channel_id,
            user_id=command.user_id,
        )
        if channel is None:
            result = build_blocked_result(
                provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
                user_id=command.user_id,
                support_channel_id=command.support_channel_id,
                destination_id=None,
                destination_name=None,
                message=GROUPME_TEST_MESSAGE,
                error_code="support_channel_not_found",
                error_message_safe="Support channel could not be found for this user.",
                blocked_reason="missing_channel",
            )
            self._record_attempt(result)
            return result

        blocked = self._validate_channel(channel)
        if blocked is not None:
            self._record_attempt(blocked)
            self._update_channel(channel, blocked)
            return blocked

        send_request = SupportChannelSendRequest(
            support_channel_id=channel.id,
            user_id=channel.user_id,
            provider=channel.provider,
            destination_id=channel.external_group_id or self._groupme_config.test_group_id,
            destination_name=channel.external_group_name or self._groupme_config.test_group_name,
            message=GROUPME_TEST_MESSAGE,
            send_kind=SUPPORT_CHANNEL_SEND_KIND_TEST,
        )
        result = self._groupme_provider.send_message(
            provider_config=GroupMeProviderConfig(bot_id=self._groupme_config.test_bot_id),
            send_request=send_request,
        )
        self._record_attempt(result)
        self._update_channel(channel, result)
        return result

    def _validate_channel(
        self,
        channel: SupportChannelRecord,
    ) -> SupportChannelSendResult | None:
        if channel.provider != SUPPORT_CHANNEL_PROVIDER_GROUPME:
            return build_blocked_result(
                provider=channel.provider,
                user_id=channel.user_id,
                support_channel_id=channel.id,
                destination_id=channel.external_group_id,
                destination_name=channel.external_group_name,
                message=GROUPME_TEST_MESSAGE,
                error_code="unsupported_provider",
                error_message_safe="Only GroupMe test sending is available for this spike.",
                blocked_reason="provider_not_groupme",
            )
        if not channel.enabled or channel.status != SUPPORT_CHANNEL_STATUS_CONNECTED:
            return build_blocked_result(
                provider=channel.provider,
                user_id=channel.user_id,
                support_channel_id=channel.id,
                destination_id=channel.external_group_id,
                destination_name=channel.external_group_name,
                message=GROUPME_TEST_MESSAGE,
                error_code="support_channel_not_ready",
                error_message_safe="Support channel must be enabled and connected before testing.",
                blocked_reason="channel_not_enabled_or_connected",
            )
        if not channel.external_group_id:
            return build_blocked_result(
                provider=channel.provider,
                user_id=channel.user_id,
                support_channel_id=channel.id,
                destination_id=channel.external_group_id,
                destination_name=channel.external_group_name,
                message=GROUPME_TEST_MESSAGE,
                error_code="destination_missing",
                error_message_safe="Support channel is missing a destination group.",
                blocked_reason="missing_destination",
            )
        if channel.external_group_id != self._groupme_config.test_group_id:
            return build_blocked_result(
                provider=channel.provider,
                user_id=channel.user_id,
                support_channel_id=channel.id,
                destination_id=channel.external_group_id,
                destination_name=channel.external_group_name,
                message=GROUPME_TEST_MESSAGE,
                error_code="groupme_test_group_mismatch",
                error_message_safe="Saved support channel does not match the dedicated GroupMe test group.",
                blocked_reason="group_mismatch",
            )
        return None

    def _record_attempt(self, result: SupportChannelSendResult) -> None:
        self._repository.insert_delivery_attempt(DeliveryAttemptRecord.from_result(result))

    def _update_channel(
        self,
        channel: SupportChannelRecord,
        result: SupportChannelSendResult,
    ) -> None:
        self._repository.update_last_delivery(
            support_channel_id=channel.id,
            user_id=channel.user_id,
            status=result.status,
            delivered_at=result.delivered_at,
            error_code=result.error_code,
            error_message_safe=result.error_message_safe,
        )
