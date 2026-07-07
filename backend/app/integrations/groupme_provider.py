from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib import error, parse, request

from backend.app.domain.support_channels import (
    SUPPORT_CHANNEL_DELIVERY_STATUS_FAILED,
    SUPPORT_CHANNEL_DELIVERY_STATUS_SENT,
    SUPPORT_CHANNEL_PROVIDER_GROUPME,
    GroupMeUserProfile,
    SupportChannelDestination,
    SupportChannelSendRequest,
    SupportChannelSendResult,
)

GROUPME_OAUTH_AUTHORIZE_URL = "https://oauth.groupme.com/oauth/authorize"
GROUPME_GROUPS_URL = "https://api.groupme.com/v3/groups"
GROUPME_BOTS_URL = "https://api.groupme.com/v3/bots"
GROUPME_BOT_POST_URL = "https://api.groupme.com/v3/bots/post"
GROUPME_USER_ME_URL = "https://api.groupme.com/v3/users/me"


def _send_label(send_kind: str) -> str:
    return "test message" if send_kind == "test" else "support message"


class GroupMeApiError(RuntimeError):
    def __init__(self, *, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


@dataclass(frozen=True)
class GroupMeProviderConfig:
    bot_id: str
    access_token: str | None = None


class GroupMeProvider:
    provider_key = SUPPORT_CHANNEL_PROVIDER_GROUPME

    def __init__(self, transport: "_Transport | None" = None) -> None:
        self._transport = transport or _UrllibTransport()

    def build_oauth_authorize_url(self, *, client_id: str, redirect_uri: str) -> str:
        query = parse.urlencode(
            {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "token",
            }
        )
        return f"{GROUPME_OAUTH_AUTHORIZE_URL}?{query}"

    def get_authenticated_user(self, *, access_token: str) -> GroupMeUserProfile:
        response = self._request_groupme_json(
            method="GET",
            url=GROUPME_USER_ME_URL,
            payload=None,
            access_token=access_token,
            auth_error_code="groupme_auth_invalid",
            auth_error_message="GroupMe authorization is invalid or expired.",
            transport_error_code="groupme_auth_unreachable",
            transport_error_message="GroupMe could not be reached during authorization.",
        )
        user = _extract_user(response)
        if user is None:
            raise GroupMeApiError(
                code="groupme_auth_invalid",
                message="GroupMe authorization response did not include a user.",
                status_code=502,
            )
        return user

    def list_groups(self, *, access_token: str) -> list[SupportChannelDestination]:
        destinations: list[SupportChannelDestination] = []
        page = 1
        per_page = 100
        while True:
            query = parse.urlencode({"page": str(page), "per_page": str(per_page)})
            response = self._request_groupme_json(
                method="GET",
                url=f"{GROUPME_GROUPS_URL}?{query}",
                payload=None,
                access_token=access_token,
                auth_error_code="groupme_auth_invalid",
                auth_error_message="GroupMe authorization is invalid or expired.",
                transport_error_code="groupme_groups_unreachable",
                transport_error_message="GroupMe groups could not be loaded.",
            )
            current_page = _extract_groups(response)
            destinations.extend(current_page)
            if len(current_page) < per_page:
                break
            page += 1
        return destinations

    def create_bot(
        self,
        *,
        access_token: str,
        group_id: str,
        bot_name: str,
        callback_url: str | None = None,
        avatar_url: str | None = None,
    ) -> str:
        bot_payload: dict[str, object] = {
            "name": bot_name,
            "group_id": group_id,
            "active": True,
        }
        if callback_url:
            bot_payload["callback_url"] = callback_url
        if avatar_url:
            bot_payload["avatar_url"] = avatar_url
        response = self._request_groupme_json(
            method="POST",
            url=GROUPME_BOTS_URL,
            payload={"bot": bot_payload},
            access_token=access_token,
            auth_error_code="groupme_auth_invalid",
            auth_error_message="GroupMe authorization is invalid or expired.",
            transport_error_code="groupme_bot_unreachable",
            transport_error_message="GroupMe bot provisioning could not be reached.",
        )
        bot_id = _extract_bot_id(response)
        if not bot_id:
            raise GroupMeApiError(
                code="groupme_bot_invalid",
                message="GroupMe bot provisioning did not return a bot id.",
                status_code=502,
            )
        return bot_id

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
            response = self._transport.request_json(
                method="POST",
                url=GROUPME_BOT_POST_URL,
                payload=payload,
                headers={"Content-Type": "application/json"},
            )
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
                error_message_safe=f"GroupMe rejected the {_send_label(send_request.send_kind)}.",
                raw_provider_status_ref=f"http_status:{exc.code}",
                flare_event_id=send_request.flare_event_id,
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
                error_message_safe=f"GroupMe could not be reached for the {_send_label(send_request.send_kind)}.",
                raw_provider_status_ref="transport:error",
                flare_event_id=send_request.flare_event_id,
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
            flare_event_id=send_request.flare_event_id,
        )

    def _request_groupme_json(
        self,
        *,
        method: str,
        url: str,
        payload: dict[str, object] | None,
        access_token: str,
        auth_error_code: str,
        auth_error_message: str,
        transport_error_code: str,
        transport_error_message: str,
    ) -> dict[str, object] | None:
        try:
            return self._transport.request_json(
                method=method,
                url=url,
                payload=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-Access-Token": access_token,
                },
            )
        except error.HTTPError as exc:
            if exc.code in (401, 403):
                raise GroupMeApiError(
                    code=auth_error_code,
                    message=auth_error_message,
                    status_code=401,
                ) from exc
            raise GroupMeApiError(
                code="groupme_provider_error",
                message=f"GroupMe request failed with status {exc.code}.",
                status_code=502,
            ) from exc
        except error.URLError as exc:
            raise GroupMeApiError(
                code=transport_error_code,
                message=transport_error_message,
                status_code=502,
            ) from exc


class _Transport:
    def request_json(
        self,
        *,
        method: str,
        url: str,
        payload: dict[str, object] | None,
        headers: dict[str, str],
    ) -> dict[str, object] | None:
        raise NotImplementedError


class _UrllibTransport(_Transport):
    def request_json(
        self,
        *,
        method: str,
        url: str,
        payload: dict[str, object] | None,
        headers: dict[str, str],
    ) -> dict[str, object] | None:
        body = None if payload is None else json.dumps(payload).encode("utf-8")
        raw_request = request.Request(
            url=url,
            data=body,
            headers=headers,
            method=method,
        )
        with request.urlopen(raw_request, timeout=10) as response:
            raw_body = response.read()
        if not raw_body:
            return None
        return json.loads(raw_body.decode("utf-8"))


def _extract_user(response: dict[str, object]) -> GroupMeUserProfile | None:
    payload = response.get("response")
    if not isinstance(payload, dict):
        return None

    nested_user = payload.get("user")
    if isinstance(nested_user, dict):
        user_source = nested_user
    else:
        user_source = payload

    user_id = user_source.get("user_id") or user_source.get("id")
    if user_id is None:
        return None

    name = user_source.get("name")
    return GroupMeUserProfile(
        user_id=str(user_id),
        name=str(name) if name else None,
    )

def _extract_groups(response: dict[str, object] | None) -> list[SupportChannelDestination]:
    if not isinstance(response, dict):
        return []
    payload = response.get("response")
    if not isinstance(payload, list):
        return []
    destinations: list[SupportChannelDestination] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        group_id = item.get("id")
        name = item.get("name")
        if group_id is None or name is None:
            continue
        description = item.get("description")
        image_url = item.get("image_url")
        group_type = item.get("type")
        destinations.append(
            SupportChannelDestination(
                id=str(group_id),
                name=str(name),
                description=str(description) if description is not None else None,
                image_url=str(image_url) if image_url is not None else None,
                group_type=str(group_type) if group_type is not None else None,
            )
        )
    return destinations


def _extract_bot_id(response: dict[str, object] | None) -> str | None:
    if not isinstance(response, dict):
        return None
    payload = response.get("response")
    if isinstance(payload, dict):
        bot = payload.get("bot")
        if isinstance(bot, dict) and bot.get("bot_id") is not None:
            return str(bot["bot_id"])
        if payload.get("bot_id") is not None:
            return str(payload["bot_id"])
    return None


def _extract_provider_message_id(response: dict[str, object]) -> str | None:
    if "message_id" in response and response["message_id"] is not None:
        return str(response["message_id"])
    meta = response.get("meta")
    if isinstance(meta, dict) and meta.get("request_id") is not None:
        return str(meta["request_id"])
    return None
