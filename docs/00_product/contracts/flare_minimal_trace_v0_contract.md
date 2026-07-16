Flare Minimal Trace V0 Contract

Status

Implementation-ready product contract.

Purpose

Flare Minimal Trace V0 defines the minimum durable trace required to investigate the signed-in Flare initiation path before the first private-testing participant is invited.

It exists to answer one operator question reliably:

* When a signed-in participant reports, "I pressed Flare and nothing happened," what is the furthest durably verified point reached by that specific Flare initiation attempt?

Minimal Trace V0 closes only the verified audit gap between:

* the signed-in frontend initiating a Flare create attempt
* and the first persisted Flare domain record becoming durably known

This contract does not define a general observability platform, analytics system, distributed tracing model, or participant-facing history feature.

Design Rationale

The runtime evidence audit concluded that Flare already has useful durable evidence after creation of the first `flare_events` row. The highest-priority verified investigability gap exists before that first domain record becomes durably known.

Minimal Trace V0 intentionally closes only that gap. It does not duplicate downstream evidence already stored in authoritative domain records.

Trace is best-effort operational evidence. Trace creation or update may fail while the core Flare create path succeeds. Such a failure may leave a known investigation gap, but it must not block the participant from receiving the core Flare experience when the create path can proceed safely.

Relationship to Broader Experience Trace

Minimal Trace V0 is the first bounded slice of a potentially broader Flare experience-trace capability. It does not claim to provide continuous tracing across the complete participant journey.

Existing downstream records provide partial lifecycle evidence after Flare creation. A future experience-trace assessment may consider whether additional correlation or transition evidence is warranted across response display, support delivery, Flare Plan progression, and checkpoint behavior.

That broader work remains deferred unless private-cohort evidence demonstrates an investigation gap that existing authoritative records cannot answer.

Governing Inputs

This contract is shaped by:

* `docs/20_architecture/flare_runtime_evidence_and_ai_investigation_v0.md`
* `docs/00_product/contracts/flare_private_testing_v0_contract.md`
* `docs/20_architecture/flare_v0_data_persistence_contract.md`
* `docs/00_product/contracts/flare_plan_v0_contract.md`
* `docs/00_product/contracts/flare_plan_v0_api_contract.md`
* `docs/00_product/contracts/flare_external_support_channel_v0.md`
* `docs/00_product/contracts/flare_response_experience_v0_contract.md`
* private-testing delivery documents under `docs/40_delivery/private_testing/`

Verified implementation alignment reviewed for this contract:

* `frontend/src/screens/FlareScreen.tsx`
* `frontend/src/services/flareResponseApi.ts`
* `backend/app/http/app.py`
* `backend/app/api/flare_plan_api.py`
* `backend/app/services/flare_plan_service.py`
* `backend/app/db/flare_plan_repository.py`
* `db/migrations/20260627_230500_flare_v0_persistence.sql`
* `db/migrations/20260708073000_flare_plan_v0_persistence.sql`

Scope

Minimal Trace V0 covers only the authenticated Flare creation lifecycle for `POST /api/flare-events`.

The lifecycle begins when the signed-in frontend intentionally initiates a Flare create attempt.

The lifecycle ends when one terminal outcome is durably known:

* the first `flare_events` row was created successfully
* the signed-in client received an authentication rejection and durably classified its owner-scoped trace
* validation failed before domain persistence
* the request reached the authenticated backend path but the first domain persistence operation failed
* another explicitly classified terminal failure occurred before first domain persistence

An unauthenticated backend request must not directly mutate an owner-scoped participant trace. When backend authentication fails, the signed-in client may durably classify its own trace after receiving the rejection. If no safe terminal update is possible, the trace remains unresolved and is treated as effectively incomplete after the stale threshold.

Out of scope for this trace lifecycle:

* signed-out fallback Flare flows
* support-channel delivery after the `flare_event_id` handoff
* GroupMe/provider confirmation
* Flare Plan run progression after creation
* checkpoint or reflection behavior
* downstream history rendering

Existing evidence remains authoritative for downstream stages:

* `flare_events` and response reads remain authoritative after event creation
* `support_channel_delivery_attempts` remains authoritative for support delivery attempts
* `flare_plan_runs` and `flare_plan_run_actions` remain authoritative for plan-offer and plan-run evidence
* `checkpoint_reflections` remains authoritative for later reflection evidence

Goals

Minimal Trace V0 must let the operator determine, when trace evidence was successfully persisted:

* whether the signed-in frontend durably recorded that it initiated a Flare create attempt
* which authenticated user owned that attempt
* when initiation occurred
* whether a backend request was attempted
* whether the backend received the request
* whether backend authentication succeeded or the client received an authentication rejection
* whether request validation succeeded or failed
* whether the first `flare_events` row was created
* which `flare_event_id` resulted, when available
* the terminal or effective trace outcome
* the failure stage and safe failure code when unsuccessful
* the elapsed time between key lifecycle milestones that were actually reached
* whether a later submission was a retry of the same attempt or a distinct new attempt

Minimal Trace V0 must also make trace incompleteness visible. It must not imply complete coverage when trace creation or update failed.

Non-goals

Minimal Trace V0 does not provide:

* final provider delivery confirmation
* complete support-message tracing
* complete Flare Plan tracing
* user-behavior analytics
* screen-level navigation history
* keystrokes or interaction replay
* raw request or response bodies
* participant freeform text content
* secrets, access tokens, or provider credentials
* raw stack traces in durable trace rows
* general frontend logging
* permanent retention
* real-time dashboards
* automatic alerts
* broad operational analytics
* signed-out local-only Flare tracing

Trace Lifecycle

Minimal Trace V0 uses one mutable trace record per signed-in Flare create attempt.

This is the minimum sufficient model because:

* the operator needs one chronologically understandable record for one participant-reported attempt
* the lifecycle is short and bounded
* the required milestones are known in advance
* append-only event streams would add operational and schema complexity without answering a V0 question better
* a hybrid model is not justified before the first private cohort

The record must support the following lifecycle statuses:

* `initiated`
* `backend_received`
* `authenticated`
* `validated`
* `completed`
* `failed`

Status semantics:

* `initiated` means the signed-in client durably wrote the trace start before or at the point it began the create attempt.
* `backend_received` means the authenticated backend path durably claimed the trace after identity was verified.
* `authenticated` means backend bearer-auth resolution succeeded for that request.
* `validated` means request shape and domain validation passed far enough to attempt the first `flare_events` insert.
* `completed` means the first domain record exists, an authoritative `flare_event_id` is linked, and the pre-persistence gap is closed successfully.
* `failed` means a terminal failure was durably classified and must carry a safe failure stage and code.

Successful completion should set `flare_event_id`, `flare_event_created_at`, `completed_at`, and `status = completed` in one bounded update where practical. `flare_event_created` is a milestone timestamp, not a separate externally meaningful lifecycle status.

Not every status must be surfaced as a separate retrieval event. The durable truth is the latest mutable row plus its milestone timestamps.

Stale trace rule:

* A trace that remains non-terminal beyond a short bounded timeout is effectively incomplete.
* V0 default stale threshold should be 5 minutes from `client_initiated_at`.
* The effective stale classification is `failure_stage = incomplete` and `failure_code = trace_terminal_state_unknown`.
* V0 operator retrieval should calculate this effective state without mutating the trace row merely because an operator read it.
* A later implementation may add a bounded cleanup process if operational evidence demonstrates that durable stale-state mutation is needed.

Required Data

Minimal Trace V0 must persist only the fields below or an equivalent minimal set with the same meaning.

* `id`
  * Stable primary key for the trace row.
  * Operational purpose: direct reference for diagnostics and joins.
* `trace_id`
  * Client-generated opaque identifier for one participant-perceived Flare create attempt.
  * Operational purpose: primary end-to-end correlation key across client initiation, backend request handling, and eventual `flare_event_id`.
* `user_id`
  * Authenticated Flare user owner established by the owner-scoped initiation write.
  * Operational purpose: incident lookup by participant and ownership enforcement.
* `flare_event_id` nullable
  * The created domain record once available.
  * Operational purpose: handoff from pre-persistence trace to existing event/support/plan evidence.
* `route_name`
  * Fixed V0 value representing authenticated Flare create, for example `flare_event_create`.
  * Operational purpose: keep future retrieval explicit without storing raw URLs broadly.
* `status`
  * Current lifecycle status from the bounded model above.
  * Operational purpose: fast understanding of latest known durable state.
* `failure_stage` nullable
  * Safe stage classification when terminal status is `failed` or when retrieval calculates an effective incomplete state.
  * Operational purpose: identify where the create path stopped.
* `failure_code` nullable
  * Safe bounded code when terminal status is `failed` or effectively incomplete.
  * Operational purpose: distinguish common failure classes without raw exception storage.
* `request_attempt_count`
  * Integer count of authenticated backend request receipts observed for the same `trace_id`.
  * Operational purpose: distinguish one attempt with retries from multiple distinct new attempts.
* `client_initiated_at`
  * Timestamp recorded from the client-side initiation write.
  * Operational purpose: prove the frontend initiated the attempt and anchor operator incident timing when the write succeeds.
* `backend_received_at` nullable
  * Timestamp recorded when the authenticated backend path durably claims the trace for `POST /api/flare-events`.
  * Operational purpose: distinguish client-only initiation from authenticated backend receipt.
* `authenticated_at` nullable
  * Timestamp recorded when backend auth succeeds.
  * Operational purpose: isolate successful auth from later failures.
* `validated_at` nullable
  * Timestamp recorded when request validation passes.
  * Operational purpose: isolate validation rejection from persistence failure.
* `flare_event_created_at` nullable
  * Timestamp recorded when the first `flare_events` row is created.
  * Operational purpose: prove first persistence succeeded.
* `completed_at` nullable
  * Timestamp for successful terminal closure.
  * Operational purpose: latency measurement and terminal state verification.
* `failed_at` nullable
  * Timestamp for a durably classified failed terminal closure.
  * Operational purpose: incident timing and terminal state verification.
* `terminal_http_status` nullable
  * Safe HTTP status associated with the terminal backend result when one exists.
  * Operational purpose: distinguish authorization, validation, conflict, and server-failure classes.
* `is_test`
  * Boolean marker for synthetic or operator-generated validation traces.
  * Operational purpose: keep private-testing dry runs clearly identifiable and safely excludable from real participant investigations.
* `created_at`
  * Row creation timestamp.
  * Operational purpose: auditability.
* `updated_at`
  * Row update timestamp.
  * Operational purpose: auditability and stale-trace calculation.

Optional bounded metadata is allowed only when required to interpret the trace without storing product content. V0 should avoid metadata beyond:

* `response_mode` if the implementation needs it to interpret configured versus fallback-generic create behavior
* a small replay marker such as `terminal_source = live | idempotent_replay` if needed for retry diagnosis

Prohibited trace fields:

* anchor-note text
* support-action text
* behavior freeform descriptions beyond what is already intentionally carried in the event create request if that content is not required for trace diagnosis
* request JSON bodies
* response JSON bodies
* auth tokens
* cookies
* provider tokens or secrets
* raw stack traces
* device fingerprints
* unbounded error blobs

Correlation Model

Minimal Trace V0 uses a client-generated `trace_id` that is reused as the Flare create idempotency key for the same participant-perceived attempt.

Correlation rules:

* The signed-in frontend generates `trace_id` before issuing `POST /api/flare-events`.
* The same value is used for:
  * the owner-scoped client-side durable trace initiation write
  * the `Idempotency-Key` header on `POST /api/flare-events`
  * authenticated backend trace lookup and update after backend identity verification
* The backend must verify that the authenticated user owns the trace before updating it.
* An unauthenticated backend request must not use a caller-supplied `user_id` or `trace_id` alone to mutate an owner-scoped trace.
* The backend links the trace row to `flare_events.id` when the first domain row is created.
* When the client receives a backend authentication rejection, the client may mark its own owner-scoped trace with `failure_stage = backend_auth`, `failure_code = backend_unauthorized`, and the safe terminal HTTP status.
* If the client cannot safely persist that rejection, the trace remains unresolved and becomes effectively incomplete after the stale threshold.

Why this is the minimum design:

* the route already requires `Idempotency-Key`
* reusing that identifier avoids a second overlapping correlation token
* it makes retry semantics explicit
* it preserves one operator-visible key for investigation
* owner verification prevents an unauthenticated request from mutating another participant's evidence

Idempotency and retry rules:

* One user-visible press of Send Flare creates one `trace_id`.
* Automatic network retries for the same intended attempt must reuse that same `trace_id`.
* An explicit participant retry after the first attempt is considered abandoned or failed may either:
  * reuse the same `trace_id` if the UI still treats it as the same unresolved attempt, or
  * generate a new `trace_id` only when the product clearly represents it as a new attempt
* A new deliberate Send Flare action after the prior attempt completed or was dismissed must generate a new `trace_id`.
* Duplicate authenticated backend submissions with the same `trace_id` increment `request_attempt_count` rather than creating a second trace row.
* Duplicate new sends with a different `trace_id` are distinct attempts, even if they occur close together.

Minimum correlation retrieval:

* by `user_id` and approximate time window
* by `trace_id`
* by `flare_event_id`

Failure Taxonomy

Minimal Trace V0 stores a bounded stage and code, not raw exception text, as the durable failure taxonomy.

Allowed `failure_stage` values:

* `client_initiation`
* `request_transport`
* `backend_auth`
* `validation`
* `domain_persistence`
* `backend_unexpected`
* `incomplete`

Allowed V0 `failure_code` values:

* `client_trace_write_failed`
* `auth_session_missing`
* `request_network_failed`
* `backend_unauthorized`
* `validation_rejected`
* `idempotency_conflict`
* `flare_event_insert_failed`
* `unexpected_server_error`
* `trace_terminal_state_unknown`

Failure classification rules:

* `client_initiation` is reserved for failures detected before the create request begins or before the initiation write can be completed safely.
* `request_transport` is used only when the signed-in client directly observes a definite request transport or network failure after recording initiation.
* Absence of `backend_received_at` alone must not be classified as `request_transport`; process termination, client interruption, trace-state loss, or another unknown condition may have occurred.
* `backend_auth` means the signed-in client received a backend authentication rejection and durably classified its owner-scoped trace.
* `validation` means backend auth succeeded but request validation failed before the first `flare_events` insert.
* `domain_persistence` means validation succeeded far enough to attempt first persistence but the `flare_events` create did not complete successfully.
* `backend_unexpected` means the authenticated backend path received the request but failed outside a narrower safe class.
* `incomplete` is the effective classification for stale traces whose terminal state cannot be resolved from durable evidence.

Durable storage must not use raw exception messages as the primary failure model.

Ephemeral logging may still include operationally necessary exception details under existing backend logging controls, but V0 durable trace rows must store only bounded safe codes and timestamps.

Privacy and Data Minimization

Minimal Trace V0 is operational metadata linked to a participant account. It is not participant-facing history content.

Privacy rules:

* Trace must persist only bounded operational metadata needed to investigate the pre-persistence create path.
* Trace must not store participant-authored freeform recovery content, support-message content, request bodies, response bodies, auth material, or provider secrets.
* `user_id` is necessary and allowed because private-testing authenticated features are not anonymous.
* `flare_event_id` is necessary and allowed because it is the handoff to existing authoritative evidence.

Retention expectations:

* Trace rows must not be retained indefinitely.
* V0 default retention should be the shorter of:
  * 30 days after trace creation, or
  * 14 days after the participant exits the private cohort
* An open incident may justify temporary extension, but retention should remain explicitly bounded and operator-reviewed.

Deletion and export expectations:

* Trace rows should be treated as operational metadata rather than participant-visible product history.
* Trace rows should not appear in participant history surfaces.
* V0 does not require self-service participant export or deletion UX for trace data.
* Manual participant data-help workflows must consider associated trace rows during deletion or retention review because they are linked by `user_id`.

Access control expectations:

* Normal authenticated users must not be able to read other participants' trace rows.
* Trace retrieval is operator-only and should use service-role or equivalent protected access.
* If the frontend writes the initiation row directly through Supabase, authenticated access must remain owner-scoped and limited to the minimum insert/update capability required for that lifecycle.
* Backend trace updates must occur only after authenticated ownership is verified.
* Unauthenticated backend requests must not mutate owner-scoped trace rows using a caller-provided identifier alone.
* RLS must fail closed for cross-user access.

Retrieval and Operator Workflow

Minimal Trace V0 requires direct operator database queries as the initial retrieval mechanism.

V0 does not require:

* a participant-facing trace surface
* a dedicated dashboard
* real-time alerting
* a new diagnostic UI

The smallest safe retrieval approach for the first private cohort is:

* operator-only direct database query access, preferably through a saved investigation query under `db/dev_queries/flare/` during implementation

The operator must be able to investigate one incident using any of:

* `user_id`
* approximate incident timestamp
* `trace_id`
* `flare_event_id`

The saved investigation query should reconstruct:

* the trace row and its effective stale classification when applicable
* the linked `flare_events` row when present
* the latest linked `support_channel_delivery_attempts` row when present
* the linked `flare_plan_runs` row when present

This preserves one investigation path without duplicating downstream evidence into trace storage itself.

API and Persistence Boundaries

Minimal Trace V0 integration points must align to the current Flare lifecycle.

Frontend initiation boundary:

* The signed-in Send Flare path in `frontend/src/screens/FlareScreen.tsx` generates `trace_id` before calling `createFlareResponse()`.
* The signed-in flow only is in scope.
* Signed-out local fallback state remains out of scope.
* The owner-scoped initiation write is best-effort and must not make Trace a hard dependency of the core Flare create path.

Frontend auth/request boundary:

* `frontend/src/services/flareResponseApi.ts` is the current authenticated create-request client.
* The create attempt already depends on `client.auth.getSession()` and `POST /api/flare-events`.
* V0 trace transport must align to that path rather than adding a parallel create route.
* When the client receives a backend authentication rejection, it may durably update its own owner-scoped trace with the bounded authentication failure classification.

Backend request entry boundary:

* `backend/app/http/app.py` remains the WSGI entry point and route dispatcher.
* `backend/app/api/flare_plan_api.py` remains the create route handler for `POST /api/flare-events`.
* The unauthenticated request entry point may read the correlation identifier for request handling but must not mutate an owner-scoped trace until authentication succeeds.
* After authentication, the backend may durably claim and update the trace only after verifying trace ownership.

Authentication boundary:

* `SupabaseUserAuthenticator.authenticate()` in `backend/app/http/app.py` remains the authoritative backend auth gate.
* Backend auth success is recorded by the authenticated backend path.
* Backend auth rejection is recorded, when safely possible, by the owner-scoped client after it receives the rejection.
* Sensitive auth data must never be stored in Trace.

Validation boundary:

* `FlarePlanService.create_flare_event()` remains the authoritative validation boundary for required fields, allowed `response_mode`, and idempotency-key presence.
* Validation failure must update the trace to a safe failed terminal state after ownership is authenticated.

First domain persistence boundary:

* `PostgresFlarePlanRepository._create_flare_event()` remains the authoritative first domain persistence boundary.
* The trace must link to `flare_events.id` when that insert succeeds.
* Plan-run creation through `_ensure_run_for_event()` remains downstream of the first persistence boundary and must not expand Trace V0 scope.

Failure capture boundary:

* Client-side initiation, directly observed transport, or received backend-auth failures may update the owner-scoped trace only with bounded safe codes.
* Authenticated backend failures before first persistence must update the same owner-verified trace row rather than creating parallel records.
* Trace write failure is itself best-effort operational evidence and must not be represented as proof that the core create attempt failed.

Trace completion boundary:

* Trace completion occurs when first domain persistence is durably known, `flare_event_id` is linked, and the row is marked `completed`.
* Trace failure occurs when one of the allowed failure stages becomes durably known.
* A stale unresolved trace is treated as effectively incomplete by operator retrieval without requiring mutation-on-read.

Persistence ownership:

* The trace row belongs to the authenticated user established by the owner-scoped initiation write.
* Existing `flare_events`, support-channel, and plan-run tables remain authoritative for their own downstream data.
* Trace must not duplicate support-attempt rows, plan-run rows, or history data.

Retry and idempotency behavior:

* Retry correlation must use the same `trace_id` and current `Idempotency-Key`.
* Trace persistence failure must not block `flare_events` creation if the core request can still proceed safely.
* Trace is not allowed to introduce a new catastrophic failure mode for the participant.
* Trace completeness is therefore best-effort rather than guaranteed.

Acceptance Criteria

1. A successful signed-in Flare initiation produces one durable trace row linked to the created `flare_event_id` when trace persistence is available.
2. The successful trace row shows at least `trace_id`, `user_id`, `client_initiated_at`, `backend_received_at`, `flare_event_created_at`, `completed_at`, terminal status, and `flare_event_id`.
3. When the signed-in client receives a backend authentication rejection, it can durably mark its owner-scoped trace with `failure_stage = backend_auth` without storing tokens, raw auth payloads, or secrets.
4. An unauthenticated backend request cannot directly mutate an owner-scoped trace using only caller-supplied identifiers.
5. A validation rejection produces a durable failed trace with `failure_stage = validation` and a bounded safe code when trace persistence is available.
6. A first domain persistence failure produces a durable failed trace with `failure_stage = domain_persistence` when trace persistence is available.
7. A signed-in client-side initiation that never reaches authenticated backend receipt leaves operator-readable initiation evidence when the initiation write succeeded and is treated as effectively incomplete after the stale threshold unless a definite transport failure was directly observed.
8. An operator can investigate a participant report using `user_id` and approximate time without reading raw logs first when trace evidence exists.
9. An operator can pivot from `trace_id` to `flare_event_id`, and from `flare_event_id` to existing response, support, and plan evidence when present.
10. Normal authenticated access cannot read another participant's trace rows.
11. Existing support-delivery and Flare Plan evidence are not duplicated into trace rows beyond the linked identifiers needed for investigation.
12. No raw participant content, raw request bodies, raw response bodies, tokens, provider secrets, or unbounded exception payloads are durably persisted in trace.
13. Retries using the same participant-perceived attempt are represented deterministically through one `trace_id` and `request_attempt_count`, not duplicated trace rows.
14. A duplicate new Send Flare action with a new `trace_id` produces a distinct trace row.
15. Trace creation or update failure does not block the participant from receiving the core Flare create experience and is documented as a possible residual investigation gap.
16. Trace rows remain bounded-retention operational metadata and do not appear in participant history.
17. Synthetic traces are explicitly identifiable through `is_test` and can be excluded from real-participant investigation results.
18. Operator retrieval calculates effective stale state without mutating a trace merely because it was read.
19. `request_transport` is used only when the client directly observed a transport failure; missing backend receipt alone resolves to effective `incomplete`.

Rollout and Validation

Minimal Trace V0 implementation must roll out in this order:

1. Local implementation of the trace write/update path across signed-in frontend initiation and authenticated backend create handling.
2. Schema, grants, and RLS validation for the trace table or equivalent persistence surface.
3. Focused backend tests for authenticated ownership enforcement, validation rejection, persistence failure classification, successful create linking, retry behavior, and trace-failure fail-open behavior.
4. Focused frontend tests for signed-in initiation write, received auth-rejection classification, retry correlation, directly observed client-side transport failure handling, trace-write failure fail-open behavior, and signed-out non-use of Trace V0.
5. One synthetic successful signed-in Flare that produces a linked trace and `flare_event_id`.
6. One synthetic pre-persistence failure that produces a durable failed trace without domain row creation.
7. One synthetic unauthenticated request proving the backend cannot mutate another user's owner-scoped trace.
8. One synthetic trace-write failure proving the core Flare create path can still proceed.
9. One operator retrieval exercise using only `user_id` and approximate time.
10. Confirmation that all test traces have `is_test = true` and linked test events remain clearly labeled as test data.
11. Private-cohort readiness review confirming the trace closes the verified audit gap without widening scope.

Rollback expectations:

* If Trace V0 creates unsafe privacy exposure, cross-user access, or a participant-blocking failure mode, it must be disabled or rolled back before cohort use.
* Rollback must preserve the preexisting Flare create path rather than making trace a hard dependency.

Open Decisions

This contract resolves the major V0 design choices. Only the following implementation details remain open:

* Whether the client-side initiation write is a direct owner-scoped Supabase insert or another equally minimal authenticated persistence path, provided it preserves durable pre-backend initiation evidence.
* The exact trace table name and column spellings, provided they preserve this contract's semantics.
* The exact saved operator query filename under `db/dev_queries/flare/`.

Resolved for V0:

* Data model: one mutable trace record with milestone timestamps
* Trace identifier: client-generated and reused as the create idempotency key
* Transport mechanism: existing create request plus a best-effort durable owner-scoped initiation write before or at request start
* Authentication ownership: backend updates only after authenticated ownership verification; received authentication rejection may be recorded by the owner-scoped client
* Retrieval mechanism: direct operator database queries, not a dashboard
* Stale-state handling: effective state calculated by retrieval, not mutation-on-read
* Scope: signed-in authenticated create path only
* Participant history/export surface: not included as a participant-facing feature
* Test-data identification: explicit `is_test` marker
* Retention posture: bounded and non-permanent
* Completeness posture: best-effort and fail-open, not guaranteed

Deferred Follow-ups

The following are intentionally deferred until after the first private cohort unless a new verified investigation gap justifies them sooner:

* frontend crash reporting
* broader frontend diagnostics
* support-send route trace parity
* provider webhook delivery confirmation
* broader Flare experience-trace assessment
* distributed tracing
* dashboards
* automatic alerting
* aggregate analytics
* anomaly detection
* build or device fingerprint capture
* participant-facing trace history
* permanent retention or long-term analytics on trace rows

Design Constraints

Implementation must preserve these constraints:

* Trace must not become a prerequisite for creating the first `flare_events` row unless no safe correlation alternative exists.
* A trace persistence failure must not block the participant from the core Flare experience if the create path can still proceed safely.
* Trace incompleteness must remain visible and must not be mistaken for proof that the core Flare attempt failed.
* An unauthenticated backend request must not mutate an owner-scoped trace using caller-supplied identity or correlation values alone.
* Operational evidence must remain understandable from one bounded trace row plus existing downstream records.
* Persist only bounded privacy-safe metadata.
* Prefer existing Supabase ownership and RLS patterns.
* Prefer existing backend route, service, and repository conventions.
* Do not duplicate evidence already stored reliably in `flare_events`, `support_channel_delivery_attempts`, `flare_plan_runs`, or related tables.
* Do not broaden Trace V0 beyond the verified pre-persistence investigability gap.
