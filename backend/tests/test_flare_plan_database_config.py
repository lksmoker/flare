from __future__ import annotations

import unittest
from unittest.mock import patch

from backend.app.http.app import build_support_channel_http_app
from backend.app.services.flare_plan_config import (
    FLARE_POSTGRES_DSN_ENV_NAME,
    LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME,
    load_flare_plan_database_config,
)


class FlarePlanDatabaseConfigTests(unittest.TestCase):
    def test_connect_uses_the_configured_dsn(self) -> None:
        config = load_flare_plan_database_config(
            {
                FLARE_POSTGRES_DSN_ENV_NAME: "postgresql://primary-user:pw@db.example.com:5432/app",
            }
        )

        with patch("backend.app.services.flare_plan_config.psycopg2.connect") as connect:
            returned = config.connect()

        connect.assert_called_once_with("postgresql://primary-user:pw@db.example.com:5432/app")
        self.assertEqual(connect.return_value, returned)

    def test_prefers_explicit_postgres_dsn_over_legacy_env(self) -> None:
        config = load_flare_plan_database_config(
            {
                FLARE_POSTGRES_DSN_ENV_NAME: "postgresql://primary-user:pw@db.example.com:5432/app",
                LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME: "postgresql://legacy-user:pw@db.example.com:5432/app",
            }
        )

        self.assertEqual(FLARE_POSTGRES_DSN_ENV_NAME, config.source_env_name)
        self.assertEqual("postgresql://primary-user:pw@db.example.com:5432/app", config.dsn)

    def test_accepts_legacy_fallback_when_it_is_a_valid_postgres_dsn(self) -> None:
        config = load_flare_plan_database_config(
            {
                LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME: "dbname=flare user=postgres password=secret host=127.0.0.1 port=5432"
            }
        )

        self.assertEqual(LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME, config.source_env_name)
        self.assertIn("dbname=flare", config.dsn)

    def test_missing_dsn_is_explicit(self) -> None:
        with self.assertRaises(RuntimeError) as error:
            load_flare_plan_database_config({})

        self.assertIn(FLARE_POSTGRES_DSN_ENV_NAME, str(error.exception))

    def test_https_project_url_is_rejected_for_legacy_fallback(self) -> None:
        with self.assertRaises(RuntimeError) as error:
            load_flare_plan_database_config(
                {
                    LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME: "https://project.supabase.co",
                }
            )

        message = str(error.exception)
        self.assertIn(LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME, message)
        self.assertIn(FLARE_POSTGRES_DSN_ENV_NAME, message)
        self.assertIn("FLARE_SUPABASE_URL", message)

    def test_malformed_explicit_dsn_fails_fast(self) -> None:
        with self.assertRaises(RuntimeError) as error:
            load_flare_plan_database_config(
                {
                    FLARE_POSTGRES_DSN_ENV_NAME: "definitely-not-a-valid-dsn",
                }
            )

        self.assertIn("valid psycopg2/libpq Postgres DSN", str(error.exception))


class FlarePlanBackendConstructionTests(unittest.TestCase):
    def test_backend_app_uses_explicit_postgres_dsn_without_changing_supabase_url(self) -> None:
        env = {
            "FLARE_ALLOWED_FRONTEND_ORIGINS": "https://flare-web.tailnet.ts.net",
            "FLARE_PUBLIC_BACKEND_BASE_URL": "https://flare-api.tailnet.ts.net:9001",
            "FLARE_SUPABASE_URL": "https://project.supabase.co",
            "FLARE_SUPABASE_SERVICE_ROLE_KEY": "service-role-key",
            "GROUPME_OAUTH_CLIENT_ID": "groupme-client-id",
            FLARE_POSTGRES_DSN_ENV_NAME: "postgresql://plan-user:pw@db.example.com:5432/flare",
        }

        with (
            patch("backend.app.http.app.SupportChannelRepository") as support_repo_cls,
            patch("backend.app.http.app.PostgresFlarePlanRepository") as flare_plan_repo_cls,
            patch("backend.app.http.app.PostgresFlareTraceRepository") as flare_trace_repo_cls,
        ):
            build_support_channel_http_app(env=env)

        support_config = support_repo_cls.call_args.kwargs["config"]
        flare_plan_config = flare_plan_repo_cls.call_args.kwargs["config"]
        flare_trace_config = flare_trace_repo_cls.call_args.kwargs["config"]
        self.assertEqual("https://project.supabase.co", support_config.url)
        self.assertEqual("service-role-key", support_config.service_role_key)
        self.assertEqual("postgresql://plan-user:pw@db.example.com:5432/flare", flare_plan_config.dsn)
        self.assertEqual(FLARE_POSTGRES_DSN_ENV_NAME, flare_plan_config.source_env_name)
        self.assertEqual("postgresql://plan-user:pw@db.example.com:5432/flare", flare_trace_config.dsn)
        self.assertEqual(FLARE_POSTGRES_DSN_ENV_NAME, flare_trace_config.source_env_name)


if __name__ == "__main__":
    unittest.main()
