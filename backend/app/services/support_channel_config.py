from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import urlsplit

from backend.app.domain.support_channels import GroupMeRuntimeConfig

SUPABASE_URL_ENV_NAME = "FLARE_SUPABASE_URL"
SUPABASE_SERVICE_ROLE_KEY_ENV_NAME = "FLARE_SUPABASE_SERVICE_ROLE_KEY"
SUPPORT_CHANNEL_ALLOWED_FRONTEND_ORIGINS_ENV_NAME = "FLARE_ALLOWED_FRONTEND_ORIGINS"
SUPPORT_CHANNEL_PUBLIC_BACKEND_BASE_URL_ENV_NAME = "FLARE_PUBLIC_BACKEND_BASE_URL"
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


@dataclass(frozen=True)
class SupportChannelHttpRuntimeConfig:
    allowed_frontend_origins: tuple[str, ...]
    public_backend_base_url: str


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


def load_support_channel_http_runtime_config(
    env: dict[str, str] | None = None,
) -> SupportChannelHttpRuntimeConfig:
    source = env or os.environ
    raw_origins = source.get(SUPPORT_CHANNEL_ALLOWED_FRONTEND_ORIGINS_ENV_NAME) or ""
    origins = tuple(
        _normalize_public_url(
            env_name=SUPPORT_CHANNEL_ALLOWED_FRONTEND_ORIGINS_ENV_NAME,
            value=origin.strip(),
        )
        for origin in raw_origins.split(",")
        if origin.strip()
    )
    if not origins:
        raise RuntimeError(
            "Missing backend support-channel env var: "
            f"{SUPPORT_CHANNEL_ALLOWED_FRONTEND_ORIGINS_ENV_NAME}"
        )
    if len(set(origins)) != len(origins):
        raise RuntimeError(
            f"{SUPPORT_CHANNEL_ALLOWED_FRONTEND_ORIGINS_ENV_NAME} must not contain duplicate origins."
        )
    return SupportChannelHttpRuntimeConfig(
        allowed_frontend_origins=origins,
        public_backend_base_url=_require_public_url(
            env_name=SUPPORT_CHANNEL_PUBLIC_BACKEND_BASE_URL_ENV_NAME,
            value=source.get(SUPPORT_CHANNEL_PUBLIC_BACKEND_BASE_URL_ENV_NAME),
        ),
    )


def load_groupme_oauth_config(env: dict[str, str] | None = None) -> GroupMeOAuthConfig:
    source = env or os.environ
    client_id = (source.get(GROUPME_OAUTH_CLIENT_ID_ENV_NAME) or "").strip()
    explicit_redirect_url = (source.get(GROUPME_OAUTH_REDIRECT_URL_ENV_NAME) or "").strip()
    redirect_url = explicit_redirect_url
    if not redirect_url:
        public_base_url = (source.get(SUPPORT_CHANNEL_PUBLIC_BACKEND_BASE_URL_ENV_NAME) or "").strip()
        if public_base_url:
            redirect_url = build_groupme_oauth_redirect_url(public_base_url)
    missing = []
    if not client_id:
        missing.append(GROUPME_OAUTH_CLIENT_ID_ENV_NAME)
    if not redirect_url:
        missing.append(
            f"{GROUPME_OAUTH_REDIRECT_URL_ENV_NAME} or {SUPPORT_CHANNEL_PUBLIC_BACKEND_BASE_URL_ENV_NAME}"
        )
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


def build_groupme_oauth_redirect_url(public_backend_base_url: str) -> str:
    base_url = _normalize_public_url(
        env_name=SUPPORT_CHANNEL_PUBLIC_BACKEND_BASE_URL_ENV_NAME,
        value=public_backend_base_url,
    )
    return f"{base_url}/api/support-channel/groupme/connect/callback"


def _require_public_url(*, env_name: str, value: str | None) -> str:
    cleaned = (value or "").strip()
    if not cleaned:
        raise RuntimeError(f"Missing backend support-channel env var: {env_name}")
    return _normalize_public_url(env_name=env_name, value=cleaned)


def _normalize_public_url(*, env_name: str, value: str) -> str:
    if value == "*":
        raise RuntimeError(f"{env_name} must list exact http/https origins and cannot use '*'.")
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise RuntimeError(f"{env_name} must be a full http/https origin or base URL.")
    if parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
        raise RuntimeError(f"{env_name} must not include a path, query string, or fragment.")
    return f"{parsed.scheme}://{parsed.netloc}"
