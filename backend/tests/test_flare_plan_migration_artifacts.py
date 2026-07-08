from __future__ import annotations

import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
MIGRATION_PATH = REPO_ROOT / "db" / "migrations" / "20260708073000_flare_plan_v0_persistence.sql"


class FlarePlanMigrationArtifactTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.sql = MIGRATION_PATH.read_text(encoding="utf-8")

    def test_migration_creates_required_tables(self) -> None:
        for table_name in (
            "public.flare_plans",
            "public.flare_plan_starter_templates",
            "public.flare_plan_actions",
            "public.flare_plan_runs",
            "public.flare_plan_run_actions",
            "public.flare_plan_run_checkpoints",
            "public.flare_plan_idempotency_keys",
        ):
            self.assertIn(f"create table {table_name}", self.sql)

    def test_active_plan_and_run_uniqueness_are_indexed(self) -> None:
        self.assertIn("create unique index idx_flare_plans_one_active_per_user", self.sql)
        self.assertIn("create unique index idx_flare_plan_runs_one_per_event", self.sql)

    def test_action_and_checkpoint_domain_checks_exist(self) -> None:
        for fragment in (
            "constraint flare_plan_actions_status_check check (status in ('active', 'archived'))",
            "constraint flare_plan_run_actions_outcome_check check (\n        outcome in ('pending', 'done', 'skipped', 'not_reached')",
            "constraint flare_plan_run_checkpoints_status_check check (\n        status in ('not_offered', 'pending', 'completed', 'skipped')",
            "constraint flare_plan_run_checkpoints_response_check check (\n        response is null or response in ('better', 'about_the_same', 'worse', 'not_sure')",
            "constraint flare_plan_run_checkpoints_next_choice_check check (\n        next_choice is null",
        ):
            self.assertIn(fragment, self.sql)

    def test_duplicate_template_selection_and_positions_are_constrained(self) -> None:
        for index_name in (
            "idx_flare_plan_actions_active_template_key",
            "idx_flare_plan_actions_active_position",
            "idx_flare_plan_run_actions_position",
            "idx_flare_plan_run_actions_source_action",
        ):
            self.assertIn(index_name, self.sql)

    def test_contiguous_position_validation_is_present(self) -> None:
        for function_name in (
            "public.assert_flare_plan_positions_contiguous",
            "public.assert_flare_plan_run_positions_contiguous",
            "flare_plan_actions_positions_contiguous",
            "flare_plan_run_actions_positions_contiguous",
        ):
            self.assertIn(function_name, self.sql)

    def test_starter_templates_are_seeded_with_stable_keys(self) -> None:
        template_keys = set(
            re.findall(r"\(\s*'([a-z0-9_]+)'\s*,\s*'[^']+'\s*,", self.sql)
        )
        expected = {
            "move_to_different_room",
            "step_outside_for_two_minutes",
            "drink_a_glass_of_water",
            "take_ten_slow_breaths",
            "open_my_anchor_note",
            "set_a_two_minute_timer",
            "text_someone_safe",
            "send_another_support_signal",
        }
        self.assertTrue(expected.issubset(template_keys))

    def test_legacy_migration_uses_preferred_recovery_actions_and_is_idempotent(self) -> None:
        for fragment in (
            "bp.preferred_recovery_actions",
            "bp.is_primary desc",
            "legacy_behavior_pattern_id",
            "where not exists (\n    select 1\n    from public.flare_plan_actions existing",
        ):
            self.assertIn(fragment, self.sql)

    def test_rls_and_grants_cover_new_tables(self) -> None:
        for fragment in (
            "alter table public.flare_plans enable row level security;",
            "grant select on public.flare_plan_starter_templates to authenticated;",
            "create policy \"flare_plans_owner_select\"",
            "create policy \"flare_plan_runs_owner_select\"",
            "create policy \"flare_plan_run_actions_owner_select\"",
            "create policy \"flare_plan_run_checkpoints_owner_select\"",
            "create policy \"flare_plan_idempotency_keys_owner_select\"",
        ):
            self.assertIn(fragment, self.sql)


if __name__ == "__main__":
    unittest.main()
