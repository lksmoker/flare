<!-- @context: { "kind": "architecture.audit", "layer": "docs", "name": "Flare Signed-In Persistence Ownership Audit 2026-07", "domains": ["architecture", "persistence", "ownership", "supabase", "backend"] } -->

# Flare Signed-In Persistence Ownership Audit 2026-07

Status: draft
Doc Type: architecture audit
Role: Inventory the remaining signed-in direct Supabase writes, classify their ownership, and recommend the next boundary changes after backend-owning signed-in `Send Flare`.

## Purpose

This audit answers one architecture question:

- Which signed-in Flare mutations should remain direct authenticated Supabase writes, and which should move behind the backend?

It is based on repository state inspected on July 18, 2026 after the signed-in `Send Flare` create path was moved behind `POST /api/flare-events`.

## Governing Inputs

- `docs/20_architecture/flare_plan_persistence_path_decision.md`
- `docs/20_architecture/flare_v0_data_persistence_contract.md`
- `docs/00_product/contracts/flare_minimal_trace_v0_contract.md`
- `db/migrations/20260627_230500_flare_v0_persistence.sql`
- `db/migrations/20260717120000_flare_minimal_trace_v0.sql`
- `C:/dev/dev-toolbox-starter/.toolbox/schema_supabase.json` generated `2026-07-18 02:58:25` UTC

## Current Ownership Baseline

The signed-in write model is already mixed by design.

- Backend-owned today:
  - signed-in `Send Flare` creation through `frontend/src/services/flareResponseApi.ts` to `backend/app/api/flare_plan_api.py`
  - Flare Plan configuration and run mutations through `frontend/src/services/flarePlanApi.ts` to `backend/app/api/flare_plan_api.py`
  - support-channel configuration, reconnect, disable, test-send, and real-send through `frontend/src/services/supportChannelApi.ts` to `backend/app/api/support_channels_api.py`
- Direct authenticated Supabase writes still active today:
  - `behavior_patterns`
  - `anchor_notes`
  - `flare_events` archive and status updates
  - `checkpoint_reflections`
  - `flare_event_traces`

The direct signed-in `flare_events` create helper still exists in `frontend/src/services/flareEventRepository.ts`, but it is no longer the active signed-in `Send Flare` path and should not be treated as the authoritative create boundary.

## Classification Rule

Use this rule for the remaining signed-in writes:

- Keep client-side when the mutation is simple owner-scoped CRUD and RLS already expresses the full safety boundary.
- Move to backend when the mutation enforces domain invariants, coordinates multiple records, depends on version monotonicity, or benefits from backend-owned diagnostics and idempotent orchestration.

## Remaining Direct Write Inventory

| Surface | Active entrypoints | Tables | Current write shape | Classification | Why |
| --- | --- | --- | --- | --- | --- |
| Behavior Pattern save | `frontend/src/state/BehaviorPatternContext.tsx`, `frontend/src/services/behaviorPatternRepository.ts` | `behavior_patterns` | Single-row insert or update scoped by `user_id` | Keep client-side | This is simple owner-scoped configuration CRUD. RLS already constrains insert and update to the authenticated owner, and no cross-record invariant is enforced outside the table itself. |
| Anchor Note save | `frontend/src/state/AnchorNoteContext.tsx`, `frontend/src/services/anchorNoteRepository.ts` | `anchor_notes` | Single-row insert or update with client-computed `version` increment | Move to backend | `version` is domain-significant because `flare_events.anchor_note_version` points to it. The next version is currently computed in the client from cached state, which is vulnerable to concurrent or cross-device races and weakens the historical meaning of event-to-note linkage. |
| Flare Event archive / restore | `frontend/src/state/FlareEventContext.tsx`, `frontend/src/services/flareEventRepository.ts` | `flare_events` | Single-row update of `archived_at` scoped by `id` and `user_id` | Keep client-side | Archive and restore are history-visibility toggles on one owner-scoped row. They do not currently coordinate plan, support-send, or trace records and do not require transactional multi-record work. |
| Checkpoint / Reflection save | `frontend/src/state/FlareEventContext.tsx`, `frontend/src/services/checkpointReflectionRepository.ts`, `frontend/src/services/flareEventRepository.ts` | `checkpoint_reflections`, `flare_events` | Insert reflection row, then update flare-event status in a second request | Move to backend | This is already a multi-record lifecycle mutation. The current client path can persist a reflection row and still fail to advance `flare_events.status`, leaving split truth across tables. It also prevents one backend-owned diagnostic and idempotency boundary for post-flare completion. |
| Flare trace initiation and client-observed failure marking | `frontend/src/services/sendFlareWithTrace.ts`, `frontend/src/services/flareTraceRepository.ts` | `flare_event_traces` | Owner-scoped insert of `initiated`, owner-scoped update for bounded client-observed terminal failures | Keep client-side | Minimal Trace V0 intentionally requires best-effort owner-scoped pre-backend evidence. Moving initiation behind the backend would reopen the exact investigability gap Trace V0 was designed to close. |

## Recommendation

The highest-value next implementation is:

- Backend-own checkpoint / reflection persistence first.

Why this is the best next boundary:

- It is the smallest remaining signed-in mutation that already spans two tables.
- It changes user-meaningful lifecycle state, not just stored text.
- It can be moved without reopening the signed-out fallback model or the Trace V0 design.
- It removes the most obvious remaining split between backend-owned `Send Flare` creation and client-owned post-flare completion.

The second backend migration candidate is:

- Anchor Note save with server-side version advancement.

That change matters, but it is less urgent than checkpoint/reflection because it does not currently require a coordinated multi-record transaction on every write.

## What Should Stay Direct

These direct writes remain justified for now:

- `behavior_patterns` save
- `flare_events` archive / restore
- `flare_event_traces` initiation and bounded client-observed failure updates

Each of these still fits the current rule:

- one owner-scoped record
- RLS expresses the main safety boundary
- no cross-record transactional behavior is required today

## Follow-Up Work

1. Build a backend-owned checkpoint/reflection route that inserts the reflection row and advances the flare-event lifecycle in one service boundary.
2. Build a backend-owned anchor-note save route that computes the next `version` server-side.
3. Keep Trace V0 initiation client-owned, but move stale completion and retention cleanup from manual SQL to an explicit backend or operator-managed lifecycle path.

## Validation Expectations For Follow-Up

Any migration from direct client writes to backend ownership should prove:

- owner isolation still holds
- the old direct write path is no longer the authoritative signed-in mutation
- domain state cannot split across partially completed writes
- live read models and history screens still reflect the same user-visible result
- failure diagnostics become more explicit, not less
