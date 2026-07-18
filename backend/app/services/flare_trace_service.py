from __future__ import annotations

import logging
from dataclasses import dataclass
from http import HTTPStatus
from typing import Protocol

from backend.app.db.flare_trace_repository import (
    FlareTraceFailureUpdate,
    PostgresFlareTraceRepository,
)

_LOGGER = logging.getLogger(__name__)


class FlareTraceLifecycle(Protocol):
    def record_backend_received(self, *, trace_id: str, user_id: str) -> bool:
        ...

    def record_authenticated(self, *, trace_id: str, user_id: str) -> bool:
        ...

    def record_validated(self, *, trace_id: str, user_id: str) -> bool:
        ...

    def record_completed(
        self,
        *,
        trace_id: str,
        user_id: str,
        flare_event_id: str,
        flare_event_created_at: str,
        terminal_http_status: int,
    ) -> bool:
        ...

    def record_failed(
        self,
        *,
        trace_id: str,
        user_id: str,
        failure_stage: str,
        failure_code: str,
        terminal_http_status: int | HTTPStatus | None = None,
    ) -> bool:
        ...


class NoOpFlareTraceService:
    def record_backend_received(self, *, trace_id: str, user_id: str) -> bool:
        return False

    def record_authenticated(self, *, trace_id: str, user_id: str) -> bool:
        return False

    def record_validated(self, *, trace_id: str, user_id: str) -> bool:
        return False

    def record_completed(
        self,
        *,
        trace_id: str,
        user_id: str,
        flare_event_id: str,
        flare_event_created_at: str,
        terminal_http_status: int,
    ) -> bool:
        return False

    def record_failed(
        self,
        *,
        trace_id: str,
        user_id: str,
        failure_stage: str,
        failure_code: str,
        terminal_http_status: int | HTTPStatus | None = None,
    ) -> bool:
        return False


@dataclass(frozen=True)
class FlareTraceService:
    repository: PostgresFlareTraceRepository

    def record_backend_received(self, *, trace_id: str, user_id: str) -> bool:
        return self._run(
            operation="record_backend_received",
            trace_id=trace_id,
            user_id=user_id,
            callback=lambda: self.repository.record_backend_received(trace_id=trace_id, user_id=user_id),
        )

    def record_authenticated(self, *, trace_id: str, user_id: str) -> bool:
        return self._run(
            operation="record_authenticated",
            trace_id=trace_id,
            user_id=user_id,
            callback=lambda: self.repository.record_authenticated(trace_id=trace_id, user_id=user_id),
        )

    def record_validated(self, *, trace_id: str, user_id: str) -> bool:
        return self._run(
            operation="record_validated",
            trace_id=trace_id,
            user_id=user_id,
            callback=lambda: self.repository.record_validated(trace_id=trace_id, user_id=user_id),
        )

    def record_completed(
        self,
        *,
        trace_id: str,
        user_id: str,
        flare_event_id: str,
        flare_event_created_at: str,
        terminal_http_status: int,
    ) -> bool:
        return self._run(
            operation="record_completed",
            trace_id=trace_id,
            user_id=user_id,
            callback=lambda: self.repository.record_completed(
                trace_id=trace_id,
                user_id=user_id,
                flare_event_id=flare_event_id,
                flare_event_created_at=flare_event_created_at,
                terminal_http_status=terminal_http_status,
            )
        )

    def record_failed(
        self,
        *,
        trace_id: str,
        user_id: str,
        failure_stage: str,
        failure_code: str,
        terminal_http_status: int | HTTPStatus | None = None,
    ) -> bool:
        normalized_status = (
            terminal_http_status.value
            if isinstance(terminal_http_status, HTTPStatus)
            else terminal_http_status
        )
        return self._run(
            operation="record_failed",
            trace_id=trace_id,
            user_id=user_id,
            callback=lambda: self.repository.record_failed(
                trace_id=trace_id,
                user_id=user_id,
                failure=FlareTraceFailureUpdate(
                    failure_stage=failure_stage,
                    failure_code=failure_code,
                    terminal_http_status=normalized_status,
                ),
            )
        )

    def _run(self, *, operation: str, trace_id: str, user_id: str, callback) -> bool:
        try:
            return bool(callback())
        except Exception as exc:
            _LOGGER.warning(
                "Flare trace update failed",
                extra={
                    "operation": operation,
                    "trace_id": trace_id,
                    "trace_update_failure_code": exc.__class__.__name__,
                    "trace_user_id": user_id,
                    "trace_db_env": self.repository._config.source_env_name,
                },
                exc_info=True,
            )
            return False
