from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import urlsplit

from psycopg2.extensions import parse_dsn

FLARE_POSTGRES_DSN_ENV_NAME = "FLARE_POSTGRES_DSN"
LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME = "FLARE_SUPABASE_DB_URL"


@dataclass(frozen=True)
class FlarePlanDatabaseConfig:
    dsn: str
    source_env_name: str = FLARE_POSTGRES_DSN_ENV_NAME

    @property
    def db_url(self) -> str:
        return self.dsn


def load_flare_plan_database_config(env: dict[str, str] | None = None) -> FlarePlanDatabaseConfig:
    source = env or os.environ
    explicit_dsn = (source.get(FLARE_POSTGRES_DSN_ENV_NAME) or "").strip()
    legacy_dsn = (source.get(LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME) or "").strip()

    if explicit_dsn:
        return FlarePlanDatabaseConfig(
            dsn=_validate_postgres_dsn(explicit_dsn, env_name=FLARE_POSTGRES_DSN_ENV_NAME),
            source_env_name=FLARE_POSTGRES_DSN_ENV_NAME,
        )

    if legacy_dsn:
        return FlarePlanDatabaseConfig(
            dsn=_validate_postgres_dsn(
                legacy_dsn,
                env_name=LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME,
                deprecated=True,
            ),
            source_env_name=LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME,
        )

    raise RuntimeError(
        "Missing backend Flare Plan Postgres DSN env var: "
        f"{FLARE_POSTGRES_DSN_ENV_NAME} "
        f"(legacy fallback: {LEGACY_FLARE_SUPABASE_DB_URL_ENV_NAME})."
    )


def _validate_postgres_dsn(value: str, *, env_name: str, deprecated: bool = False) -> str:
    if _looks_like_http_url(value):
        if deprecated:
            raise RuntimeError(
                f"{env_name} is a deprecated fallback for Flare Plan direct Postgres access and "
                "must contain a Postgres DSN, not a Supabase HTTPS project URL. "
                f"Set {FLARE_POSTGRES_DSN_ENV_NAME} to the database connection string and keep "
                "FLARE_SUPABASE_URL for the project URL."
            )
        raise RuntimeError(f"{env_name} must contain a Postgres DSN, not an HTTP or HTTPS URL.")
    try:
        parse_dsn(value)
    except Exception as exc:  # pragma: no cover - psycopg2 error class varies by version
        raise RuntimeError(f"{env_name} must be a valid psycopg2/libpq Postgres DSN.") from exc
    return value


def _looks_like_http_url(value: str) -> bool:
    parsed = urlsplit(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
