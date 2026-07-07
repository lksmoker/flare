from __future__ import annotations

import unittest
from dataclasses import replace

from backend.app.domain.support_channels import (
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    SUPPORT_CHANNEL_STATUS_CONNECTED,
    SUPPORT_CHANNEL_STATUS_DISABLED,
    SupportChannelRecord,
)
from backend.app.services.support_channel_management import (
    ConfigureSupportChannelCommand,
    ProvisionedGroupMeChannel,
    ReconnectSupportChannelCommand,
    SupportChannelManager,
)


class SupportChannelManagerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = _FakeRepository()
        self.onboarding = _FakeOnboarding()
        self.manager = SupportChannelManager(
            repository=self.repository,
            groupme_onboarding=self.onboarding,
        )

    def test_configure_creates_one_active_channel_for_new_user(self) -> None:
        channel = self.manager.configure_groupme(
            ConfigureSupportChannelCommand(
                user_id="user-123",
                user_first_name="Luke",
                connect_session_id="session-123",
                external_group_id="group-1",
                default_message=" Please check in when you can. ",
                enabled=True,
            )
        )

        self.assertEqual(1, self.repository.create_calls)
        self.assertEqual(0, self.repository.update_calls)
        self.assertEqual("channel-1", channel.id)
        self.assertEqual(1, len(self.repository.channels_by_user["user-123"]))
        self.assertEqual("Please check in when you can.", channel.default_message)

    def test_reconfigure_updates_existing_channel_instead_of_creating_second_active_channel(self) -> None:
        original = self.manager.configure_groupme(
            ConfigureSupportChannelCommand(
                user_id="user-123",
                user_first_name="Luke",
                connect_session_id="session-123",
                external_group_id="group-1",
                default_message="First message",
                enabled=True,
            )
        )

        updated = self.manager.configure_groupme(
            ConfigureSupportChannelCommand(
                user_id="user-123",
                user_first_name="Luke",
                connect_session_id="session-456",
                external_group_id="group-2",
                default_message="Second message",
                enabled=True,
            )
        )

        self.assertEqual(1, self.repository.create_calls)
        self.assertEqual(1, self.repository.update_calls)
        self.assertEqual(original.id, updated.id)
        self.assertEqual(1, len(self.repository.channels_by_user["user-123"]))
        self.assertEqual("group-2", updated.external_group_id)
        self.assertEqual("Second message", updated.default_message)
        self.assertEqual("session-456", self.onboarding.last_connect_session_id)

    def test_reconnect_preserves_one_active_channel_invariant(self) -> None:
        original = self.manager.configure_groupme(
            ConfigureSupportChannelCommand(
                user_id="user-123",
                user_first_name="Luke",
                connect_session_id="session-123",
                external_group_id="group-1",
                default_message="First message",
                enabled=True,
            )
        )
        self.repository.channels_by_user["user-123"][0] = replace(
            original,
            enabled=False,
            status=SUPPORT_CHANNEL_STATUS_DISABLED,
        )

        updated = self.manager.reconnect_groupme(
            ReconnectSupportChannelCommand(
                user_id="user-123",
                user_first_name="Luke",
                connect_session_id="session-789",
                enabled=True,
            )
        )

        self.assertEqual(1, self.repository.create_calls)
        self.assertEqual(1, self.repository.update_calls)
        self.assertEqual(original.id, updated.id)
        self.assertEqual(1, len(self.repository.channels_by_user["user-123"]))
        self.assertTrue(updated.enabled)
        self.assertEqual(SUPPORT_CHANNEL_STATUS_CONNECTED, updated.status)
        self.assertTrue(self.onboarding.last_reconnect)

    def test_multiple_users_can_configure_same_group_without_sharing_channel_ownership(self) -> None:
        first = self.manager.configure_groupme(
            ConfigureSupportChannelCommand(
                user_id="user-123",
                user_first_name="Luke",
                connect_session_id="session-123",
                external_group_id="group-shared",
                default_message="First message",
                enabled=True,
            )
        )
        second = self.manager.configure_groupme(
            ConfigureSupportChannelCommand(
                user_id="user-456",
                user_first_name="Jane",
                connect_session_id="session-456",
                external_group_id="group-shared",
                default_message="Second message",
                enabled=True,
            )
        )

        self.assertNotEqual(first.id, second.id)
        self.assertEqual("user-123", first.user_id)
        self.assertEqual("user-456", second.user_id)
        self.assertEqual("group-shared", first.external_group_id)
        self.assertEqual("group-shared", second.external_group_id)
        self.assertEqual(1, len(self.repository.channels_by_user["user-123"]))
        self.assertEqual(1, len(self.repository.channels_by_user["user-456"]))
        self.assertNotEqual(first.provider_config_ref, second.provider_config_ref)


class _FakeOnboarding:
    def __init__(self) -> None:
        self.last_connect_session_id: str | None = None
        self.last_reconnect = False
        self._provision_count = 0

    def build_connect_url(self) -> str:
        return "https://oauth.groupme.com/oauth/authorize"

    def create_connect_session(self, *, user_id: str, access_token: str):
        raise NotImplementedError

    def list_destinations(self, *, user_id: str, connect_session_id: str):
        raise NotImplementedError

    def provision_channel(
        self,
        *,
        user_id: str,
        user_first_name: str | None,
        connect_session_id: str,
        external_group_id: str,
        reconnect: bool,
    ) -> ProvisionedGroupMeChannel:
        self.last_connect_session_id = connect_session_id
        self.last_reconnect = reconnect
        self._provision_count += 1
        return ProvisionedGroupMeChannel(
            provider_config_ref=f"groupme:config:config-{user_id}-{self._provision_count}",
            external_group_id=external_group_id,
            external_group_name=f"Group {external_group_id}",
        )


class _FakeRepository:
    def __init__(self) -> None:
        self.channels_by_user: dict[str, list[SupportChannelRecord]] = {}
        self.create_calls = 0
        self.update_calls = 0
        self._next_channel_id = 1

    def get_current_support_channel(self, *, user_id: str) -> SupportChannelRecord | None:
        channels = self.channels_by_user.get(user_id, [])
        return channels[0] if channels else None

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
        self.create_calls += 1
        channel = SupportChannelRecord(
            id=f"channel-{self._next_channel_id}",
            user_id=user_id,
            provider=provider,
            status=status,
            enabled=enabled,
            external_group_id=external_group_id,
            external_group_name=external_group_name,
            provider_config_ref=provider_config_ref,
            default_message=default_message,
        )
        self._next_channel_id += 1
        self.channels_by_user[user_id] = [channel]
        return channel

    def update_support_channel(
        self,
        *,
        support_channel_id: str,
        user_id: str,
        patch: dict[str, object],
    ) -> SupportChannelRecord | None:
        existing = self.get_current_support_channel(user_id=user_id)
        if existing is None or existing.id != support_channel_id:
            return None
        self.update_calls += 1
        updated = replace(existing, **patch)
        self.channels_by_user[user_id] = [updated]
        return updated

