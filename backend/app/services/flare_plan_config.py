from __future__ import annotations

import os
from dataclasses import dataclass

FLARE_SUPABASE_DB_URL_ENV_NAME = "FLARE_SUPABASE_DB_URL"


@dataclass(frozen=True)
class FlarePlanDatabaseConfig:
    db_url: str


def load_flare_plan_database_config(env: dict[str, str] | None = None) -> FlarePlanDatabaseConfig:
    source = env or os.environ
    db_url = (source.get(FLARE_SUPABASE_DB_URL_ENV_NAME) or "").strip()
    if not db_url:
        raise RuntimeError(f"Missing backend Flare Plan env var: {FLARE_SUPABASE_DB_URL_ENV_NAME}")
    return FlarePlanDatabaseConfig(db_url=db_url)
