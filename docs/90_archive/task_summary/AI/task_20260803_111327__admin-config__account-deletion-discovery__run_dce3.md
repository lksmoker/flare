Run name: Confirm private-test account deletion handling

# Build Run Summary

## Phase 1 - Implementation
- scope:
  - Inspected the target Flare persistence docs, related contracts, migrations, backend/frontend auth and support-channel surfaces, relevant tests, the canonical schema snapshot at `C:/dev/dev-toolbox-starter/.toolbox/schema_supabase.json`, and a live read-only Postgres schema probe through the configured `FLARE_POSTGRES_DSN`.
  - Documented the bounded private-test account-deletion decision in the three authoritative docs without implementing any destructive route, migration, or remote auth mutation.
  - Separated Supabase Auth identity deletion from Flare application-record deletion, added the current data-category/disposition matrix, documented the operator procedure, and marked the executable path blocked where retention and operator-control gaps remain.
- files changed:
  - `docs/20_architecture/flare_v0_data_persistence_contract.md`
  - `docs/40_delivery/flare_v0_launch_gate_status.md`
  - `docs/40_delivery/flare_v0_known_limitations.md`
  - `docs/90_archive/task_summary/AI/task_20260803_111327__admin-config__account-deletion-discovery__run_dce3.md`
- tests run:
  - `npm run test`
  - `npm run lint`
  - `npm run typecheck`
  - `python -m unittest backend.tests.test_flare_plan_run_v0 backend.tests.test_support_channels_api backend.tests.test_support_channel_sender backend.tests.test_flare_trace_policy`
  - Read-only live-schema probe through `FLARE_POSTGRES_DSN`
- initial result:
  - Repository and live-schema evidence confirm that the current Flare tables linked to a participant account are:
    - `auth.users`
    - `public.behavior_patterns`
    - `public.anchor_notes`
    - `public.flare_events`
    - `public.checkpoint_reflections`
    - `public.flare_plans`
    - `public.flare_plan_actions`
    - `public.flare_plan_runs`
    - `public.flare_plan_run_actions`
    - `public.flare_plan_run_checkpoints`
    - `public.flare_plan_idempotency_keys`
    - `public.support_channels`
    - `public.support_channel_delivery_attempts`
    - `public.support_channel_provider_configs`
    - `public.flare_event_traces`
  - Live read-only schema evidence on August 3, 2026 confirmed that all user-owned Flare tables above except the run/action child tables link directly or indirectly to `auth.users`, with `on delete cascade` on every current `user_id` foreign key.
  - Current deletion readiness is blocked, not executable:
    - There is no implemented Supabase Auth deletion control in this repo.
    - `flare_event_traces` retention versus immediate deletion remains a required human decision under Minimal Trace V0.
    - `support_channel_delivery_attempts` retention versus immediate deletion remains a required human decision for private-test operations.
    - No separately approved synthetic destructive dry run exists.
  - Current data-category and disposition matrix:

    | Data category | Surface | Current disposition | Evidence |
    | --- | --- | --- | --- |
    | Auth identity | `auth.users` | blocked pending approved operator control | live schema probe; frontend auth code shows sign-up/sign-in/sign-out only |
    | Behavior setup | `public.behavior_patterns` | delete with auth deletion | V0 persistence migration; live FK probe |
    | Anchor-note setup | `public.anchor_notes` | delete with auth deletion | V0 persistence migration; live FK probe |
    | Flare event history | `public.flare_events` | delete with auth deletion | V0 persistence migration; live FK probe |
    | Checkpoint / Reflection | `public.checkpoint_reflections` | delete with auth deletion | V0 persistence migration; live FK probe |
    | Flare Plan container | `public.flare_plans` | delete with auth deletion | Flare Plan migration; live FK probe |
    | Flare Plan saved actions | `public.flare_plan_actions` | delete with auth deletion | Flare Plan migration; live FK probe |
    | Flare Plan run | `public.flare_plan_runs` | delete with auth deletion | Flare Plan migration; live FK probe |
    | Flare Plan run actions | `public.flare_plan_run_actions` | delete with auth deletion | Flare Plan migration; live FK probe |
    | Flare Plan run checkpoints | `public.flare_plan_run_checkpoints` | delete with auth deletion | Flare Plan migration; live FK probe |
    | Flare Plan idempotency records | `public.flare_plan_idempotency_keys` | delete with auth deletion | Flare Plan migration; live FK probe |
    | Support-channel configuration | `public.support_channels` | delete with auth deletion | support-channel migrations; live FK probe |
    | Support delivery attempts | `public.support_channel_delivery_attempts` | unresolved pending retention decision | support-channel migrations; runtime evidence doc; live FK probe |
    | Backend-only provider config | `public.support_channel_provider_configs` | delete with auth deletion | provider-config migration; live FK probe |
    | Minimal Trace V0 | `public.flare_event_traces` | unresolved pending retention decision | Minimal Trace contract; trace migration; live FK probe |
    | Signed-out local-only state | device-local / in-memory state | participant-device cleanup required | signed-out fallback docs and tests |
    | GroupMe-side provider records and messages | external GroupMe systems | retained outside Flare control | support-channel contract and validation note |
  - Proposed operator procedure:
    1. Intake deletion request through the private-test support path and record participant id, account email, and requested scope.
    2. Verify the requester controls the Flare account email before any destructive approval.
    3. Confirm the participant understands that Flare has no self-serve delete/export UX, GroupMe-side messages remain outside Flare control, and device-local cleanup may still require sign-out or app/browser removal.
    4. Review whether open incidents or support investigations require temporary retention of trace or delivery-attempt evidence.
    5. If trace or delivery-attempt retention is unresolved, stop and escalate rather than deleting by default.
    6. Treat app-record verification and Supabase Auth deletion as separate governed steps:
       - read back participant-owned Flare rows before deletion
       - execute the approved auth deletion control
       - read back the same tables after deletion and confirm removal or approved retention
    7. Send participant confirmation that distinguishes Flare-deleted data, intentionally retained data, and third-party/device-local data outside Flare control.
    8. If any readback or destructive step fails, stop, record the evidence, and keep the executable procedure blocked.
  - Repository and live-schema evidence inspected:
    - `docs/20_architecture/flare_v0_data_persistence_contract.md`
    - `docs/40_delivery/flare_v0_launch_gate_status.md`
    - `docs/40_delivery/flare_v0_known_limitations.md`
    - `docs/00_product/contracts/flare_plan_v0_contract.md`
    - `docs/00_product/contracts/flare_external_support_channel_v0.md`
    - `docs/00_product/contracts/flare_minimal_trace_v0_contract.md`
    - `docs/00_product/contracts/flare_private_testing_v0_contract.md`
    - `docs/20_architecture/flare_runtime_evidence_and_ai_investigation_v0.md`
    - `docs/20_architecture/flare_signed_in_persistence_ownership_audit_2026-07.md`
    - `db/migrations/20260627_230500_flare_v0_persistence.sql`
    - `db/migrations/20260702_110000_flare_events_archive_support.sql`
    - `db/migrations/20260705220110_external_support_channel_v0.sql`
    - `db/migrations/20260706112500_support_channel_provider_configs.sql`
    - `db/migrations/20260708073000_flare_plan_v0_persistence.sql`
    - `db/migrations/20260709030000_flare_plan_run_declined_at.sql`
    - `db/migrations/20260717120000_flare_minimal_trace_v0.sql`
    - `frontend/src/services/flareSupabaseAuth.ts`
    - `frontend/src/components/AuthStatusCard.tsx`
    - `backend/app/api/flare_plan_api.py`
    - `backend/app/services/flare_plan_service.py`
    - `backend/app/db/flare_plan_repository.py`
    - `backend/app/db/flare_trace_repository.py`
    - `backend/app/services/flare_trace_service.py`
    - `backend/app/api/support_channels_api.py`
    - `backend/app/db/support_channel_repository.py`
    - `C:/dev/dev-toolbox-starter/.toolbox/schema_supabase.json`
    - live read-only Postgres metadata queries against the configured Flare database on August 3, 2026

## Phase 2 - Review and Gap Closure
- compared against:
  - the build instruction and completion-output requirements
  - the work-item scope, non-scope, preservation invariants, acceptance criteria, and fail-closed safety classification
  - `docs/20_architecture/TOOLBOX_CONSTITUTION.md`
  - `docs/00_product/contracts/flare_minimal_trace_v0_contract.md`
  - `docs/00_product/contracts/flare_private_testing_v0_contract.md`
- gaps identified:
  - Phase 1 still needed live-schema confirmation rather than relying only on checked-in migrations and the July 18, 2026 schema snapshot.
  - The first pass needed to state more explicitly that `support_channel_delivery_attempts` absence is not proof that no blocked send occurred because the missing-channel path does not insert a row.
  - The work item required explicit human-review questions and separate follow-up proposals for missing executable capability.
  - Root `npm` validation alone did not cover backend ownership/support/trace suites because `package.json` only delegates to the frontend workspace.
- fixes applied:
  - Ran a read-only live Postgres probe and confirmed current tables, RLS policies, and FK delete rules, including the direct `auth.users` cascades.
  - Added the deletion decision, data-category matrix, operator procedure, and blocking gaps to `docs/20_architecture/flare_v0_data_persistence_contract.md`.
  - Updated `docs/40_delivery/flare_v0_launch_gate_status.md` to move deletion from “documented/deferred” to an explicit blocked launch-gate item with the August 3, 2026 live-schema evidence.
  - Updated `docs/40_delivery/flare_v0_known_limitations.md` to state that account deletion remains operator-mediated and blocked pending auth-control and retention decisions.
  - Ran backend unit suites in addition to the required root `npm` commands.
- remaining gaps:
  - Human review still required:
    - `HR-1`: Is an operator-mediated deletion procedure acceptable for the initial limited private-test cohort, or is self-service deletion required before enrollment?
    - `HR-2`: For `flare_event_traces`, `support_channel_delivery_attempts`, and any incident/audit evidence, should the procedure delete immediately, anonymize, retain for a bounded period, or remain blocked?
    - `HR-3`: Does the documented evidence and failure-path understanding unblock the operational-minimums assessment and final authenticated smoke test?
  - Executable capability still missing:
    - no approved Supabase Auth user-deletion route or script with readback evidence
    - no approved synthetic destructive dry-run plan using a disposable identity
    - no export implementation
  - Intentionally not changed:
    - no migrations
    - no backend or frontend account-deletion implementation
    - no destructive DB mutation
    - no real participant or synthetic identity deletion
    - no remote provider change
- final assessment:
  - Acceptance criteria covered:
    - `AC-1`: satisfied for currently confirmed user-linked data categories; unresolved retention categories are explicitly marked blocked
    - `AC-2`: satisfied; auth identity deletion and application-record deletion are documented as separate governed operations
    - `AC-3`: satisfied as a bounded blocked procedure with owner, stop conditions, and escalation
    - `AC-4`: satisfied through repository inspection plus live read-only FK/policy evidence
    - `AC-5`: partially satisfied; existing automated tests and live read-only probes were run, but destructive validation remains correctly blocked pending separate approval
    - `AC-6`: satisfied by the three updated docs
    - `AC-7`: satisfied by recording blockers and follow-up proposals instead of implementing them opportunistically
  - Validation results:
    - `npm run test`: passed, 22 frontend suites / 155 tests; existing console warnings remained in persistence-loading test setups
    - `npm run lint`: passed
    - `npm run typecheck`: passed
    - backend unit suites: passed, 41 tests
    - live read-only schema probe: passed; confirmed current tables, FK delete rules, and active policies for the relevant Flare tables
  - Documentation behavior changed:
    - The persistence contract now includes the current private-test deletion decision, data matrix, operator procedure, and blockers.
    - The launch-gate document now treats account deletion as an explicit blocked gate rather than a generic deferred expectation.
    - The known-limitations document now states the current blocked operator-mediated deletion posture and the specific follow-up needed before stronger data-control claims.
  - Separate Codex-ready implementation proposals:
    1. `Implement operator-owned Supabase Auth deletion control with readback evidence`
       - scope: add a backend-only or operator-script path that deletes one disposable or approved participant auth identity, records before/after evidence across the Flare tables, and fails closed on partial results
       - safety classification: destructive, auth-mutating, database-mutating, fail_closed
       - validation: disposable identity only; prove pre/post row readback and expected cascade behavior
    2. `Contract and implement private-test retention handling for trace and support delivery evidence`
       - scope: decide delete/anonymize/bounded-retain behavior for `flare_event_traces` and `support_channel_delivery_attempts`, then add the supporting procedure or tooling
       - safety classification: contract-impacting, potentially destructive, fail_closed
       - validation: update contracts plus a disposable-identity retention/readback exercise
    3. `Create approved synthetic account-deletion dry-run harness`
       - scope: define the disposable identity setup, bounded target rows, cleanup expectations, and operator evidence package for one destructive rehearsal
       - safety classification: destructive test plan, fail_closed
       - validation: run only after explicit human approval
  - Work-item status:
    - remains blocked
    - rationale: discovery completed, but the executable deletion procedure cannot advance until the human retention decisions and the missing auth-deletion control are resolved

## Learning Candidates
{
  "learning_candidates": [
    {
      "status": "candidate",
      "summary": "In the Flare repo, root `npm run test` covers only the frontend workspace, so account/persistence discovery runs still need explicit backend `python -m unittest` coverage for support-channel, Flare Plan, and trace behavior.",
      "learning_type": "workflow_preference",
      "proposed_scope": {
        "type": "feature",
        "feature_slug": "admin-config"
      },
      "guidance": [
        "When a Flare work item depends on backend ownership, support-channel persistence, or trace policy evidence, inspect `package.json` first and add the relevant backend `unittest` suites explicitly.",
        "Record frontend and backend validation separately in the run summary so root `npm` success is not mistaken for full-stack coverage."
      ],
      "anti_guidance": [
        "Do not assume `npm run test` from `C:\\dev\\Flare` validates backend contract behavior just because the command passes."
      ],
      "applies_when": {
        "run_modes": ["build", "repair", "validation", "triage"],
        "file_globs": ["backend/**", "frontend/**", "package.json"],
        "failure_modes": ["backend_validation_missing", "root_test_command_scope_misread"]
      },
      "evidence_refs": [
        "package.json",
        "docs/90_archive/task_summary/AI/task_20260803_111327__admin-config__account-deletion-discovery__run_dce3.md"
      ],
      "confidence": "high",
      "rationale": "This run required backend validation beyond the required root `npm` commands because the repo-level script delegates only to `frontend`, while the discovery conclusions depended on backend route, support-channel, and trace behavior."
    }
  ]
}

## Diff
- terminal_state_snapshot: completed
- files_changed: 4
- insertions: 321
- deletions: 4
- note: terminal_state_snapshot reflects the run state when diff metadata was captured.
- changed_files:
  - docs/20_architecture/flare_v0_data_persistence_contract.md
  - docs/40_delivery/flare_v0_known_limitations.md
  - docs/40_delivery/flare_v0_launch_gate_status.md
  - docs/90_archive/task_summary/AI/task_20260803_111327__admin-config__account-deletion-discovery__run_dce3.md
## Validation Summary
- validation_requested: true
- validation_ran: true
- validation_result: passed
- tests_run: npm run test, npm run lint, npm run typecheck, python -m unittest backend.tests.test_flare_plan_run_v0 backend.tests.test_support_channels_api backend.tests.test_support_channel_sender backend.tests.test_flare_trace_policy, Read-only live-schema probe through `FLARE_POSTGRES_DSN
- summary: Validation details were derived from the Build Run Summary body.
## Final Run State
- terminal_state: completed
- summary_written: true
- validation_requested: true
- validation_ran: true
- validation_result: passed
- tests_run: npm run test, npm run lint, npm run typecheck, python -m unittest backend.tests.test_flare_plan_run_v0 backend.tests.test_support_channels_api backend.tests.test_support_channel_sender backend.tests.test_flare_trace_policy, Read-only live-schema probe through `FLARE_POSTGRES_DSN
