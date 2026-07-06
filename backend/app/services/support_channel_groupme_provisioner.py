from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from backend.app.services.support_channel_management import ProvisionedGroupMeChannel
from backend.app.services.support_channel_provider_config import ProviderConfigRef


class GroupMeBotManagerLike(Protocol):
    def ensure_bot(
        self,
        *,
        user_id: str,
        connect_token: str,
        external_group_id: str,
        external_group_name: str | None,
        reconnect: bool,
    ) -> str:
        ...


@dataclass(frozen=True)
class GroupMeChannelProvisioner:
    bot_manager: GroupMeBotManagerLike

    def provision_channel(
        self,
        *,
        user_id: str,
        connect_token: str,
        external_group_id: str,
        external_group_name: str | None,
        reconnect: bool,
    ) -> ProvisionedGroupMeChannel:
        bot_id = self.bot_manager.ensure_bot(
            user_id=user_id,
            connect_token=connect_token,
            external_group_id=external_group_id,
            external_group_name=external_group_name,
            reconnect=reconnect,
        )
        return ProvisionedGroupMeChannel(
            provider_config_ref=ProviderConfigRef.for_groupme_bot(bot_id=bot_id).raw,
            external_group_id=external_group_id,
            external_group_name=external_group_name,
        )


class UnconfiguredGroupMeBotManager:
    def ensure_bot(
        self,
        *,
        user_id: str,
        connect_token: str,
        external_group_id: str,
        external_group_name: str | None,
        reconnect: bool,
    ) -> str:
        raise RuntimeError(
            "GroupMe bot provisioning is not configured for this runtime yet."
        )
