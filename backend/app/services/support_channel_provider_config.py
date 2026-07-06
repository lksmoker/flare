from __future__ import annotations

import base64
from dataclasses import dataclass

from backend.app.integrations.groupme_provider import GroupMeProviderConfig

_GROUPME_PROVIDER_REF_PREFIX = "groupme:bot:"
_LEGACY_GROUPME_PROVIDER_REF_PREFIX = "groupme:"


@dataclass(frozen=True)
class ProviderConfigRef:
    raw: str

    @classmethod
    def for_groupme_bot(cls, *, bot_id: str) -> "ProviderConfigRef":
        encoded = base64.urlsafe_b64encode(bot_id.encode("utf-8")).decode("ascii")
        return cls(raw=f"{_GROUPME_PROVIDER_REF_PREFIX}{encoded}")


class ProviderConfigResolver:
    def resolve_groupme_provider_config(
        self,
        *,
        provider_config_ref: str | None,
    ) -> GroupMeProviderConfig | None:
        if not provider_config_ref:
            return None
        if provider_config_ref.startswith(_GROUPME_PROVIDER_REF_PREFIX):
            encoded = provider_config_ref.removeprefix(_GROUPME_PROVIDER_REF_PREFIX)
            padding = "=" * (-len(encoded) % 4)
            try:
                bot_id = base64.urlsafe_b64decode(f"{encoded}{padding}").decode("utf-8")
            except (ValueError, UnicodeDecodeError):
                return None
            return GroupMeProviderConfig(bot_id=bot_id)
        if provider_config_ref.startswith(_LEGACY_GROUPME_PROVIDER_REF_PREFIX):
            bot_id = provider_config_ref.removeprefix(_LEGACY_GROUPME_PROVIDER_REF_PREFIX).strip()
            if bot_id:
                return GroupMeProviderConfig(bot_id=bot_id)
        return None
