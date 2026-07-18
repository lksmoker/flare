<!-- @context: { "kind": "delivery.work_items", "layer": "docs", "name": "Flare Signed-In Persistence Follow-Up Work Items", "domains": ["delivery", "persistence", "backend", "trace"] } -->

# Flare Signed-In Persistence Follow-Up Work Items

## Purpose

Convert the July 18, 2026 signed-in persistence ownership audit into concrete follow-up work.

Source audit:

- `docs/20_architecture/flare_signed_in_persistence_ownership_audit_2026-07.md`

## Work Items

### 1. Backend-own checkpoint / reflection persistence

- Priority: `P0`
- Why: This is the smallest remaining signed-in mutation that already spans `checkpoint_reflections` and `flare_events`.
- Scope:
  - add one authenticated backend route for signed-in checkpoint/reflection save
  - insert the reflection row and advance flare-event lifecycle in one backend-owned service boundary
  - retire the direct signed-in two-write path from `frontend/src/state/FlareEventContext.tsx`
- Acceptance criteria:
  - one signed-in request can persist the reflection and event-status transition without split state
  - idempotency or duplicate-submit behavior is explicitly defined
  - history and response reads still show the same participant-visible result
  - failure diagnostics identify whether the reflection insert or lifecycle transition failed
- Validation:
  - focused backend tests for owner isolation, duplicate-submit behavior, and transactional failure handling
  - focused frontend tests proving the signed-in path hydrates backend-owned results instead of preserving direct-write assumptions

### 2. Backend-own anchor-note version advancement

- Priority: `P1`
- Why: `anchor_notes.version` is currently computed from client-held state even though `flare_events.anchor_note_version` depends on it for historical meaning.
- Scope:
  - add one authenticated backend route for anchor-note save
  - compute the next version server-side
  - preserve the existing UI contract for load and save
- Acceptance criteria:
  - concurrent or repeated saves cannot reuse a stale client-computed next version silently
  - signed-in event creation still links to a stable anchor-note version
  - no raw anchor-note content is added to diagnostics or trace data
- Validation:
  - backend tests for monotonic version advancement and owner isolation
  - frontend tests for backend-hydrated save results

### 3. Operationalize Trace V0 stale completion and retention cleanup

- Priority: `P1`
- Why: Manual SQL exists for stale completion and bounded retention, but lifecycle execution still depends on operator discipline rather than an explicit owner.
- Scope:
  - choose one execution owner: backend job, scheduled operator command, or equivalent explicit runbook-owned path
  - keep Trace V0 initiation client-owned
  - keep retention bounded to the existing contract unless the contract changes first
- Acceptance criteria:
  - stale traces can be marked terminal without ad hoc SQL discovery
  - retention cleanup has an explicit cadence and invocation path
  - test traces remain safely identifiable and excludable
- Validation:
  - one synthetic stale trace cleanup exercise
  - one bounded retention cleanup exercise against non-production or test rows

## Recommended Order

1. Backend-own checkpoint / reflection persistence
2. Backend-own anchor-note version advancement
3. Operationalize Trace V0 stale completion and retention cleanup
