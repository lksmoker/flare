# Flare Minimal Trace V0 Contract

## Status

Implementation-ready product and implementation contract.

## Purpose

Flare Minimal Trace V0 exists to close one verified private-cohort investigability gap:

> When a signed-in participant reports, "I pressed Flare and nothing happened," the operator must be able to determine how far the authenticated Flare initiation request progressed before the first durable domain record existed.

Minimal Trace V0 is a narrow operational evidence contract. It is not a general observability platform, analytics system, or distributed tracing design.

## Governing Inputs

This contract is shaped by:

- `docs/20_architecture/flare_runtime_evidence_and_ai_investigation_v0.md`
- `docs/00_product/contracts/flare_private_testing_v0_contract.md`
- `docs/20_architecture/flare_v0_data_persistence_contract.md`
- `docs/00_product/contracts/flare_external_support_channel_v0.md`
- `docs/00_product/contracts/flare_plan_v0_contract.md`
- `docs/00_product/contracts/flare_plan_v0_api_contract.md`
- `docs/00_product/contracts/flare_response_experience_v0_contract.md`
- `docs/40_delivery/private_testing/flare_private_testing_privacy_summary_v0.md`
- current signed-in Flare initiation implementation in:
  - `frontend/src/screens/FlareScreen.tsx`
  - `frontend/src/services/flareResponseApi.ts`
  - `backend/app/http/app.py`
  - `backend/app/api/flare_plan_api.py`
  - `backend/app/services/flare_plan_service.py`
  - `backend/app/db/flare_plan_repository.py`

If a lower-level implementation detail conflicts with this contract, the contract is authoritative until deliberately revised.

## Scope

Minimal Trace V0 covers the authenticated Flare initiation lifecycle only.

The lifecycle starts when the signed-in frontend begins the authenticated `POST /api/flare-events` request.

The lifecycle ends when one of the following is durably known:

- the first `flare_events` row was created successfully
- the backend rejected the request before persistence
- authentication failed
- request validation failed
- the first domain persistence operation failed
- another explicit terminal backend failure stage was recorded

In scope:

- best-effort durable trace initiation for a signed-in Flare attempt before the create request
- signed-in frontend initiation of `POST /api/flare-events`
- backend receipt of that request
- backend auth outcome for that request
- request-shape and domain validation outcome for that request
- the first `flare_events` persistence attempt and result
- correlation from the request trace to `flare_events.id` when creation succeeds
- durable retrieval of that evidence by an operator

Out of scope:

- signed-out local-only Flare use
- `POST /api/support-channel/send-flare`
- support-channel provider delivery confirmation
- full support-message attempt history
- `GET /api/flare-events/{id}/response`
- Flare Plan run mutations and checkpoint flows
- downstream plan evidence already persisted in `flare_plan_runs`, `flare_plan_run_actions`, and related tables
- frontend crash capture, session replay, or generalized client logging

Support delivery and Flare Plan activity remain governed by their existing contracts and evidence sources. Minimal Trace V0 must not duplicate those durable records unless a later contract explicitly expands scope.

## Goals

Minimal Trace V0 must allow the operator to determine, for one reported signed-in incident:

- whether the frontend initiated the authenticated Flare request
- which authenticated user initiated it
- when initiation occurred
- whether a backend request was attempted
- whether the backend received the request
- whether backend authentication succeeded or failed
- whether backend validation succeeded or failed
- whether the first `flare_events` domain record was created
- the resulting `flare_event_id`, when available
- the final trace outcome
- the failure stage and safe failure code, when unsuccessful
- elapsed time between meaningful lifecycle milestones

## Non-Goals

Minimal Trace V0 does not include:

- final provider delivery confirmation
- complete support-message tracing
- complete Flare Plan tracing
- user-behavior analytics
- screen-level navigation history
- keystrokes or interaction replay
- raw request bodies
- raw response bodies
- secrets, access tokens, or provider credentials
- stack traces or exception payloads containing sensitive values
- general frontend logging
- permanent retention guarantees
- real-time dashboards
- automatic alerts
- aggregate operational analytics
- session replay
- crash reporting
- distributed tracing

## Trace Lifecycle

### Selected model

Minimal Trace V0 uses one mutable trace record with milestone timestamps and bounded status fields.

This is the minimum sufficient design because:

- the verified audit gap is a single pre-persistence request question, not a broad chronological event stream problem
- the current authenticated Flare initiation path is one request with one first domain persistence boundary
- operators need a durable, queryable terminal record more than they need append-only event reconstruction
- existing downstream evidence already supplies append-style chronology once `flare_events` and related records exist

Append-only trace events are intentionally deferred. A hybrid model is also unnecessary for the first 3 to 5 participant cohort.

### Canonical lifecycle states

The authoritative lifecycle states are:

- `initiated`
- `backend_received`
- `authenticated`
- `validated`
- `flare_event_created`
- `completed`
- `failed`

Rules:

- `initiated` means the frontend committed to sending the authenticated `POST /api/flare-events` request and persisted or transmitted the client correlation data required by this contract.
- `initiated` must be durably represented before the create request is attempted, using the minimum protected trace-init persistence surface required to distinguish:
  - no frontend initiation
  - frontend initiated but the create request never reached `/api/flare-events`
- `backend_received` means the backend request entry point accepted the request far enough to begin trace handling.
- `authenticated` means bearer-token authentication succeeded and a concrete `user_id` was resolved.
- `validated` means request JSON and domain validation passed far enough for `create_flare_event` persistence to begin.
- `flare_event_created` means the first `flare_events` row exists durably.
- `completed` means the trace reached its successful terminal outcome for V0. In V0, `completed` implies `flare_event_created`.
- `failed` means the trace reached a terminal unsuccessful outcome before or at first persistence.

The implementation may store milestone timestamps instead of storing every intermediate status transition separately, but the persisted record must allow the operator to distinguish the stages above.

## Required Data

Minimal Trace V0 must persist only the fields below or fields that are materially equivalent.

### Required fields

- `id`
  - stable server-generated trace row identifier
  - purpose: durable primary key for operator retrieval and future references
- `user_id`
  - nullable until backend auth succeeds
  - purpose: operator lookup by participant and owner-scoped isolation
- `client_correlation_id`
  - client-generated opaque request correlation identifier
  - purpose: connect frontend initiation to backend receipt and deterministic retries
- `flare_event_id`
  - nullable until event creation succeeds
  - purpose: join Minimal Trace evidence to existing Flare domain evidence
- `route`
  - fixed V0 value for authenticated initiation: `/api/flare-events`
  - purpose: future-proof retrieval and avoid ambiguity if trace later expands carefully
- `lifecycle_status`
  - current or terminal lifecycle status
  - purpose: operator-visible current outcome without replaying logs
- `final_outcome`
  - `completed` or `failed`
  - purpose: stable terminal summary for retrieval and reporting
- `failure_stage`
  - nullable
  - purpose: operator diagnosis of where the request stopped
- `failure_code`
  - nullable safe code
  - purpose: stable machine-readable failure classification without storing raw exceptions
- `idempotency_key_ref`
  - safe stored reference to the idempotency key used for the same request
  - purpose: correlate trace behavior with existing `create_flare_event` idempotency semantics
- `initiated_at`
  - purpose: incident-time lookup and latency measurement start
- `backend_received_at`
  - nullable
  - purpose: distinguish client-only failure from backend-received work
- `authenticated_at`
  - nullable
  - purpose: distinguish backend auth rejection from later failure
- `validated_at`
  - nullable
  - purpose: distinguish validation rejection from persistence failure
- `flare_event_created_at`
  - nullable
  - purpose: prove first-domain-write success and measure pre-persistence latency
- `completed_at`
  - nullable
  - purpose: terminal-success timestamp
- `failed_at`
  - nullable
  - purpose: terminal-failure timestamp
- `created_at`
  - purpose: row creation audit
- `updated_at`
  - purpose: row mutation audit

### Optional bounded metadata

Optional metadata is allowed only when bounded and operationally necessary, such as:

- `client_platform`
  - coarse value such as `web`, `ios`, or `android`
  - purpose: investigate platform-specific request failures without device fingerprinting
- `app_build_ref`
  - deployment-safe build label when available
  - purpose: correlate incidents to a cohort build without storing session details
- `http_status_code`
  - nullable terminal backend response status
  - purpose: distinguish `401`, `422`, `409`, and `500` style failures safely

### Prohibited fields

Minimal Trace V0 must not persist:

- anchor-note text
- behavior-description text beyond what already belongs in `flare_events`
- support message text
- checkpoint or reflection text
- raw request payloads
- raw response payloads
- bearer tokens
- cookies
- magic-link tokens
- provider tokens or secrets
- raw exception messages as the primary taxonomy
- stack traces
- IP-based geolocation
- unbounded user-agent strings
- session replay artifacts

## Correlation Model

### Selected approach

Minimal Trace V0 uses a client-generated correlation identifier on the authenticated `POST /api/flare-events` request and links the resulting trace record to `flare_events.id` when creation succeeds.

### Identifier generation

- The frontend generates the `client_correlation_id` immediately before issuing the authenticated `POST /api/flare-events` request.
- The frontend must continue generating the existing `Idempotency-Key` required by the Flare Plan API.
- For V0, the client must reuse the same opaque value for:
  - `client_correlation_id`
  - the request `Idempotency-Key`

This choice is intentionally minimal because:

- the current implementation already requires a client-generated idempotency key for `POST /api/flare-events`
- retries should already reuse that value
- adding a second independently generated client identifier would increase mismatch risk without improving first-cohort investigability materially

The trace table may store the value in a trace-specific column and optionally duplicate or derive a safe idempotency reference for explicitness.

### Transport

- The frontend must first send the correlation identifier through a minimal protected trace-init surface that creates or upserts the mutable trace row in `initiated` state.
- The same correlation identifier must then travel with the authenticated `POST /api/flare-events` request so the backend can update that same trace row as the request advances.
- The preferred V0 transport for `POST /api/flare-events` is an additional header alongside the existing `Idempotency-Key` header so that:
  - request payload contracts remain narrow
  - tracing stays operational metadata rather than product input
  - backend request entry can inspect trace metadata before JSON parsing or domain validation

### Initiation persistence boundary

Minimal Trace V0 requires one narrow additional persistence boundary before `POST /api/flare-events`:

- a protected trace-init write that creates or upserts the mutable trace row in `initiated` state
- no domain payload beyond bounded operational metadata
- no dependency on downstream Flare Event creation

This boundary is required because the verified audit gap specifically includes distinguishing:

- the frontend never issuing the request
- the frontend issuing the request but the create route never receiving it

Without a durable pre-request initiation write, those two cases remain indistinguishable.

### Idempotency and retries

- A retry of the same authenticated initiation attempt must reuse the same correlation/idempotency value.
- Retrying the trace-init write with the same correlation/idempotency value must be idempotent.
- If the backend already completed the original create request, the same successful trace row should remain authoritative and may be updated idempotently rather than creating a second trace row.
- A different user action on a later Flare must use a new correlation/idempotency value.

### Duplicate versus retry semantics

- Same authenticated user plus same correlation/idempotency value plus materially same request input: retry of the same attempt.
- Same authenticated user plus different correlation/idempotency value: distinct user attempt, even if initiated close in time.
- Same correlation/idempotency value reused with materially different input: invalid reuse and must surface as a safe conflict outcome.

### Link to `flare_events`

- On successful persistence, the trace must store the created `flare_event_id`.
- `flare_event_id` is the bridge into existing evidence such as:
  - `flare_events`
  - `flare_plan_runs`
  - `support_channel_delivery_attempts`
  - `checkpoint_reflections`

### Operator retrieval path

For one reported incident, the operator should be able to:

1. find the participant by `user_id`
2. filter trace rows by approximate `initiated_at`
3. inspect the terminal trace outcome and failure stage
4. follow `flare_event_id` into existing domain records when present

## Failure Taxonomy

Minimal Trace V0 uses a deliberately small safe taxonomy.

### Failure stages

- `client_initiation_failed`
- `request_transport_failed`
- `backend_auth_rejected`
- `validation_rejected`
- `domain_persistence_failed`
- `unexpected_backend_failure`
- `unknown_or_incomplete`

### Failure code guidance

Failure codes should be stable, safe, and bounded. Examples:

- `trace_client_unavailable`
- `trace_request_network_error`
- `trace_backend_unauthorized`
- `trace_invalid_json`
- `trace_flare_event_behavior_label_required`
- `trace_flare_event_response_mode_invalid`
- `trace_idempotency_key_required`
- `trace_idempotency_key_reused`
- `trace_flare_event_insert_failed`
- `trace_internal_server_error`

Rules:

- the durable taxonomy must prefer safe codes over raw exception text
- raw exception details may appear in ephemeral server logs when already allowed by implementation, but must not become durable trace payloads
- `unknown_or_incomplete` is permitted only when the trace cannot safely determine a more precise stage

## Privacy and Data Minimization

Minimal Trace V0 is operational metadata with participant linkage, not participant-authored product content.

### Necessary identifying data

The minimum participant-identifying data allowed in Minimal Trace V0 is:

- `user_id`
- `flare_event_id` when created
- bounded build or platform metadata when explicitly approved for V0

Participant email, support-group names, and freeform content are not required trace fields.

### Retention expectation

V0 retention should be bounded and cohort-oriented rather than permanent.

The default contract expectation is:

- retain Minimal Trace rows only for the private-testing period plus a short post-cohort investigation window
- review retention before broader release rather than silently carrying private-cohort traces forward forever

The exact retention interval may be set during implementation, but the implementation must be bounded and documented.

### Deletion behavior

- If a participant requests deletion of account-owned Flare data during the private cohort, the operator must explicitly decide whether Minimal Trace rows are deleted, de-identified, or retained as limited operational evidence.
- V0 should treat trace data as operational metadata linked to a participant account, not as user-facing history.
- The chosen deletion behavior must be documented during implementation and must not contradict private-testing promises.

### Access controls

- Normal authenticated participants must not be able to read other users' trace rows.
- Minimal Trace rows must not be exposed through ordinary participant APIs or history surfaces.
- Direct table access should remain limited by owner-scoped RLS for authenticated reads, with service-role access for protected operator tooling.
- If ordinary authenticated reads are unnecessary for participants, implementation should prefer denying them entirely and reserving retrieval to protected operator surfaces.

### Export and history behavior

- Minimal Trace V0 does not need to appear in participant history.
- Minimal Trace V0 does not need to appear in participant export during the first cohort.
- Any future inclusion in export requires an explicit contract decision because trace rows are operational metadata, not recovery content.

## Retrieval and Operator Workflow

### Selected minimal retrieval approach

Minimal Trace V0 requires direct protected database queries only for the first private cohort.

This is the smallest safe option because:

- the cohort is approximately 3 to 5 participants
- the operator already investigates with direct evidence correlation
- a dashboard would be disproportionate
- a new operator-facing endpoint would add implementation and security surface before necessity is proven

### Required retrieval capability

The operator must be able to retrieve trace evidence by:

- `user_id`
- approximate incident time
- `client_correlation_id`
- `flare_event_id`, when available

### Minimum investigation workflow

For the report "I pressed Flare and nothing happened," the operator should be able to:

1. locate candidate trace rows for that participant and time window
2. inspect whether the trace stopped before backend receipt, auth, validation, or persistence
3. inspect the safe failure code
4. follow `flare_event_id` into existing Flare Event, support-delivery, and plan evidence when available
5. conclude whether the issue was:
   - no durable backend receipt
   - backend auth rejection
   - backend validation rejection
   - first persistence failure
   - successful Flare creation with downstream evidence elsewhere

## API and Persistence Boundaries

Minimal Trace V0 must integrate at the following boundaries without broadening product behavior.

### Frontend request initiation

- `frontend/src/screens/FlareScreen.tsx` is the current signed-in entry to authenticated Flare initiation.
- The frontend creates the client correlation/idempotency value immediately before initiating Minimal Trace V0 and before calling `createFlareResponse`.
- The trace contract does not require tracing signed-out local-only fallback Flare creation.

### Correlation transport

- `frontend/src/services/flareResponseApi.ts` is the current request transport for `POST /api/flare-events`.
- The frontend must perform a minimal authenticated trace-init write before calling `POST /api/flare-events`.
- The trace correlation value must be transmitted with that request.

### Trace-init boundary

- Minimal Trace V0 requires one narrow authenticated initiation surface before the create route.
- That surface must persist or upsert the mutable trace row in `initiated` state using bounded metadata only.
- Failure of that trace-init write must not block the subsequent `POST /api/flare-events` attempt when the core Flare initiation can still proceed safely.

### Backend request entry

- `backend/app/http/app.py` is the current HTTP entry point.
- The backend must record `backend_received` before or at the earliest safe point after request entry for `/api/flare-events`.

### Authentication boundary

- `backend/app/api/flare_plan_api.py` and `SupabaseUserAuthenticator` currently determine authenticated-user access.
- Auth success or rejection for `POST /api/flare-events` must be reflected in the trace lifecycle.

### Validation boundary

- `backend/app/api/flare_plan_api.py` JSON parsing and `backend/app/services/flare_plan_service.py` command validation form the V0 validation boundary.
- Validation rejection must produce a durable failed trace with safe codes only.

### Flare Event creation boundary

- `backend/app/services/flare_plan_service.py::create_flare_event`
- `backend/app/db/flare_plan_repository.py::create_flare_event`
- `backend/app/db/flare_plan_repository.py::_create_flare_event`

This is the first domain persistence boundary for Minimal Trace V0.

### Failure capture

- Trace capture must handle:
  - auth rejection
  - invalid JSON
  - domain validation errors
  - idempotency conflicts
  - first persistence failure
  - unhandled backend failures

### Trace completion

- Success terminal state occurs when `flare_event_id` is durably known.
- Failure terminal state occurs when the request is rejected or fails before that boundary.

### Persistence ownership

- Minimal Trace storage is backend-owned operational persistence.
- The trace mechanism must not require participant-managed writes after request initiation.

### Retry behavior

- Retrying the same authenticated request with the same correlation/idempotency value must not create ambiguous duplicate traces.
- Trace persistence failure must not create a new catastrophic participant-facing failure mode.

## Design Constraints and Tradeoffs

- Trace must not become a prerequisite for creating `flare_events` unless reliable correlation cannot be achieved safely otherwise.
- Trace persistence failure must not block the participant from receiving the core Flare experience when `flare_events` creation can still succeed safely.
- The only exception is that a minimal pre-request initiation write is required to close the verified audit gap, but that write must still be best-effort and non-blocking for participant experience.
- Operational evidence must remain understandable without reconstructing raw logs manually.
- Existing downstream evidence in `support_channel_delivery_attempts`, `flare_plan_runs`, and related records must be reused rather than duplicated.
- Existing Supabase ownership and RLS patterns should be reused where practical.
- Existing backend repository and service conventions should be preserved where practical.

### Chosen tradeoff

Minimal Trace V0 chooses a mutable request-trace row rather than append-only events because operator clarity for the first persistence boundary is more important than full historical trace playback in the first cohort.

Minimal Trace V0 also chooses one minimal trace-init write plus direct DB retrieval rather than a dashboard or broad route tracing because the cohort is small and the primary need is durable evidence, not presentation tooling.

## Acceptance Criteria

Minimal Trace V0 is implementation-ready when all of the following are true:

1. A successful signed-in `POST /api/flare-events` request produces one durable trace linked to the created `flare_event_id`.
2. A signed-in initiation that durably records `initiated` but never reaches `/api/flare-events` remains distinguishable from no recorded initiation at all.
3. Backend authentication rejection for `POST /api/flare-events` produces a durable failed trace without storing access tokens or other auth secrets.
4. Validation rejection produces a durable failed trace with the correct failure stage and safe failure code.
5. First domain persistence failure produces a durable failed trace classified as a persistence-stage failure.
6. An operator can investigate a participant report using `user_id` and approximate incident time without depending only on ephemeral logs.
7. An operator can retrieve the same incident by `client_correlation_id`.
8. When `flare_event_id` exists, the operator can follow it into existing `flare_events`, support-delivery, and Flare Plan evidence.
9. Normal authenticated users cannot read another user's trace rows through ordinary access paths.
10. Existing support-delivery and plan-run evidence is not duplicated into Minimal Trace rows unnecessarily.
11. No raw participant-authored content, request bodies, tokens, secrets, or unbounded exception payloads are persisted in Minimal Trace.
12. Retries using the same correlation/idempotency value behave deterministically and do not create ambiguous duplicate traces.
13. Distinct user attempts use distinct correlation/idempotency values and produce distinct trace rows.
14. Trace-init persistence failure does not block core Flare creation when `POST /api/flare-events` can still proceed safely.
15. Trace creation or update failure does not introduce a new catastrophic failure mode for authenticated Flare initiation.
16. The trace lifecycle remains limited to the authenticated initiation boundary and does not silently expand into generalized route tracing.

## Rollout and Validation

Implementation and rollout must proceed in this order:

1. local implementation of the trace persistence model and request wiring
2. schema, grants, and RLS validation
3. focused backend tests for trace-init success, auth rejection, validation rejection, persistence failure, and retry/idempotency behavior
4. focused frontend tests for correlation generation, trace-init behavior, and transport on authenticated initiation
5. one synthetic successful signed-in Flare creating both a trace row and a `flare_events` row
6. one synthetic initiated-but-not-received scenario proving the operator can distinguish it from no recorded initiation
7. one synthetic pre-persistence backend failure producing a durable failed trace
8. one operator retrieval exercise using participant identity and approximate time
9. confirmation that any synthetic or cohort validation data remains clearly labeled as test data
10. private-cohort readiness review confirming that the gap identified by the runtime evidence audit is closed without broader telemetry scope

Rollback expectations:

- Minimal Trace V0 must be removable or disableable without corrupting `flare_events` creation
- rollback must prefer preserving the existing core Flare initiation path over preserving trace collection
- rollback must not leave misleading partial participant-facing states

## Open Decisions

The contract resolves the major V0 design choices. Only the following implementation details remain intentionally open:

- exact retention interval for private-cohort operational metadata
- exact SQL shape and naming of the trace table
- exact minimal trace-init route or equivalent protected persistence surface
- whether the dedicated trace transport header is named `X-Flare-Trace-Id` or another repository-standard equivalent
- whether ordinary authenticated users receive no direct table access at all, or owner-scoped access that remains unreachable from ordinary product APIs

These decisions should be resolved during implementation without broadening scope.

## Deferred Follow-Ups

The following work is explicitly deferred until after the first private cohort unless a later contract says otherwise:

- crash reporting
- broader frontend diagnostics
- support-send route tracing
- provider webhook or final delivery confirmation
- full Flare Plan route tracing
- generalized request logging across the backend
- distributed tracing
- dashboards
- automatic alerts
- aggregate analytics
- anomaly detection
- participant-facing trace history
- export inclusion for operational trace metadata

## Final Contract Statement

Flare Minimal Trace V0 is the smallest durable evidence layer that answers one first-cohort operational question:

> Did the authenticated Flare initiation request begin, reach the backend, pass auth and validation, and create the first Flare Event record?

It must stay narrow, privacy-conscious, bounded, and operationally clear. It exists to close the verified pre-persistence blind spot identified by the July 16, 2026 runtime evidence audit without turning Flare V0 into a telemetry-heavy system.
