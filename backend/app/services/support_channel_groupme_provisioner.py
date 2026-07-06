from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from backend.app.domain.support_channels import (
    SUPPORT_CHANNEL_PROVIDER_CONFIG_STATUS_AUTHORIZED,
    SUPPORT_CHANNEL_PROVIDER_CONFIG_STATUS_PROVISIONED,
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    GroupMeConnectSession,
    SupportChannelDestination,
    SupportChannelProviderConfigRecord,
)
from backend.app.integrations.groupme_provider import (
    GroupMeApiError,
    GroupMeProvider,
)
from backend.app.services.support_channel_config import (
    GroupMeBotProvisioningConfig,
    GroupMeOAuthConfig,
)
from backend.app.services.support_channel_management import (
    ProvisionedGroupMeChannel,
    SupportChannelManagementError,
)
from backend.app.services.support_channel_provider_config import ProviderConfigRef


class GroupMeProviderConfigRepositoryLike(Protocol):
    def create_provider_config(
        self,
        *,
        user_id: str,
        provider: str,
        status: str,
        access_token: str,
        provider_user_id: str | None,
        provider_user_name: str | None,
    ) -> SupportChannelProviderConfigRecord:
        ...

    def get_provider_config(
        self,
        *,
        provider_config_id: str,
        user_id: str,
    ) -> SupportChannelProviderConfigRecord | None:
        ...

    def update_provider_config(
        self,
        *,
        provider_config_id: str,
        user_id: str,
        patch: dict[str, object],
    ) -> SupportChannelProviderConfigRecord | None:
        ...


class GroupMeBotManagerLike(Protocol):
    def ensure_bot(
        self,
        *,
        access_token: str,
        external_group_id: str,
    ) -> str:
        ...


@dataclass(frozen=True)
class GroupMeBotManager:
    provider: GroupMeProvider
    config: GroupMeBotProvisioningConfig

    def ensure_bot(
        self,
        *,
        access_token: str,
        external_group_id: str,
    ) -> str:
        return self.provider.create_bot(
            access_token=access_token,
            group_id=external_group_id,
            bot_name=self.config.bot_name,
            callback_url=self.config.callback_url,
            avatar_url=self.config.avatar_url,
        )


@dataclass(frozen=True)
class GroupMeChannelProvisioner:
    provider: GroupMeProvider
    repository: GroupMeProviderConfigRepositoryLike
    oauth_config: GroupMeOAuthConfig
    bot_manager: GroupMeBotManagerLike

    def build_connect_url(self) -> str:
        return self.provider.build_oauth_authorize_url(
            client_id=self.oauth_config.client_id,
            redirect_uri=self.oauth_config.redirect_url,
        )

    def create_connect_session(
        self,
        *,
        user_id: str,
        access_token: str,
    ) -> GroupMeConnectSession:
        try:
            user = self.provider.get_authenticated_user(access_token=access_token)
        except GroupMeApiError as exc:
            raise SupportChannelManagementError(
                code=exc.code,
                message=exc.message,
                status_code=exc.status_code,
            ) from exc
        record = self.repository.create_provider_config(
            user_id=user_id,
            provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
            status=SUPPORT_CHANNEL_PROVIDER_CONFIG_STATUS_AUTHORIZED,
            access_token=access_token,
            provider_user_id=user.user_id,
            provider_user_name=user.name,
        )
        return GroupMeConnectSession(
            connect_session_id=record.id,
            provider=record.provider,
            status=record.status,
        )

    def list_destinations(
        self,
        *,
        user_id: str,
        connect_session_id: str,
    ) -> list[SupportChannelDestination]:
        record = self._require_connect_session(
            user_id=user_id,
            connect_session_id=connect_session_id,
        )
        try:
            return self.provider.list_groups(access_token=record.access_token)
        except GroupMeApiError as exc:
            raise SupportChannelManagementError(
                code=exc.code,
                message=exc.message,
                status_code=exc.status_code,
            ) from exc

    def provision_channel(
        self,
        *,
        user_id: str,
        connect_session_id: str,
        external_group_id: str,
        reconnect: bool,
    ) -> ProvisionedGroupMeChannel:
        record = self._require_connect_session(
            user_id=user_id,
            connect_session_id=connect_session_id,
        )
        try:
            destinations = self.provider.list_groups(access_token=record.access_token)
        except GroupMeApiError as exc:
            raise SupportChannelManagementError(
                code=exc.code,
                message=exc.message,
                status_code=exc.status_code,
            ) from exc
        destination = next((item for item in destinations if item.id == external_group_id), None)
        if destination is None:
            raise SupportChannelManagementError(
                code="destination_not_found",
                message="Selected GroupMe destination was not found for this authorization.",
                status_code=400,
            )
        try:
            bot_id = self.bot_manager.ensure_bot(
                access_token=record.access_token,
                external_group_id=external_group_id,
            )
        except GroupMeApiError as exc:
            raise SupportChannelManagementError(
                code=exc.code,
                message=exc.message,
                status_code=exc.status_code,
            ) from exc
        updated = self.repository.update_provider_config(
            provider_config_id=record.id,
            user_id=user_id,
            patch={
                "status": SUPPORT_CHANNEL_PROVIDER_CONFIG_STATUS_PROVISIONED,
                "bot_id": bot_id,
                "external_group_id": external_group_id,
                "external_group_name": destination.name,
            },
        )
        if updated is None:
            action = "reconnected" if reconnect else "configured"
            raise SupportChannelManagementError(
                code="provider_config_update_failed",
                message=f"Support channel provider config could not be {action}.",
                status_code=500,
            )
        return ProvisionedGroupMeChannel(
            provider_config_ref=ProviderConfigRef.for_groupme_config(provider_config_id=updated.id).raw,
            external_group_id=external_group_id,
            external_group_name=destination.name,
        )

    def _require_connect_session(
        self,
        *,
        user_id: str,
        connect_session_id: str,
    ) -> SupportChannelProviderConfigRecord:
        record = self.repository.get_provider_config(
            provider_config_id=connect_session_id,
            user_id=user_id,
        )
        if record is None or record.provider != SUPPORT_CHANNEL_PROVIDER_GROUPME:
            raise SupportChannelManagementError(
                code="connect_session_not_found",
                message="GroupMe connect session could not be found for this user.",
                status_code=404,
            )
        if record.status not in (
            SUPPORT_CHANNEL_PROVIDER_CONFIG_STATUS_AUTHORIZED,
            SUPPORT_CHANNEL_PROVIDER_CONFIG_STATUS_PROVISIONED,
        ):
            raise SupportChannelManagementError(
                code="connect_session_invalid",
                message="GroupMe connect session is not available for provisioning.",
                status_code=409,
            )
        return record
