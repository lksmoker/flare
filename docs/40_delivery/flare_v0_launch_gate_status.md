<!-- @context: { "kind": "delivery.gate_status", "layer": "docs", "name": "Flare V0 Launch Gate Status", "domains": ["delivery", "release", "supabase", "mobile", "v0"] } -->

# Flare V0 Launch Gate Status

Status date: July 2, 2026

## Purpose

This document closes the remaining Flare V0 launch-gate items for limited external testing.

It records what is already verified in-repo, what still requires operator confirmation in the live production environment, and what is intentionally deferred to V1 or later.

## Gate Summary

| Gate item | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Production Supabase auth redirect configuration | operator verify before deploy | `docs/40_delivery/flare_v0_production_deployment_checklist.md`, `frontend/src/services/flareSupabaseAuth.ts`, `frontend/src/components/AuthStatusCard.tsx`, `frontend/src/services/__tests__/flareSupabaseAuth.test.ts`, `frontend/src/components/__tests__/AuthStatusCard.test.tsx` | Client code reads only `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL` and passes it to sign-up / magic-link flows. The exact production origin still must be present in Supabase `Site URL` and allowed redirect URLs before release. |
| Production SMTP / outbound auth email configuration | operator verify before deploy | `docs/40_delivery/flare_v0_production_deployment_checklist.md` | Flare depends on Supabase Auth email delivery for password reset / magic-link style flows. This repo does not own production SMTP credentials, so final verification remains an operator task in Supabase. |
| Authenticated ownership and RLS behavior | verified in repo; operator confirm after migrations | `db/migrations/20260627_230500_flare_v0_persistence.sql`, `C:/dev/dev-toolbox-starter/.toolbox/schema_supabase.json`, `frontend/src/services/__tests__/behaviorPatternRepository.test.ts`, `frontend/src/services/__tests__/anchorNoteRepository.test.ts`, `frontend/src/services/__tests__/flareEventRepository.test.ts`, `frontend/src/services/__tests__/checkpointReflectionRepository.test.ts` | Migration grants `authenticated` access, revokes `anon`, enables RLS on all four tables, and enforces owner-only policies with linked-record ownership checks for `flare_events` and `checkpoint_reflections`. Repository queries also scope updates and loads by `user_id`. |
| Signed-out / local-only fallback | verified | `frontend/src/state/__tests__/flareEventPersistenceContext.test.tsx`, `frontend/src/screens/__tests__/app_shell.test.tsx`, `frontend/src/state/FlareEventContext.tsx`, `frontend/src/components/AuthStatusCard.tsx` | When no session exists, the app still supports local-only setup and flare usage, skips Supabase writes, and clears authenticated persisted history on sign-out. |
| V0 data deletion and export expectations | documented; implementation deferred | `docs/20_architecture/flare_v0_data_persistence_contract.md`, `docs/40_delivery/flare_v0_known_limitations.md` | Export and deletion UX are not implemented in V0. External testing should treat archive/restore as history management only, not account-level deletion or data portability. |
| Telegram / support-group follow-up | documented for V1 | `docs/40_delivery/flare_v0_known_limitations.md`, `docs/10_design/flare_v0_app_structure_navigation.md` | `Telegram Support` remains visible as future-scoped direction only. No V0 supporter messaging, contact management, or support-group routing exists. |
| Final mobile viewport pass after blue theme update | verified by source and test pass; live browser spot-check still recommended after deploy | `frontend/src/components/AppShell.tsx`, `frontend/src/screens/FlareScreen.tsx`, `frontend/src/screens/HistoryScreen.tsx`, `frontend/src/screens/CustomizeScreen.tsx`, `frontend/src/screens/__tests__/app_shell.test.tsx`, `docs/90_archive/task_summary/AI/task_20260702_192129__admin-config__blues__run_64a5.md` | Mobile-first layout protections remain in place: single-column shell, scrollable root, wrapped action/filter rows, modal close controls, and no primary action requiring horizontal scrolling in the tested flows. |

## Production Operator Checks

These items remain required before limited external testing begins on a production URL:

1. In Supabase Auth, set `Site URL` to the exact deployed Flare web origin.
2. Add the exact `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL` value to Supabase allowed redirect URLs.
3. Confirm Supabase email delivery is configured for the intended production flow.
4. Send a real auth email from the production project and confirm it lands and redirects back to the production origin.
5. Run the post-deploy mobile-sized smoke path from `docs/40_delivery/flare_v0_production_deployment_checklist.md`.

## Authenticated Ownership / RLS Readout

The checked-in persistence migration establishes the following release assumptions:

- `behavior_patterns`, `anchor_notes`, `flare_events`, and `checkpoint_reflections` all have RLS enabled.
- `anon` receives no table privileges on those four tables.
- `authenticated` receives `select`, `insert`, `update`, and `delete`.
- owner policies use `auth.uid() = user_id`.
- `flare_events` insert/update policies require linked `behavior_patterns` and `anchor_notes` to belong to the same authenticated user.
- `checkpoint_reflections` insert/update policies require the linked `flare_event` to belong to the same authenticated user.

The latest schema snapshot at `C:/dev/dev-toolbox-starter/.toolbox/schema_supabase.json` shows the four Flare tables present in `public`. Live production still needs a post-migration check that the target project matches those policies and grants.

## Signed-Out Fallback Readout

The signed-out path is intentionally local-only in V0:

- no fake user ids are created when there is no session
- setup and flare actions still work in-memory
- repository writes are skipped while signed out
- authenticated persisted history is cleared when auth transitions back to `no-session`
- the auth card remains explicit that the app is in local-only mode until sign-in or config is available

This is acceptable for limited V0 external testing because the signed-out path is framed as fallback behavior, not durable offline sync.

## V0 Data Deletion / Export Expectations

Current V0 expectation for external testers:

- archiving a flare event is not account-level deletion
- no self-serve export exists yet
- no self-serve hard-delete flow exists yet
- product/legal review for broader launch should decide whether V1 starts with hard delete, soft delete, export, or a staged combination

Until that work exists, external testing should avoid promising deletion or export behavior beyond the currently visible archive / restore controls.

## V1 Follow-Up Workstream

The next support-network workstream should stay separate from V0 launch:

1. Define whether the first external support surface is `SupportContact`, `SupportGroup`, `Telegram`, or a different transport.
2. Create a dedicated contract for support-channel entities, consent, message templates, delivery audit, and escalation boundaries.
3. Decide whether support-group routing is one-to-one, one-to-many, or channel-based before any schema is added.
4. Validate privacy, moderation, and failure handling before enabling outbound messaging.

Do not extend V0 recovery entities with hidden Telegram or support-group fields as a shortcut.

## Mobile Viewport Pass

The final mobile-width review for this run was completed as a source-and-regression pass against the active blue-theme code:

- `AppShell` remains single-column with centered max width and root scrolling.
- `FlareScreen` keeps `Send Flare` and `Checkpoint / Reflection` stacked above readiness content.
- `HistoryScreen` keeps search and filter controls wrapped and reachable without horizontal scrolling.
- `CustomizeScreen` keeps auth, setup cards, and future-scoped Telegram content in the same vertical flow.
- Existing modal-based flows retain visible close controls through the shared placeholder/setup modal surfaces already covered by the V0 shell tests.

No browser automation package is installed in this repo, so this run did not capture a device screenshot. A live post-deploy mobile browser spot-check is still recommended, but there is no code-level launch blocker left in the current layout structure.
