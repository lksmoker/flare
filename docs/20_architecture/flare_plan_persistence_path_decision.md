<!-- @context: { "kind": "architecture.decision", "layer": "docs", "name": "Flare Plan Persistence Path Decision", "domains": ["architecture", "persistence", "supabase", "postgres", "flare-plan"] } -->

# Flare Plan Persistence Path Decision

Status: draft  
Doc Type: architecture decision  
Role: Record how Flare Plan persistence aligns with the existing Flare backend and Supabase architecture.

## Decision

Keep Flare Plan on direct Postgres for V0 configuration mutations and use an explicit backend-only DSN setting: `FLARE_POSTGRES_DSN`.

Do not reinterpret the existing Supabase HTTPS project URL variables as psycopg2 connection strings. `FLARE_SUPABASE_DB_URL` remains only a deprecated fallback for direct Postgres consumers that have not yet moved to `FLARE_POSTGRES_DSN`.

## Current Persistence Matrix

| Domain | Entrypoint | Persistence boundary | Transport | Auth model | Transaction and locking posture |
| --- | --- | --- | --- | --- | --- |
| Flare Event creation and run-offer creation | `frontend/src/services/flareResponseApi.ts`, `backend/app/api/flare_plan_api.py`, `backend/app/db/flare_plan_repository.py` | Backend repository over psycopg2 | Authenticated HTTPS API to backend, then direct Postgres | End-user bearer auth at route boundary; backend-only DSN for persistence | Multi-statement transactions, idempotency coordination, trace lifecycle updates, and run snapshot creation |
| Flare Event archive / restore / reflected status follow-up | `frontend/src/services/flareEventRepository.ts` | Frontend Supabase client | Supabase JS over HTTPS/PostgREST | End-user session with RLS | Single-row updates today, except reflected-status advancement is still coordinated from the client |
| Checkpoint / Reflection save | `frontend/src/services/checkpointReflectionRepository.ts`, `frontend/src/state/FlareEventContext.tsx` | Frontend Supabase client | Supabase JS over HTTPS/PostgREST | End-user session with RLS | Two separate client-coordinated writes across `checkpoint_reflections` and `flare_events`; no backend transaction yet |
| Behavior Patterns | `frontend/src/services/behaviorPatternRepository.ts` | Frontend Supabase client | Supabase JS over HTTPS/PostgREST | End-user session with RLS | Simple owner-scoped reads and writes |
| Anchor Notes | `frontend/src/services/anchorNoteRepository.ts` | Frontend Supabase client | Supabase JS over HTTPS/PostgREST | End-user session with RLS | Single-row writes today, but client computes the next version |
| Flare Trace initiation | `frontend/src/services/sendFlareWithTrace.ts`, `frontend/src/services/flareTraceRepository.ts` | Frontend Supabase client for initiation and client-observed failure updates; backend service for later lifecycle advancement | Supabase JS over HTTPS/PostgREST plus authenticated backend API path | End-user session with RLS for initiation; backend service role / DSN for later lifecycle updates | Best-effort owner-scoped initiation plus bounded backend lifecycle updates; stale/retention cleanup is currently manual SQL |
| Support Channels | `backend/app/http/app.py`, `backend/app/db/support_channel_repository.py` | Backend repository over Supabase REST | HTTPS/PostgREST with `urllib` | Service role on backend; user auth resolved separately | Request-scoped writes; no explicit SQL row locks |
| Support-Channel Provider Config | `backend/app/db/support_channel_repository.py` | Backend repository over Supabase REST | HTTPS/PostgREST with `urllib` | Service role on backend | Request-scoped writes; no explicit SQL row locks |
| Flare Plan | `backend/app/http/app.py`, `backend/app/db/flare_plan_repository.py` | Backend repository over psycopg2 | Direct Postgres | Backend-only DSN; database constraints and policies still apply | Multi-statement transactions, `FOR UPDATE`, deferred constraint triggers, idempotency row coordination |

## Why Flare Plan Is Different

The current Flare Plan repository and migration rely on database behavior that the established HTTPS paths do not express cleanly:

- lazy active-plan creation under one-active-plan-per-user uniqueness
- append-at-next-position writes under active-position uniqueness
- duplicate starter-template prevention with idempotency replay
- archive plus contiguous resequencing
- full-plan reorder with row locking and two-phase position updates
- idempotency record creation and mutation completion in the same transaction
- deferred contiguous-position validation triggers

These operations are currently implemented as explicit transaction blocks plus `SELECT ... FOR UPDATE`. Replacing them with ordinary PostgREST calls would require either:

- moving the mutation logic into RPC/database functions, or
- weakening the correctness guarantees already encoded in the repository and migration

V0 should not weaken those guarantees.

## Options Considered

### Option A: Keep direct Postgres for Flare Plan

- Correctness: strong fit for current repository behavior
- Cost: requires a backend-only DSN and connection-management discipline
- Result: chosen

### Option B: Move Flare Plan to existing Supabase HTTP clients

- Correctness: insufficient for the current mutation model without introducing RPC functions
- Cost: substantial rewrite plus new SQL function surface
- Result: rejected for this slice

### Option C: Standardize all backend persistence on direct Postgres

- Correctness: feasible but broader than the V0 need
- Cost: unnecessary migration risk for support-channel flows that already work
- Result: rejected for this slice

### Option D: Hybrid reads over HTTPS, writes over direct Postgres

- Correctness: workable but adds split-path complexity with limited benefit at current scale
- Cost: extra cognitive and testing burden
- Result: rejected for this slice

## Configuration Contract

- `FLARE_SUPABASE_URL` remains the backend/admin Supabase HTTPS project URL.
- `FLARE_POSTGRES_DSN` is the primary backend-only psycopg2/libpq DSN for Flare Plan.
- `FLARE_SUPABASE_DB_URL` is deprecated. If still used, it must contain a Postgres DSN, not an HTTPS project URL.
- Frontend runtime variables remain unchanged: `EXPO_PUBLIC_FLARE_SUPABASE_URL` and `EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY`.

## Follow-Up

- Keep Flare Plan configuration on direct Postgres until run-lifecycle mutations are implemented and re-evaluated.
- If future work wants a single Supabase HTTPS persistence path, first design RPC/database-function boundaries that preserve the current transactional guarantees.
- Treat `docs/20_architecture/flare_signed_in_persistence_ownership_audit_2026-07.md` as the current classification source for the remaining direct signed-in writes.
- Highest-value next migration: backend-own checkpoint/reflection persistence, then re-evaluate whether archive/restore should remain direct once reflected-state advancement is no longer client-coordinated.
- Trace V0 stale completion and retention cleanup remain manual SQL today and still need an explicit lifecycle owner.
