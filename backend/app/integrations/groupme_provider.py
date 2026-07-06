from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib import error, request

from backend.app.domain.support_channels import (
    SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED,
    SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    SupportChannelSendRequest,
    SupportChannelSendResult,
)

GROUPME_BOT_POST_URL = "https://api.groupme.com/v3/bots/post"


@dataclass(frozen=True)
class GroupMeProviderConfig:
    bot_id: str


class GroupMeProvider:
    provider_key = SUPPORT_CHANNEL_PROVIDER_GROUPME

    def __init__(self, transport: "_Transport | None" = None) -> None:
        self._transport = transport or _UrllibTransport()

    def send_message(
        self,
        *,
        provider_config: GroupMeProviderConfig,
        send_request: SupportChannelSendRequest,
    ) -> SupportChannelSendResult:
        payload = {
            "bot_id": provider_config.bot_id,
            "text": send_request.message,
        }
        attempted_at = datetime.now(timezone.utc).isoformat()
        try:
            response = self._transport.post_json(GROUPME_BOT_POST_URL, payload)
        except error.HTTPError as exc:
            return SupportChannelSendResult(
                ok=False,
                provider=self.provider_key,
                send_kind=send_request.send_kind,
                status=SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED,
                attempted_at=attempted_at,
                delivered_at=None,
                support_channel_id=send_request.support_channel_id,
                user_id=send_request.user_id,
                destination_id=send_request.destination_id,
                destination_name=send_request.destination_name,
                message_snapshot=send_request.message,
                provider_message_id=None,
                error_code=f"groupme_http_{exc.code}",
                error_message_safe="GroupMe rejected the test message.",
                raw_provider_status_ref=f"http_status:{exc.code}",
            )
        except error.URLError:
            return SupportChannelSendResult(
                ok=False,
                provider=self.provider_key,
                send_kind=send_request.send_kind,
                status=SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED,
                attempted_at=attempted_at,
                delivered_at=None,
                support_channel_id=send_request.support_channel_id,
                user_id=send_request.user_id,
                destination_id=send_request.destination_id,
                destination_name=send_request.destination_name,
                message_snapshot=send_request.message,
                provider_message_id=None,
                error_code="groupme_unreachable",
                error_message_safe="GroupMe could not be reached for the test message.",
                raw_provider_status_ref="transport:error",
            )

        delivered_at = attempted_at
        provider_message_id = None
        if isinstance(response, dict):
            provider_message_id = _extract_provider_message_id(response)

        return SupportChannelSendResult(
            ok=True,
            provider=self.provider_key,
            send_kind=send_request.send_kind,
            status=SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
            attempted_at=attempted_at,
            delivered_at=delivered_at,
            support_channel_id=send_request.support_channel_id,
            user_id=send_request.user_id,
            destination_id=send_request.destination_id,
            destination_name=send_request.destination_name,
            message_snapshot=send_request.message,
            provider_message_id=provider_message_id,
            error_code=None,
            error_message_safe=None,
            raw_provider_status_ref="http_status:202",
        )


class _Transport:
    def post_json(self, url: str, payload: dict[str, str]) -> dict[str, object] | None:
        raise NotImplementedError


class _UrllibTransport(_Transport):
    def post_json(self, url: str, payload: dict[str, str]) -> dict[str, object] | None:
        raw_request = request.Request(
            url=url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(raw_request, timeout=10) as response:
            raw_body = response.read()
        if not raw_body:
            return None
        return json.loads(raw_body.decode("utf-8"))


def _extract_provider_message_id(response: dict[str, object]) -> str | None:
    if "message_id" in response and response["message_id"] is not None:
        return str(response["message_id"])
    meta = response.get("meta")
    if isinstance(meta, dict) and meta.get("request_id") is not None:
        return str(meta["request_id"])
    return None
