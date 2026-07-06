from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any
from urllib import parse, request

from backend.app.domain.support_channels import (
    DeliveryAttemptRecord,
    SupportChannelRecord,
)
from backend.app.services.support_channel_config import SupabaseAdminConfig


class SupportChannelRepository:
    def __init__(
        self,
        *,
        config: SupabaseAdminConfig,
        transport: "_RestTransport | None" = None,
    ) -> None:
        self._config = config
        self._transport = transport or _UrllibRestTransport(config=config)

    def get_support_channel(
        self,
        *,
        support_channel_id: str,
        user_id: str,
    ) -> SupportChannelRecord | None:
        query = parse.urlencode(
            {
                "id": f"eq.{support_channel_id}",
                "user_id": f"eq.{user_id}",
                "select": "*",
                "limit": "1",
            }
        )
        rows = self._transport.request_json(
            method="GET",
            path=f"/rest/v1/support_channels?{query}",
            payload=None,
            prefer=None,
        )
        if not rows:
            return None
        return SupportChannelRecord.from_row(rows[0])

    def insert_delivery_attempt(self, attempt: DeliveryAttemptRecord) -> dict[str, Any]:
        rows = self._transport.request_json(
            method="POST",
            path="/rest/v1/support_channel_delivery_attempts",
            payload=[asdict(attempt)],
            prefer="return=representation",
        )
        return rows[0] if rows else {}

    def update_last_delivery(
        self,
        *,
        support_channel_id: str,
        user_id: str,
        status: str,
        delivered_at: str | None,
        error_code: str | None,
        error_message_safe: str | None,
    ) -> None:
        query = parse.urlencode(
            {
                "id": f"eq.{support_channel_id}",
                "user_id": f"eq.{user_id}",
            }
        )
        payload = {
            "last_delivery_status": status,
            "last_delivery_at": delivered_at,
            "last_error_code": error_code,
            "last_error_message_safe": error_message_safe,
        }
        self._transport.request_json(
            method="PATCH",
            path=f"/rest/v1/support_channels?{query}",
            payload=payload,
            prefer="return=minimal",
        )


class _RestTransport:
    def request_json(
        self,
        *,
        method: str,
        path: str,
        payload: Any,
        prefer: str | None,
    ) -> list[dict[str, Any]]:
        raise NotImplementedError


class _UrllibRestTransport(_RestTransport):
    def __init__(self, *, config: SupabaseAdminConfig) -> None:
        self._config = config

    def request_json(
        self,
        *,
        method: str,
        path: str,
        payload: Any,
        prefer: str | None,
    ) -> list[dict[str, Any]]:
        body = None
        headers = {
            "apikey": self._config.service_role_key,
            "Authorization": f"Bearer {self._config.service_role_key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
        raw_request = request.Request(
            url=f"{self._config.url}{path}",
            data=body,
            headers=headers,
            method=method,
        )
        with request.urlopen(raw_request, timeout=10) as response:
            raw_body = response.read()
        if not raw_body:
            return []
        decoded = json.loads(raw_body.decode("utf-8"))
        if isinstance(decoded, list):
            return decoded
        if isinstance(decoded, dict):
            return [decoded]
        raise RuntimeError("Unexpected Supabase REST response shape.")
