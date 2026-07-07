from __future__ import annotations

import base64
from dataclasses import dataclass

from backend.app.integrations.groupme_provider import GroupMeProviderConfig

_GROUPME_PROVIDER_REF_PREFIX = "groupme:config:"
_LEGACY_GROUPME_PROVIDER_REF_PREFIX = "groupme:bot:"
_VERY_LEGACY_GROUPME_PROVIDER_REF_PREFIX = "groupme:"


@dataclass(frozen=True)
class ProviderConfigRef:
    raw: str

    @classmethod
    def for_groupme_config(cls, *, provider_config_id: str) -> "ProviderConfigRef":
        encoded = base64.urlsafe_b64encode(provider_config_id.encode("utf-8")).decode("ascii")
        return cls(raw=f"{_GROUPME_PROVIDER_REF_PREFIX}{encoded}")

    @classmethod
    def for_groupme_bot(cls, *, bot_id: str) -> "ProviderConfigRef":
        encoded = base64.urlsafe_b64encode(bot_id.encode("utf-8")).decode("ascii")
        return cls(raw=f"{_LEGACY_GROUPME_PROVIDER_REF_PREFIX}{encoded}")


class ProviderConfigRepositoryLike:
    def get_provider_config(self, *, provider_config_id: str, user_id: str):
        raise NotImplementedError


class ProviderConfigResolver:
    def __init__(self, *, repository: ProviderConfigRepositoryLike | None = None) -> None:
        self._repository = repository

    def resolve_groupme_provider_config(
        self,
        *,
        provider_config_ref: str | None,
        user_id: str | None = None,
    ) -> GroupMeProviderConfig | None:
        if not provider_config_ref:
            return None
        if provider_config_ref.startswith(_GROUPME_PROVIDER_REF_PREFIX):
            if self._repository is None or not user_id:
                return None
            provider_config_id = _decode_ref(
                provider_config_ref.removeprefix(_GROUPME_PROVIDER_REF_PREFIX)
            )
            if not provider_config_id:
                return None
            record = self._repository.get_provider_config(
                provider_config_id=provider_config_id,
                user_id=user_id,
            )
            if record is None or not record.bot_id:
                if record is None:
                    return None
                return GroupMeProviderConfig(
                    bot_id=record.bot_id,
                    access_token=record.access_token,
                    bot_display_name=record.bot_display_name,
                )
            return GroupMeProviderConfig(
                bot_id=record.bot_id,
                access_token=record.access_token,
                bot_display_name=record.bot_display_name,
            )
        if provider_config_ref.startswith(_LEGACY_GROUPME_PROVIDER_REF_PREFIX):
            bot_id = _decode_ref(provider_config_ref.removeprefix(_LEGACY_GROUPME_PROVIDER_REF_PREFIX))
            if bot_id:
                return GroupMeProviderConfig(bot_id=bot_id)
            return None
        if provider_config_ref.startswith(_VERY_LEGACY_GROUPME_PROVIDER_REF_PREFIX):
            bot_id = provider_config_ref.removeprefix(_VERY_LEGACY_GROUPME_PROVIDER_REF_PREFIX).strip()
            if bot_id:
                return GroupMeProviderConfig(bot_id=bot_id)
        return None


def _decode_ref(encoded: str) -> str | None:
    padding = "=" * (-len(encoded) % 4)
    try:
        return base64.urlsafe_b64decode(f"{encoded}{padding}").decode("utf-8")
    except (ValueError, UnicodeDecodeError):
        return None
