from __future__ import annotations

import unittest

from backend.app.db.flare_plan_repository import PostgresFlarePlanRepository
from backend.app.services.flare_plan_config import FlarePlanDatabaseConfig


class PostgresFlarePlanRepositorySqlTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = PostgresFlarePlanRepository(
            config=FlarePlanDatabaseConfig(dsn="postgresql://unused"),
        )

    def test_reorder_uses_plan_lock_and_two_phase_position_updates(self) -> None:
        first_id = "11111111-1111-1111-1111-111111111111"
        second_id = "22222222-2222-2222-2222-222222222222"
        third_id = "33333333-3333-3333-3333-333333333333"
        cursor = _FakeCursor(
            plan={"id": "plan-1", "user_id": "user-1", "updated_at": "2026-07-08T00:00:00Z"},
            actions=[
                _action_row(first_id, position=1),
                _action_row(second_id, position=2),
                _action_row(third_id, position=3),
            ],
        )

        response = self.repository._reorder_actions(
            cursor=cursor,
            user_id="user-1",
            action_ids=[third_id, first_id, second_id],
        )

        self.assertEqual(200, int(response[0]))
        self.assertEqual(
            [third_id, first_id, second_id],
            [action["id"] for action in response[1]["plan"]["actions"]],
        )
        self.assertIn("for update", cursor.statements[1])
        self.assertTrue(
            any("action.id = any(%s::uuid[])" in statement for statement in cursor.statements),
            cursor.statements,
        )
        self.assertEqual(
            [
                (first_id, 4),
                (second_id, 5),
                (third_id, 6),
                (third_id, 1),
                (first_id, 2),
                (second_id, 3),
            ],
            cursor.position_updates,
        )


class _FakeCursor:
    def __init__(self, *, plan: dict[str, object], actions: list[dict[str, object]]) -> None:
        self.plan = dict(plan)
        self.actions = [dict(action) for action in actions]
        self.statements: list[str] = []
        self.position_updates: list[tuple[str, int]] = []
        self._fetchone_result: dict[str, object] | None = None
        self._fetchall_result: list[dict[str, object]] = []

    def execute(self, sql: str, params=None) -> None:
        normalized = " ".join(sql.split()).lower()
        self.statements.append(normalized)
        self._fetchone_result = None
        self._fetchall_result = []
        if "from public.flare_plans" in normalized and "where user_id = %s" in normalized:
            self._fetchone_result = dict(self.plan)
            return
        if "from public.flare_plans" in normalized and "for update" in normalized:
            self._fetchone_result = {"id": self.plan["id"]}
            return
        if "from public.flare_plan_actions" in normalized and "order by position asc, id asc" in normalized:
            plan_id = params[0]
            self._fetchall_result = self._active_actions_for_plan(plan_id)
            return
        if (
            "from public.flare_plan_actions action join public.flare_plans plan" in normalized
            and "action.id = any(%s::uuid[])" in normalized
        ):
            user_id, action_ids = params
            self._fetchall_result = [
                dict(action)
                for action in self.actions
                if self.plan["user_id"] == user_id and action["id"] in set(action_ids)
            ]
            return
        if normalized.startswith("update public.flare_plan_actions set position = %s where id = %s"):
            position, action_id = params
            for action in self.actions:
                if action["id"] == action_id:
                    action["position"] = position
                    action["updated_at"] = "2026-07-08T00:00:59Z"
                    self.position_updates.append((str(action_id), int(position)))
                    break
            return
        raise AssertionError(f"Unexpected SQL: {normalized}")

    def fetchone(self):
        return self._fetchone_result

    def fetchall(self):
        return list(self._fetchall_result)

    def _active_actions_for_plan(self, plan_id: object) -> list[dict[str, object]]:
        rows = [
            dict(action)
            for action in self.actions
            if action["plan_id"] == plan_id and action["status"] == "active" and action["archived_at"] is None
        ]
        rows.sort(key=lambda action: (int(action["position"]), str(action["id"])))
        return rows


def _action_row(action_id: str, *, position: int) -> dict[str, object]:
    return {
        "id": action_id,
        "plan_id": "plan-1",
        "source_template_key": None,
        "title": action_id,
        "description": None,
        "position": position,
        "status": "active",
        "archived_at": None,
        "created_at": "2026-07-08T00:00:01Z",
        "updated_at": "2026-07-08T00:00:01Z",
    }


if __name__ == "__main__":
    unittest.main()
