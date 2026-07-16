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
* authentication failed before domain persistence
* validation failed before domain persistence
* the request reached the backend but the first domain persistence operation failed
* another explicitly classified terminal failure occurred before first domain persistence

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

Minimal Trace V0 must let the operator determine:

* whether the signed-in frontend durably recorded that it initiated a Flare create attempt
* which authenticated user initiated that attempt
* when initiation occurred
* whether a backend request was attempted
* whether the backend received the request
* whether backend authentication succeeded or failed
* whether request validation succeeded or failed
* whether the first `flare_events` row was created
* which `flare_event_id` resulted, when available
* the terminal trace outcome
* the failure stage and safe failure code when unsuccessful
* the elapsed time between key lifecycle milestones that were actually reached
* whether a later submission was a retry of the same attempt or a distinct new attempt

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
* `flare_event_created`
* `completed`
* `failed`

Status semantics:

* `initiated` means the signed-in client durably wrote the trace start before or at the point it began the create attempt.
* `backend_received` means the backend request entry point durably claimed the trace.
* `authenticated` means backend bearer-auth resolution succeeded for that request.
* `validated` means request shape and domain validation passed far enough to attempt the first `flare_events` insert.
* `flare_event_created` means the first domain record now exists and has an authoritative `flare_event_id`.
* `completed` means the pre-persistence gap is closed successfully for this attempt.
* `failed` means the lifecycle ended before successful completion and must carry a safe failure stage and code.

Not every status must be surfaced as a separate retrieval event. The durable truth is the latest mutable row plus its milestone timestamps.

Stale trace rule:

* Any trace that remains non-terminal beyond a short bounded timeout must be resolved as `failed`.
* V0 default stale threshold should be 5 minutes from `client_initiated_at`.
* The stale terminal classification is `failure_stage = incomplete` and `failure_code = trace_terminal_state_unknown`.
* Implementation may enforce this through a lightweight cleanup step, an update-on-read rule in operator tooling, or another bounded mechanism that does not block the participant flow.

Required Data

Minimal Trace V0 must persist only the fields below or an equivalent minimal set with the same meaning.

* `id`
  * Stable primary key for the trace row.
  * Operational purpose: direct reference for diagnostics and joins.
* `trace_id`
  * Client-generated opaque identifier for one participant-perceived Flare create attempt.
  * Operational purpose: primary end-to-end correlation key across client initiation, backend request handling, and eventual `flare_event_id`.
* `user_id`
  * Authenticated Flare user owner.
  * Operational purpose: incident lookup by participant and ownership enforcement.
* `flare_event_id` nullable
  * The created domain record once available.
  * Operational purpose: handoff from pre-persistence trace to existing event/support/plan evidence.
* `route_name`
  * Fixed V0 value representing authenticated Flare create, for example `flare_event_create`.
  * Operational purpose: keep future retrieval explicit without storing raw URLs broadly.
* `status`
  * Current lifecycle status from the bounded model above.
  * Operational purpose: fast understanding of latest known state.
* `failure_stage` nullable
  * Safe stage classification when terminal status is `failed`.
  * Operational purpose: identify where the create path stopped.
* `failure_code` nullable
  * Safe bounded code when terminal status is `failed`.
  * Operational purpose: distinguish common failure classes without raw exception storage.
* `request_attempt_count`
  * Integer count of backend request receipts observed for the same `trace_id`.
  * Operational purpose: distinguish one attempt with retries from multiple distinct new attempts.
* `client_initiated_at`
  * Timestamp recorded from the client-side initiation write.
  * Operational purpose: prove the frontend initiated the attempt and anchor operator incident timing.
* `backend_received_at` nullable
  * Timestamp recorded when the backend durably claims the trace for `POST /api/flare-events`.
  * Operational purpose: distinguish client-only initiation from backend receipt.
* `authenticated_at` nullable
  * Timestamp recorded when backend auth succeeds.
  * Operational purpose: isolate auth rejection from later failures.
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
  * Timestamp for failed terminal closure.
  * Operational purpose: incident timing and terminal state verification.
* `terminal_http_status` nullable
  * Safe HTTP status associated with the terminal backend result when one exists.
  * Operational purpose: distinguish authorization, validation, conflict, and server-failure classes.
* `created_at`
  * Row creation timestamp.
  * Operational purpose: auditability.
* `updated_at`
  * Row update timestamp.
  * Operational purpose: auditability and stale-trace detection.

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
  * the client-side durable trace initiation write
  * the `Idempotency-Key` header on `POST /api/flare-events`
  * backend trace lookup and update
* The backend links the trace row to `flare_events.id` when the first domain row is created.

Why this is the minimum design:

* the route already requires `Idempotency-Key`
* reusing that identifier avoids a second overlapping correlation token
* it makes retry semantics explicit
* it preserves one operator-visible key for investigation

Idempotency and retry rules:

* One user-visible press of Send Flare creates one `trace_id`.
* Automatic network retries for the same intended attempt must reuse that same `trace_id`.
* An explicit participant retry after the first attempt is considered abandoned or failed may either:
  * reuse the same `trace_id` if the UI still treats it as the same unresolved attempt, or
  * generate a new `trace_id` only when the product clearly represents it as a new attempt
* A new deliberate Send Flare action after the prior attempt completed or was dismissed must generate a new `trace_id`.
* Duplicate backend submissions with the same `trace_id` increment `request_attempt_count` rather than creating a second trace row.
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
* `request_transport` means the signed-in client recorded initiation but did not durably confirm backend receipt.
* `backend_auth` means the backend received the request but rejected authentication before validation or persistence.
* `validation` means backend auth succeeded but request validation failed before the first `flare_events` insert.
* `domain_persistence` means validation succeeded far enough to attempt first persistence but the `flare_events` create did not complete successfully.
* `backend_unexpected` means the backend received the request but failed outside a narrower safe class.
* `incomplete` is reserved for stale traces whose terminal state cannot be resolved from durable evidence.

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

* the trace row
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

Frontend auth/request boundary:

* `frontend/src/services/flareResponseApi.ts` is the current authenticated create-request client.
* The create attempt already depends on `client.auth.getSession()` and `POST /api/flare-events`.
* V0 trace transport must align to that path rather than adding a parallel create route.

Backend request entry boundary:

* `backend/app/http/app.py` remains the WSGI entry point and route dispatcher.
* `backend/app/api/flare_plan_api.py` remains the create route handler for `POST /api/flare-events`.
* Trace must be durably claimable at or immediately after this request-entry boundary.

Authentication boundary:

* `SupabaseUserAuthenticator.authenticate()` in `backend/app/http/app.py` remains the authoritative backend auth gate.
* Backend auth success or rejection must be reflected in trace status without storing sensitive auth data.

Validation boundary:

* `FlarePlanService.create_flare_event()` remains the authoritative validation boundary for required fields, allowed `response_mode`, and idempotency-key presence.
* Validation failure must update the trace to a safe failed terminal state.

First domain persistence boundary:

* `PostgresFlarePlanRepository._create_flare_event()` remains the authoritative first domain persistence boundary.
* The trace must link to `flare_events.id` when that insert succeeds.
* Plan-run creation through `_ensure_run_for_event()` remains downstream of the first persistence boundary and must not expand Trace V0 scope.

Failure capture boundary:

* Client-side initiation or transport failures may update the trace only with bounded safe codes.
* Backend failures before first persistence must update the same trace row rather than creating parallel records.

Trace completion boundary:

* Trace completion occurs when `flare_event_created` is durably known and the row is marked `completed`.
* Trace failure occurs when one of the allowed failure stages becomes durably known.

Persistence ownership:

* The trace row belongs operationally to Flare's authenticated create path.
* Existing `flare_events`, support-channel, and plan-run tables remain authoritative for their own downstream data.
* Trace must not duplicate support-attempt rows, plan-run rows, or history data.

Retry and idempotency behavior:

* Retry correlation must use the same `trace_id` and current `Idempotency-Key`.
* Trace persistence failure must not block `flare_events` creation if the core request can still proceed safely.
* Trace is not allowed to introduce a new catastrophic failure mode for the participant.

Acceptance Criteria

1. A successful signed-in Flare initiation produces one durable trace row linked to the created `flare_event_id`.
2. The trace row shows at least `trace_id`, `user_id`, `client_initiated_at`, `backend_received_at`, `flare_event_created_at`, `completed_at`, terminal status, and `flare_event_id`.
3. A backend authentication rejection produces a durable failed trace with `failure_stage = backend_auth` and without storing tokens, raw auth payloads, or secrets.
4. A validation rejection produces a durable failed trace with `failure_stage = validation` and a bounded safe code.
5. A first domain persistence failure produces a durable failed trace with `failure_stage = domain_persistence`.
6. A signed-in client-side initiation that never reaches backend receipt still leaves durable operator-readable initiation evidence and eventually resolves to a bounded transport or incomplete failure outcome.
7. An operator can investigate a participant report using `user_id` and approximate time without reading raw logs first.
8. An operator can pivot from `trace_id` to `flare_event_id`, and from `flare_event_id` to existing response, support, and plan evidence when present.
9. Normal authenticated access cannot read another participant's trace rows.
10. Existing support-delivery and Flare Plan evidence are not duplicated into trace rows beyond the linked identifiers needed for investigation.
11. No raw participant content, raw request bodies, raw response bodies, tokens, provider secrets, or unbounded exception payloads are durably persisted in trace.
12. Retries using the same participant-perceived attempt are represented deterministically through one `trace_id` and `request_attempt_count`, not duplicated trace rows.
13. A duplicate new Send Flare action with a new `trace_id` produces a distinct trace row.
14. Trace creation or update failure does not block the participant from receiving the core Flare create experience unless no safe correlation path remains.
15. Trace rows remain bounded-retention operational metadata and do not appear in participant history.

Rollout and Validation

Minimal Trace V0 implementation must roll out in this order:

1. Local implementation of the trace write/update path across signed-in frontend initiation and backend create handling.
2. Schema, grants, and RLS validation for the trace table or equivalent persistence surface.
3. Focused backend tests for auth rejection, validation rejection, persistence failure classification, successful create linking, retry behavior, and trace-failure fail-open behavior.
4. Focused frontend tests for signed-in initiation write, retry correlation, client-side transport failure handling, and signed-out non-use of Trace V0.
5. One synthetic successful signed-in Flare that produces a linked trace and `flare_event_id`.
6. One synthetic pre-persistence failure that produces a durable failed trace without domain row creation.
7. One operator retrieval exercise using only `user_id` and approximate time.
8. Confirmation that all test traces and linked test events remain clearly labeled as test data.
9. Private-cohort readiness review confirming the trace closes the verified audit gap without widening scope.

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
* Transport mechanism: existing create request plus a durable initiation write before or at request start
* Retrieval mechanism: direct operator database queries, not a dashboard
* Scope: signed-in authenticated create path only
* Participant history/export surface: not included as a participant-facing feature
* Retention posture: bounded and non-permanent

Deferred Follow-ups

The following are intentionally deferred until after the first private cohort unless a new verified investigation gap justifies them sooner:

* frontend crash reporting
* broader frontend diagnostics
* support-send route trace parity
* provider webhook delivery confirmation
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
* Operational evidence must remain understandable from one bounded trace row plus existing downstream records.
* Persist only bounded privacy-safe metadata.
* Prefer existing Supabase ownership and RLS patterns.
* Prefer existing backend route, service, and repository conventions.
* Do not duplicate evidence already stored reliably in `flare_events`, `support_channel_delivery_attempts`, `flare_plan_runs`, or related tables.
* Do not broaden Trace V0 beyond the verified pre-persistence investigability gap.
