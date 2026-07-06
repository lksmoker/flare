from __future__ import annotations

import unittest

from backend.app.domain.support_channels import (
    SUPPORT_CHANNEL_PROVIDER_CONFIG_STATUS_AUTHORIZED,
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    SupportChannelDestination,
    SupportChannelProviderConfigRecord,
)
from backend.app.integrations.groupme_provider import GroupMeApiError
from backend.app.services.support_channel_config import (
    GroupMeOAuthConfig,
    build_groupme_oauth_redirect_url,
    load_groupme_oauth_config,
    load_support_channel_http_runtime_config,
)
from backend.app.services.support_channel_groupme_provisioner import (
    GroupMeChannelProvisioner,
)
from backend.app.services.support_channel_management import SupportChannelManagementError
from backend.app.services.support_channel_provider_config import ProviderConfigResolver


class GroupMeChannelProvisionerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = _FakeRepository()
        self.provider = _FakeProvider()
        self.bot_manager = _FakeBotManager()
        self.provisioner = GroupMeChannelProvisioner(
            provider=self.provider,
            repository=self.repository,
            oauth_config=GroupMeOAuthConfig(
                client_id="client-123",
                redirect_url="https://flare.test/api/support-channel/groupme/connect/callback",
            ),
            bot_manager=self.bot_manager,
        )

    def test_build_connect_url_uses_groupme_oauth_settings(self) -> None:
        auth_url = self.provisioner.build_connect_url()

        self.assertIn("client_id=client-123", auth_url)
        self.assertIn("response_type=token", auth_url)

    def test_create_connect_session_validates_auth_and_persists_backend_only_config(self) -> None:
        session = self.provisioner.create_connect_session(
            user_id="user-123",
            access_token="access-token-1",
        )

        self.assertEqual("config-1", session.connect_session_id)
        stored = self.repository.records["config-1"]
        self.assertEqual("access-token-1", stored.access_token)
        self.assertEqual(SUPPORT_CHANNEL_PROVIDER_CONFIG_STATUS_AUTHORIZED, stored.status)

    def test_create_connect_session_surfaces_auth_error(self) -> None:
        self.provider.auth_error = GroupMeApiError(
            code="groupme_auth_invalid",
            message="GroupMe authorization is invalid or expired.",
            status_code=401,
        )

        with self.assertRaises(SupportChannelManagementError) as raised:
            self.provisioner.create_connect_session(
                user_id="user-123",
                access_token="bad-token",
            )

        self.assertEqual("groupme_auth_invalid", raised.exception.code)
        self.assertEqual(401, raised.exception.status_code)

    def test_list_destinations_uses_stored_connect_session(self) -> None:
        self.provisioner.create_connect_session(user_id="user-123", access_token="access-token-1")

        destinations = self.provisioner.list_destinations(
            user_id="user-123",
            connect_session_id="config-1",
        )

        self.assertEqual(["group-1", "group-2"], [item.id for item in destinations])
        self.assertEqual("access-token-1", self.provider.last_access_token)

    def test_provision_channel_updates_provider_config_and_resolver_can_load_it(self) -> None:
        self.provisioner.create_connect_session(user_id="user-123", access_token="access-token-1")

        provisioned = self.provisioner.provision_channel(
            user_id="user-123",
            connect_session_id="config-1",
            external_group_id="group-2",
            reconnect=False,
        )

        self.assertEqual("group-2", provisioned.external_group_id)
        self.assertEqual("Group Two", provisioned.external_group_name)
        stored = self.repository.records["config-1"]
        self.assertEqual("bot-live-1", stored.bot_id)
        resolved = ProviderConfigResolver(repository=self.repository).resolve_groupme_provider_config(
            provider_config_ref=provisioned.provider_config_ref,
            user_id="user-123",
        )
        self.assertIsNotNone(resolved)
        assert resolved is not None
        self.assertEqual("bot-live-1", resolved.bot_id)
        self.assertEqual("access-token-1", resolved.access_token)

    def test_provision_channel_surfaces_bot_creation_failure(self) -> None:
        self.provisioner.create_connect_session(user_id="user-123", access_token="access-token-1")
        self.bot_manager.error = GroupMeApiError(
            code="groupme_provider_error",
            message="GroupMe request failed with status 500.",
            status_code=502,
        )

        with self.assertRaises(SupportChannelManagementError) as raised:
            self.provisioner.provision_channel(
                user_id="user-123",
                connect_session_id="config-1",
                external_group_id="group-1",
                reconnect=True,
            )

        self.assertEqual("groupme_provider_error", raised.exception.code)
        self.assertEqual(502, raised.exception.status_code)


class SupportChannelRuntimeConfigTests(unittest.TestCase):
    def test_load_groupme_oauth_config_falls_back_to_public_backend_base_url(self) -> None:
        config = load_groupme_oauth_config(
            {
                "GROUPME_OAUTH_CLIENT_ID": "client-123",
                "FLARE_PUBLIC_BACKEND_BASE_URL": "https://flare-api.tailnet.ts.net:9001/",
            }
        )

        self.assertEqual("client-123", config.client_id)
        self.assertEqual(
            "https://flare-api.tailnet.ts.net:9001/api/support-channel/groupme/connect/callback",
            config.redirect_url,
        )

    def test_load_support_channel_http_runtime_config_requires_exact_origins(self) -> None:
        config = load_support_channel_http_runtime_config(
            {
                "FLARE_ALLOWED_FRONTEND_ORIGINS": "https://flare-web.tailnet.ts.net,http://100.64.0.10:8081/",
                "FLARE_PUBLIC_BACKEND_BASE_URL": "https://flare-api.tailnet.ts.net:9001",
            }
        )

        self.assertEqual(
            (
                "https://flare-web.tailnet.ts.net",
                "http://100.64.0.10:8081",
            ),
            config.allowed_frontend_origins,
        )
        self.assertEqual(
            "https://flare-api.tailnet.ts.net:9001",
            config.public_backend_base_url,
        )

    def test_load_support_channel_http_runtime_config_rejects_wildcard_origin(self) -> None:
        with self.assertRaises(RuntimeError) as raised:
            load_support_channel_http_runtime_config(
                {
                    "FLARE_ALLOWED_FRONTEND_ORIGINS": "*",
                    "FLARE_PUBLIC_BACKEND_BASE_URL": "https://flare-api.tailnet.ts.net:9001",
                }
            )

        self.assertIn("cannot use '*'", str(raised.exception))

    def test_build_groupme_oauth_redirect_url_normalizes_host_only_base_url(self) -> None:
        redirect_url = build_groupme_oauth_redirect_url("https://flare-api.tailnet.ts.net:9001/")

        self.assertEqual(
            "https://flare-api.tailnet.ts.net:9001/api/support-channel/groupme/connect/callback",
            redirect_url,
        )


class _FakeRepository:
    def __init__(self) -> None:
        self.records: dict[str, SupportChannelProviderConfigRecord] = {}

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
        record = SupportChannelProviderConfigRecord(
            id=f"config-{len(self.records) + 1}",
            user_id=user_id,
            provider=provider,
            status=status,
            access_token=access_token,
            provider_user_id=provider_user_id,
            provider_user_name=provider_user_name,
        )
        self.records[record.id] = record
        return record

    def get_provider_config(
        self,
        *,
        provider_config_id: str,
        user_id: str,
    ) -> SupportChannelProviderConfigRecord | None:
        record = self.records.get(provider_config_id)
        if record is None or record.user_id != user_id:
            return None
        return record

    def update_provider_config(
        self,
        *,
        provider_config_id: str,
        user_id: str,
        patch: dict[str, object],
    ) -> SupportChannelProviderConfigRecord | None:
        record = self.get_provider_config(provider_config_id=provider_config_id, user_id=user_id)
        if record is None:
            return None
        updated = SupportChannelProviderConfigRecord(
            id=record.id,
            user_id=record.user_id,
            provider=record.provider,
            status=str(patch.get("status", record.status)),
            access_token=record.access_token,
            provider_user_id=record.provider_user_id,
            provider_user_name=record.provider_user_name,
            bot_id=str(patch.get("bot_id", record.bot_id)) if patch.get("bot_id", record.bot_id) is not None else None,
            external_group_id=str(patch.get("external_group_id", record.external_group_id)) if patch.get("external_group_id", record.external_group_id) is not None else None,
            external_group_name=str(patch.get("external_group_name", record.external_group_name)) if patch.get("external_group_name", record.external_group_name) is not None else None,
        )
        self.records[record.id] = updated
        return updated


class _FakeProvider:
    def __init__(self) -> None:
        self.auth_error: GroupMeApiError | None = None
        self.last_access_token: str | None = None

    def build_oauth_authorize_url(self, *, client_id: str, redirect_uri: str) -> str:
        return f"https://oauth.groupme.com/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=token"

    def get_authenticated_user(self, *, access_token: str):
        if self.auth_error is not None:
            raise self.auth_error
        self.last_access_token = access_token
        return type("User", (), {"user_id": "groupme-user-1", "name": "Luke"})()

    def list_groups(self, *, access_token: str) -> list[SupportChannelDestination]:
        self.last_access_token = access_token
        return [
            SupportChannelDestination(id="group-1", name="Group One"),
            SupportChannelDestination(id="group-2", name="Group Two"),
        ]


class _FakeBotManager:
    def __init__(self) -> None:
        self.error: GroupMeApiError | None = None

    def ensure_bot(self, *, access_token: str, external_group_id: str) -> str:
        if self.error is not None:
            raise self.error
        return "bot-live-1"
