from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from backend.app.domain.support_channels import (
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    SUPPORT_CHANNEL_STATUS_CONNECTED,
    SUPPORT_CHANNEL_STATUS_DISABLED,
    SupportChannelRecord,
)


class SupportChannelManagementRepositoryLike(Protocol):
    def get_current_support_channel(self, *, user_id: str) -> SupportChannelRecord | None:
        ...

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
        ...

    def update_support_channel(
        self,
        *,
        support_channel_id: str,
        user_id: str,
        patch: dict[str, Any],
    ) -> SupportChannelRecord | None:
        ...


@dataclass(frozen=True)
class ProvisionedGroupMeChannel:
    provider_config_ref: str
    external_group_id: str
    external_group_name: str | None


class GroupMeProvisionerLike(Protocol):
    def provision_channel(
        self,
        *,
        user_id: str,
        connect_token: str,
        external_group_id: str,
        external_group_name: str | None,
        reconnect: bool,
    ) -> ProvisionedGroupMeChannel:
        ...


@dataclass(frozen=True)
class ConfigureSupportChannelCommand:
    user_id: str
    connect_token: str
    external_group_id: str
    external_group_name: str | None
    default_message: str
    enabled: bool


@dataclass(frozen=True)
class ReconnectSupportChannelCommand:
    user_id: str
    connect_token: str
    external_group_id: str | None = None
    external_group_name: str | None = None
    default_message: str | None = None
    enabled: bool = True


class SupportChannelManagementError(RuntimeError):
    def __init__(self, *, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class SupportChannelManager:
    def __init__(
        self,
        *,
        repository: SupportChannelManagementRepositoryLike,
        groupme_provisioner: GroupMeProvisionerLike,
    ) -> None:
        self._repository = repository
        self._groupme_provisioner = groupme_provisioner

    def get_current_channel(self, *, user_id: str) -> SupportChannelRecord | None:
        return self._repository.get_current_support_channel(user_id=user_id)

    def configure_groupme(
        self,
        command: ConfigureSupportChannelCommand,
    ) -> SupportChannelRecord:
        self._require_non_empty(command.connect_token, "connect_token")
        self._require_non_empty(command.external_group_id, "external_group_id")
        self._require_non_empty(command.default_message, "default_message")
        provisioned = self._groupme_provisioner.provision_channel(
            user_id=command.user_id,
            connect_token=command.connect_token,
            external_group_id=command.external_group_id.strip(),
            external_group_name=_clean_optional_text(command.external_group_name),
            reconnect=False,
        )
        current = self._repository.get_current_support_channel(user_id=command.user_id)
        patch = {
            "provider": SUPPORT_CHANNEL_PROVIDER_GROUPME,
            "status": SUPPORT_CHANNEL_STATUS_CONNECTED,
            "enabled": command.enabled,
            "external_group_id": provisioned.external_group_id,
            "external_group_name": provisioned.external_group_name,
            "provider_config_ref": provisioned.provider_config_ref,
            "default_message": command.default_message.strip(),
        }
        if current is None:
            return self._repository.create_support_channel(
                user_id=command.user_id,
                provider=SUPPORT_CHANNEL_PROVIDER_GROUPME,
                status=SUPPORT_CHANNEL_STATUS_CONNECTED,
                enabled=command.enabled,
                external_group_id=provisioned.external_group_id,
                external_group_name=provisioned.external_group_name,
                provider_config_ref=provisioned.provider_config_ref,
                default_message=command.default_message.strip(),
            )
        updated = self._repository.update_support_channel(
            support_channel_id=current.id,
            user_id=command.user_id,
            patch=patch,
        )
        if updated is None:
            raise SupportChannelManagementError(
                code="support_channel_update_failed",
                message="Support channel could not be updated.",
                status_code=500,
            )
        return updated

    def reconnect_groupme(
        self,
        command: ReconnectSupportChannelCommand,
    ) -> SupportChannelRecord:
        current = self._repository.get_current_support_channel(user_id=command.user_id)
        if current is None:
            raise SupportChannelManagementError(
                code="support_channel_not_found",
                message="Support channel could not be found for this user.",
                status_code=404,
            )
        external_group_id = _clean_optional_text(command.external_group_id) or current.external_group_id
        if not external_group_id:
            raise SupportChannelManagementError(
                code="external_group_id_required",
                message="Support channel reconnect requires a saved or provided destination group.",
                status_code=400,
            )
        default_message = _clean_optional_text(command.default_message) or current.default_message
        self._require_non_empty(command.connect_token, "connect_token")
        self._require_non_empty(default_message, "default_message")
        provisioned = self._groupme_provisioner.provision_channel(
            user_id=command.user_id,
            connect_token=command.connect_token,
            external_group_id=external_group_id,
            external_group_name=_clean_optional_text(command.external_group_name)
            or current.external_group_name,
            reconnect=True,
        )
        updated = self._repository.update_support_channel(
            support_channel_id=current.id,
            user_id=command.user_id,
            patch={
                "provider": SUPPORT_CHANNEL_PROVIDER_GROUPME,
                "status": SUPPORT_CHANNEL_STATUS_CONNECTED,
                "enabled": command.enabled,
                "external_group_id": provisioned.external_group_id,
                "external_group_name": provisioned.external_group_name,
                "provider_config_ref": provisioned.provider_config_ref,
                "default_message": default_message.strip(),
            },
        )
        if updated is None:
            raise SupportChannelManagementError(
                code="support_channel_update_failed",
                message="Support channel could not be reconnected.",
                status_code=500,
            )
        return updated

    def disable_current_channel(self, *, user_id: str) -> SupportChannelRecord | None:
        current = self._repository.get_current_support_channel(user_id=user_id)
        if current is None:
            return None
        return self._repository.update_support_channel(
            support_channel_id=current.id,
            user_id=user_id,
            patch={
                "enabled": False,
                "status": SUPPORT_CHANNEL_STATUS_DISABLED,
            },
        )

    def require_current_channel(self, *, user_id: str) -> SupportChannelRecord:
        current = self._repository.get_current_support_channel(user_id=user_id)
        if current is None:
            raise SupportChannelManagementError(
                code="support_channel_not_found",
                message="Support channel could not be found for this user.",
                status_code=404,
            )
        return current

    def _require_non_empty(self, value: str | None, field_name: str) -> None:
        if not value or not value.strip():
            raise SupportChannelManagementError(
                code=f"{field_name}_required",
                message=f"{field_name} is required.",
                status_code=400,
            )


def _clean_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None
