from __future__ import annotations

from dataclasses import dataclass
from http import HTTPStatus

from psycopg2 import extras

from backend.app.services.flare_plan_config import FlarePlanDatabaseConfig


@dataclass(frozen=True)
class FlareTraceFailureUpdate:
    failure_code: str
    failure_stage: str
    terminal_http_status: int | None = None


class PostgresFlareTraceRepository:
    def __init__(self, *, config: FlarePlanDatabaseConfig) -> None:
        self._config = config

    def record_backend_received(self, *, trace_id: str, user_id: str) -> bool:
        return self._update_trace(
            trace_id=trace_id,
            user_id=user_id,
            sql="""
                update public.flare_event_traces
                set request_attempt_count = request_attempt_count + 1,
                    backend_received_at = coalesce(backend_received_at, now()),
                    status = case
                        when status in ('completed', 'failed') then status
                        else 'backend_received'
                    end
                where trace_id = %s
                  and user_id = %s
                """,
            params=(trace_id, user_id),
        )

    def record_authenticated(self, *, trace_id: str, user_id: str) -> bool:
        return self._update_trace(
            trace_id=trace_id,
            user_id=user_id,
            sql="""
                update public.flare_event_traces
                set authenticated_at = coalesce(authenticated_at, now()),
                    status = case
                        when status in ('completed', 'failed') then status
                        else 'authenticated'
                    end
                where trace_id = %s
                  and user_id = %s
                """,
            params=(trace_id, user_id),
        )

    def record_validated(self, *, trace_id: str, user_id: str) -> bool:
        return self._update_trace(
            trace_id=trace_id,
            user_id=user_id,
            sql="""
                update public.flare_event_traces
                set validated_at = coalesce(validated_at, now()),
                    status = case
                        when status in ('completed', 'failed') then status
                        else 'validated'
                    end
                where trace_id = %s
                  and user_id = %s
                """,
            params=(trace_id, user_id),
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
        return self._update_trace(
            trace_id=trace_id,
            user_id=user_id,
            sql="""
                update public.flare_event_traces
                set flare_event_id = %s,
                    flare_event_created_at = %s::timestamp with time zone,
                    completed_at = coalesce(completed_at, now()),
                    terminal_http_status = %s,
                    status = 'completed',
                    failure_stage = null,
                    failure_code = null,
                    failed_at = null
                where trace_id = %s
                  and user_id = %s
                  and status <> 'failed'
                """,
            params=(
                flare_event_id,
                flare_event_created_at,
                int(terminal_http_status),
                trace_id,
                user_id,
            ),
        )

    def record_failed(
        self,
        *,
        trace_id: str,
        user_id: str,
        failure: FlareTraceFailureUpdate,
    ) -> bool:
        status_value = (
            failure.terminal_http_status.value
            if isinstance(failure.terminal_http_status, HTTPStatus)
            else failure.terminal_http_status
        )
        return self._update_trace(
            trace_id=trace_id,
            user_id=user_id,
            sql="""
                update public.flare_event_traces
                set status = 'failed',
                    failure_stage = %s,
                    failure_code = %s,
                    failed_at = coalesce(failed_at, now()),
                    terminal_http_status = %s
                where trace_id = %s
                  and user_id = %s
                  and status not in ('completed', 'failed')
                """,
            params=(
                failure.failure_stage,
                failure.failure_code,
                status_value,
                trace_id,
                user_id,
            ),
        )

    def _update_trace(
        self,
        *,
        trace_id: str,
        user_id: str,
        sql: str,
        params: tuple[object, ...],
    ) -> bool:
        if not trace_id.strip() or not user_id.strip():
            return False
        connection = self._config.connect()
        with connection:
            with connection.cursor(cursor_factory=extras.RealDictCursor) as cursor:
                cursor.execute(sql, params)
                return cursor.rowcount > 0
