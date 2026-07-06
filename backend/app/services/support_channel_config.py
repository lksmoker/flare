from __future__ import annotations

import os
from dataclasses import dataclass

from backend.app.domain.support_channels import GroupMeRuntimeConfig

SUPABASE_URL_ENV_NAME = "FLARE_SUPABASE_URL"
SUPABASE_SERVICE_ROLE_KEY_ENV_NAME = "FLARE_SUPABASE_SERVICE_ROLE_KEY"
GROUPME_TEST_GROUP_ID_ENV_NAME = "GROUPME_TEST_GROUP_ID"
GROUPME_TEST_GROUP_NAME_ENV_NAME = "GROUPME_TEST_GROUP_NAME"
GROUPME_TEST_BOT_ID_ENV_NAME = "GROUPME_TEST_BOT_ID"
GROUPME_OAUTH_CLIENT_ID_ENV_NAME = "GROUPME_OAUTH_CLIENT_ID"
GROUPME_OAUTH_REDIRECT_URL_ENV_NAME = "GROUPME_OAUTH_REDIRECT_URL"
GROUPME_BOT_NAME_ENV_NAME = "GROUPME_BOT_NAME"
GROUPME_BOT_CALLBACK_URL_ENV_NAME = "GROUPME_BOT_CALLBACK_URL"
GROUPME_BOT_AVATAR_URL_ENV_NAME = "GROUPME_BOT_AVATAR_URL"


@dataclass(frozen=True)
class SupabaseAdminConfig:
    url: str
    service_role_key: str


@dataclass(frozen=True)
class GroupMeOAuthConfig:
    client_id: str
    redirect_url: str


@dataclass(frozen=True)
class GroupMeBotProvisioningConfig:
    bot_name: str
    callback_url: str | None = None
    avatar_url: str | None = None


def load_supabase_admin_config(env: dict[str, str] | None = None) -> SupabaseAdminConfig:
    source = env or os.environ
    url = (source.get(SUPABASE_URL_ENV_NAME) or "").strip()
    service_role_key = (source.get(SUPABASE_SERVICE_ROLE_KEY_ENV_NAME) or "").strip()
    missing = [
        name
        for name, value in (
            (SUPABASE_URL_ENV_NAME, url),
            (SUPABASE_SERVICE_ROLE_KEY_ENV_NAME, service_role_key),
        )
        if not value
    ]
    if missing:
        joined = ", ".join(missing)
        raise RuntimeError(f"Missing backend Supabase env vars: {joined}")
    return SupabaseAdminConfig(url=url.rstrip("/"), service_role_key=service_role_key)


def load_groupme_runtime_config(env: dict[str, str] | None = None) -> GroupMeRuntimeConfig:
    source = env or os.environ
    group_id = (source.get(GROUPME_TEST_GROUP_ID_ENV_NAME) or "").strip()
    group_name = (source.get(GROUPME_TEST_GROUP_NAME_ENV_NAME) or "").strip()
    bot_id = (source.get(GROUPME_TEST_BOT_ID_ENV_NAME) or "").strip()
    missing = [
        name
        for name, value in (
            (GROUPME_TEST_GROUP_ID_ENV_NAME, group_id),
            (GROUPME_TEST_GROUP_NAME_ENV_NAME, group_name),
            (GROUPME_TEST_BOT_ID_ENV_NAME, bot_id),
        )
        if not value
    ]
    if missing:
        joined = ", ".join(missing)
        raise RuntimeError(f"Missing GroupMe test env vars: {joined}")
    return GroupMeRuntimeConfig(
        test_group_id=group_id,
        test_group_name=group_name,
        test_bot_id=bot_id,
    )


def load_groupme_oauth_config(env: dict[str, str] | None = None) -> GroupMeOAuthConfig:
    source = env or os.environ
    client_id = (source.get(GROUPME_OAUTH_CLIENT_ID_ENV_NAME) or "").strip()
    redirect_url = (source.get(GROUPME_OAUTH_REDIRECT_URL_ENV_NAME) or "").strip()
    missing = [
        name
        for name, value in (
            (GROUPME_OAUTH_CLIENT_ID_ENV_NAME, client_id),
            (GROUPME_OAUTH_REDIRECT_URL_ENV_NAME, redirect_url),
        )
        if not value
    ]
    if missing:
        joined = ", ".join(missing)
        raise RuntimeError(f"Missing GroupMe OAuth env vars: {joined}")
    return GroupMeOAuthConfig(client_id=client_id, redirect_url=redirect_url)


def load_groupme_bot_provisioning_config(
    env: dict[str, str] | None = None,
) -> GroupMeBotProvisioningConfig:
    source = env or os.environ
    bot_name = (source.get(GROUPME_BOT_NAME_ENV_NAME) or "").strip()
    if not bot_name:
        raise RuntimeError(f"Missing GroupMe bot env var: {GROUPME_BOT_NAME_ENV_NAME}")
    callback_url = (source.get(GROUPME_BOT_CALLBACK_URL_ENV_NAME) or "").strip() or None
    avatar_url = (source.get(GROUPME_BOT_AVATAR_URL_ENV_NAME) or "").strip() or None
    return GroupMeBotProvisioningConfig(
        bot_name=bot_name,
        callback_url=callback_url,
        avatar_url=avatar_url,
    )
