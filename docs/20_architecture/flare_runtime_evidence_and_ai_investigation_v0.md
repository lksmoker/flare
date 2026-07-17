# Flare Runtime Evidence & AI Investigation V0

## Purpose

Flare's operational model is intentionally AI-native.

Rather than relying on a traditional operations dashboard, the AI operator synthesizes runtime evidence, participant signals, structured operational records, and human observations into an operational understanding that can be queried at any time.

This document describes the evidence available during private testing, how investigations are performed, and the principles guiding future observability work.

## Scope and Status

This is a V0 architecture reference for the private-testing operating model.

The evidence inventory below is now based on a repository audit of the implementation present on July 16, 2026 and was updated on July 17, 2026 after Flare Minimal Trace V0 was implemented for signed-in `POST /api/flare-events`. It should be updated again when runtime evidence changes materially or when new private-cohort workflows expose additional retrieval surfaces.

## Design Principles

### Evidence over dashboards

Operational truth comes from evidence.

Dashboards are merely one possible presentation of that evidence and are intentionally deferred during private testing.

### Signals first

Every investigation begins with a signal that requires interpretation.

Signals may originate from:

- conversation
- Google Form
- operator observation
- runtime anomaly

The signal determines what evidence should be collected.

### AI maintains operational state

The AI operator is responsible for:

- interpreting incoming signals
- correlating evidence
- updating Operations Records
- identifying likely causes
- producing operational snapshots
- recommending follow-up actions

The AI is not considered the source of truth.

Instead, it continuously synthesizes authoritative evidence into an up-to-date operational understanding.

## Evidence Sources

### Runtime Evidence

Verified implementation-backed runtime evidence currently includes:

- `flare_events`
- `checkpoint_reflections`
- `support_channels`
- `support_channel_delivery_attempts`
- `support_channel_provider_configs`
- `flare_plans`
- `flare_plan_actions`
- `flare_plan_runs`
- `flare_plan_run_actions`
- `flare_plan_idempotency_keys`
- backend `/api/health`
- backend process logs for unhandled API exceptions only

### Operational Evidence

Maintained within Google Workspace.

Examples include:

- participant roster
- operations records
- release notes
- operator observations
- investigation notes

### Participant Evidence

Includes:

- signals
- optional Forms
- direct conversations
- qualitative feedback

### Durable Product Evidence

Maintained within GitHub.

Includes:

- contracts
- architecture
- checkpoints
- operational decisions
- synthesized learning
- release documentation

## AI Investigation Workflow

```text
Participant Signal
        |
        v
Evidence Collection
        |
        v
Evidence Correlation
        |
        v
Operational Assessment
        |
        v
Operations Records Updated
        |
        v
Snapshot Generated (on demand)
        |
        v
Durable Learning (if appropriate)
```

## Investigation Scenarios

Each investigation begins with a participant question rather than a technical subsystem.

Examples include:

- "Nothing happened."
- "My support person never received the message."
- "The plan wasn't helpful."
- "The app crashed."
- "The support message arrived late."

For each scenario, the operator identifies available evidence, develops an evidence-backed assessment, records uncertainty where the evidence is incomplete, and captures any learning that should influence future product decisions.

## Audit Method

This audit verified the implementation present on July 16, 2026 against the provisional evidence claims in this document and the relevant product and architecture contracts.

Primary sources reviewed:

- `docs/00_product/contracts/flare_private_testing_v0_contract.md`
- `docs/00_product/contracts/flare_external_support_channel_v0.md`
- `docs/00_product/contracts/flare_plan_v0_contract.md`
- `docs/00_product/contracts/flare_plan_v0_api_contract.md`
- `docs/00_product/contracts/flare_response_experience_v0_contract.md`
- `docs/20_architecture/flare_v0_data_persistence_contract.md`
- `db/migrations/20260627_230500_flare_v0_persistence.sql`
- `db/migrations/20260702_110000_flare_events_archive_support.sql`
- `db/migrations/20260705220110_external_support_channel_v0.sql`
- `db/migrations/20260706112500_support_channel_provider_configs.sql`
- `db/migrations/20260708073000_flare_plan_v0_persistence.sql`
- `db/migrations/20260709030000_flare_plan_run_declined_at.sql`
- `backend/app/http/app.py`
- `backend/app/api/flare_plan_api.py`
- `backend/app/api/support_channels_api.py`
- `backend/app/db/flare_plan_repository.py`
- `backend/app/db/support_channel_repository.py`
- `backend/app/services/support_channel_sender.py`
- `backend/app/integrations/groupme_provider.py`
- `frontend/src/screens/FlareScreen.tsx`
- `frontend/src/state/FlareEventContext.tsx`
- `frontend/src/services/flareEventRepository.ts`
- `frontend/src/services/checkpointReflectionRepository.ts`
- `frontend/src/services/flareResponseApi.ts`
- `frontend/src/services/supportChannelApi.ts`
- `frontend/src/screens/HistoryScreen.tsx`

Focused verification approach:

- Verified each claimed evidence source against migrations or concrete persistence code rather than route names alone.
- Verified correlation fields and timestamps from actual table definitions and API/domain serializers.
- Verified retrieval paths from implemented frontend screens, backend read models, scripts, and health routes.
- Verified support-delivery semantics against provider integration code rather than assuming provider success means human receipt.
- Verified tests that prove lifecycle behavior, persistence, and delivery-attempt recording.
- Treated missing durable logs, crash records, and export surfaces as absence unless concrete implementation was found.

Validation evidence gathered during the audit:

- Ran backend `unittest` suites covering flare-plan lifecycle, support-channel delivery persistence, API behavior, and health/error-route behavior:
  - `python -m unittest backend.tests.test_flare_plan_run_v0 backend.tests.test_support_channel_sender backend.tests.test_support_channel_http_app backend.tests.test_support_channels_api`
- Ran frontend Jest suites covering persisted flare-event mapping, checkpoint-reflection mapping, auth state handling, history retrieval, and persistence-context behavior:
  - `npm test -- --runTestsByPath src/services/__tests__/flareEventRepository.test.ts src/services/__tests__/checkpointReflectionRepository.test.ts src/services/__tests__/flareSupabaseAuth.test.ts src/screens/__tests__/history_screen.test.tsx src/state/__tests__/flareEventPersistenceContext.test.tsx`
- Attempted `python -m pytest ...`, but `pytest` is not installed in the active interpreter in this workspace. The relevant backend suites are `unittest`-compatible and were run successfully through `python -m unittest`.

Trace implementation update on July 17, 2026:

- Signed-in `POST /api/flare-events` now writes one owner-scoped mutable trace row in `public.flare_event_traces` keyed by the client-generated `trace_id`.
- The signed-in frontend reuses that `trace_id` as the `Idempotency-Key` and records bounded client-observed failures when safe.
- The authenticated backend updates the same row at `backend_received`, `authenticated`, `validated`, and `completed` or `failed` milestones without creating a parallel event-create path.
- Operator investigation now has a saved query at `db/dev_queries/flare/investigate_flare_minimal_trace_v0.sql`.
- Manual stale cleanup and bounded retention commands now live at `db/dev_queries/flare/cleanup_flare_minimal_trace_v0.sql`.

## Verified Runtime Evidence Inventory

| Lifecycle Stage | Evidence | Implementation Location | Persistence | Correlation Fields | Retrieval Method | Status | Operator Questions Answered | Gaps |
|---|---|---|---|---|---|---|---|---|
| Participant identity and auth | Supabase session in client, bearer-token auth lookup in backend | `frontend/src/services/flareSupabaseAuth.ts`, `backend/app/http/app.py` | Session is external to this repo's product tables; no Flare-owned auth audit row | `user_id`, email in frontend auth state | Client auth UI state; backend accepts or rejects request | Partially verified | Whether the user was signed in when the current client session was read; whether backend required auth | No durable auth-attempt log, no per-request auth success record, no session-to-flare correlation record |
| Flare create trace | `flare_event_traces` mutable row for signed-in create attempts | `db/migrations/20260717120000_flare_minimal_trace_v0.sql`, `frontend/src/services/sendFlareWithTrace.ts`, `frontend/src/services/flareTraceRepository.ts`, `backend/app/services/flare_trace_service.py`, `backend/app/api/flare_plan_api.py` | Persisted in Postgres | `trace_id`, `user_id`, `flare_event_id`, lifecycle timestamps, `request_attempt_count` | Direct DB query through `db/dev_queries/flare/investigate_flare_minimal_trace_v0.sql` | Verified and queryable | Whether the signed-in client durably initiated the create attempt, whether the authenticated backend received and validated it, where it failed before first persistence, whether the request replayed, and which `flare_event_id` resulted | Only the signed-in `POST /api/flare-events` path is covered; signed-out flows and downstream support-send trace parity remain out of scope |
| Flare event creation | `flare_events` row with snapshots and timestamps | `db/migrations/20260627_230500_flare_v0_persistence.sql`, `backend/app/db/flare_plan_repository.py::_create_flare_event` | Persisted in Postgres | `id`, `user_id`, `behavior_pattern_id`, `anchor_note_id`, `anchor_note_version`, `created_at`, `updated_at`, `closed_at`, `archived_at` | Direct DB query; History screen; `GET /api/flare-events/{id}/response` | Verified and queryable | Whether a flare event was created; which behavior snapshot and anchor-note link were stored; when it was created | Trace V0 now closes the pre-persistence gap only for the signed-in create path; downstream route gaps remain separate |
| Flare response retrieval | Canonical response read model combining event, latest support delivery, and run | `backend/app/db/flare_plan_repository.py::read_flare_response`, `frontend/src/services/flareResponseApi.ts` | Derived read, not separately persisted | `flare_event.id`, latest delivery `flare_event_id`, run `flare_event_id` | `GET /api/flare-events/{id}/response` | Verified and queryable | Current event state, latest delivery state for that event, current run state | Only latest support attempt is surfaced; no request log for failed reads |
| External support-channel configuration | `support_channels` current configuration row | `db/migrations/20260705220110_external_support_channel_v0.sql`, `backend/app/db/support_channel_repository.py` | Persisted in Postgres | `id`, `user_id`, `provider`, `external_group_id`, `external_group_name`, `provider_config_ref`, `last_delivery_status`, `last_delivery_at`, `updated_at` | `GET /api/support-channel`; direct DB query | Verified and queryable | Whether a support channel exists, whether it is enabled, which destination is configured, last delivery summary | Only one current channel surfaced; no history of config changes |
| Backend-only provider authorization | `support_channel_provider_configs` row including access token and bot metadata | `db/migrations/20260706112500_support_channel_provider_configs.sql`, `backend/app/services/support_channel_groupme_provisioner.py` | Persisted in Postgres | `id`, `user_id`, `provider`, `status`, `bot_id`, `external_group_id`, `external_group_name`, `updated_at` | Direct DB query via service-role tooling only | Verified but difficult to retrieve | Whether GroupMe authorization and bot provisioning completed | Not user-facing; sensitive; no ordinary operator UI |
| Support-message send attempts | `support_channel_delivery_attempts` rows for sends that reach `SupportChannelSender` | `db/migrations/20260705220110_external_support_channel_v0.sql`, `backend/app/services/support_channel_sender.py`, `backend/app/db/support_channel_repository.py` | Persisted in Postgres | `id`, `user_id`, `support_channel_id`, `flare_event_id`, `send_kind`, `destination_id`, `destination_name`, `status`, `provider_message_id`, `attempted_at`, `delivered_at`, `error_code`, `raw_provider_status_ref` | Direct DB query; latest attempt partially surfaced through response read model | Verified and queryable | Whether delivery was attempted, what message was attempted, which destination was used, whether send was sent/failed/blocked after a channel was found | If no support channel is configured, `/api/support-channel/send-flare` returns a blocked response without inserting an attempt row; no ordinary UI for full attempt history; exact message snapshot is sensitive and not surfaced in History |
| Provider response semantics | Normalized provider result from GroupMe bot POST | `backend/app/integrations/groupme_provider.py` | Persisted as delivery-attempt fields | `provider_message_id`, `status`, `attempted_at`, `delivered_at`, `error_code`, `raw_provider_status_ref` | Delivery attempt rows; safe API result payload | Verified and queryable | Whether GroupMe accepted the POST or rejected it | `status='sent'` is based on provider HTTP acceptance, not confirmed human delivery or read receipt |
| Flare Plan configuration | `flare_plans`, `flare_plan_actions`, starter templates | `db/migrations/20260708073000_flare_plan_v0_persistence.sql`, `backend/app/db/flare_plan_repository.py` | Persisted in Postgres | `plan.id`, `user_id`, action `id`, `source_template_key`, `position`, `updated_at` | `GET /api/flare-plan`; direct DB query | Verified and queryable | Whether a plan existed, which actions were active, current order | No qualitative evidence of whether the user found the plan useful |
| Flare Plan run creation | `flare_plan_runs` plus snapshotted `flare_plan_run_actions` | `backend/app/db/flare_plan_repository.py::_ensure_run_for_event` | Persisted in Postgres | `run.id`, `flare_event_id`, `source_plan_id`, `status`, `offered_at`; action snapshot `source_action_id`, `position` | `POST/GET /api/flare-events/{id}/flare-plan-run`; response read model; DB query | Verified and queryable | Whether a configured plan was offered for a specific flare and exactly which actions were snapshotted | No separate audit row for the user seeing the offer; offer happens on event creation, not on sheet render |
| Action progression | Run-action outcomes and current run state | `backend/app/db/flare_plan_repository.py::_resolve_run_action` | Persisted in Postgres | `run_id`, `event_action_id`, `outcome`, `responded_at`, run `updated_at` | Run routes and DB query | Verified and queryable | Which step was current, done, skipped, or still pending | No durable record of why a user skipped a step |
| Action completion | `outcome='done'` on run action | Same as above | Persisted in Postgres | `run_id`, action `id`, `responded_at` | Run read model; DB query | Verified and queryable | Which actions were completed and when | No qualitative context for why completion helped |
| Action skipping | `outcome='skipped'` on run action | Same as above | Persisted in Postgres | `run_id`, action `id`, `responded_at` | Run read model; DB query | Verified and queryable | Which actions were skipped and when | No persisted skip reason |
| Plan finishing | Run status `completed` and `completed_at` | `backend/app/db/flare_plan_repository.py::_resolve_run_action` | Persisted in Postgres | `run.id`, `flare_event_id`, `completed_at` | Run read model; DB query | Verified and queryable | Whether the user completed the plan | No checkpoint route implemented yet in backend run API |
| Plan declining | Run status `declined`, `declined_at`, unresolved actions set `not_reached` | `db/migrations/20260709030000_flare_plan_run_declined_at.sql`, `backend/app/db/flare_plan_repository.py::_decline_run` | Persisted in Postgres | `run.id`, `flare_event_id`, `declined_at` | Run read model; DB query | Verified and queryable | Whether the user skipped the plan before starting | No persisted explanation for decline |
| Plan ending early | Run status `ended_early`, `ended_at`, unresolved actions `not_reached` | `backend/app/db/flare_plan_repository.py::_end_run_early` | Persisted in Postgres | `run.id`, `flare_event_id`, `ended_at` | Run read model; DB query | Verified and queryable | Whether the user ended the plan and how many steps were not reached | No persisted end reason |
| Checkpoint / reflection creation | `checkpoint_reflections` row plus flare-event status update to `reflected` | `db/migrations/20260627_230500_flare_v0_persistence.sql`, `frontend/src/services/checkpointReflectionRepository.ts`, `frontend/src/state/FlareEventContext.tsx` | Persisted in Postgres | reflection `id`, `flare_event_id`, `user_id`, `created_at`, `updated_at`; flare event `status` | History screen; direct DB query | Verified and queryable | Whether a reflection exists and its qualitative content | Separate from `flare_plan_run_checkpoints`; backend run checkpoint routes are not implemented |
| Backend request errors | API error response payloads | `backend/app/api/flare_plan_api.py`, `backend/app/api/support_channels_api.py` | Response only, not durably retained by server | Error `code`, HTTP status, sometimes `details` | Client-visible error on failed live request | Partially verified | Why a current request failed when the client observed it | No durable request-error table or structured request log |
| Provider errors | Failed or blocked delivery-attempt rows | `backend/app/integrations/groupme_provider.py`, `backend/app/services/support_channel_sender.py` | Persisted in Postgres | `error_code`, `error_message_safe`, `raw_provider_status_ref`, `attempted_at` | Delivery-attempt query; latest delivery in response read model | Verified and queryable | Whether GroupMe rejected, was unreachable, or local channel state blocked sending | No raw provider payload retention beyond safe status ref |
| Persistence errors | Frontend `console.warn`, backend exception path | `frontend/src/state/*.tsx`, `backend/app/http/app.py` | Frontend warnings are ephemeral; backend only logs unhandled exceptions | None durable in product tables | Device console, backend process log | Present only in ephemeral logs | That a local save/load failed during the active session | No durable persistence-failure audit surface |
| Server or runtime logs | Python logger for unhandled API exceptions only | `backend/app/http/app.py` | Ephemeral process log unless deployment captures it externally | Method and path in log message | Server log access | Present only in ephemeral logs | That an unhandled backend exception occurred for a route | No request-level success log, no durable correlation id, no structured trace record |
| Frontend-visible errors | Local state `responseError`, API exceptions, console warnings | `frontend/src/screens/FlareScreen.tsx`, `frontend/src/services/*.ts`, `frontend/src/state/*.tsx` | UI state is ephemeral; warnings are console-only | Error message text only | On-screen error during current session | Present only in ephemeral logs | What the participant saw at the time | No durable crash or error-reporting pipeline |
| Timestamps and correlation identifiers | IDs and timestamps across tables | Migrations and serializers listed above | Persisted in Postgres where present | `user_id`, `flare_event_id`, run `id`, attempt `id`, action `id`, `created_at`, `updated_at`, `attempted_at`, `delivered_at`, `responded_at` | DB query; API reads | Verified and queryable | Cross-table reconstruction of one flare after records exist | No single chronological trace id spanning frontend action, event create request, support send request, and follow-up reads |
| Participant history surface | History screen over `flare_events` and attached `checkpoint_reflections` | `frontend/src/screens/HistoryScreen.tsx`, `frontend/src/services/flareEventRepository.ts` | Read-only surface over persisted rows | Event `id`, timestamps, checkpoint content | History screen | Verified and queryable | What flare events and reflections the participant can review today | Does not show support delivery attempts, plan-run action history, or provider outcomes |
| Participant export surface | No implemented export route or file generation found | Repository search | None | None | None | Not currently available | None | Data export remains manual/out of band if needed |
| Diagnostic route | `/api/health` route list and origin/runtime config | `backend/app/http/app.py`, `backend/tests/test_support_channel_http_app.py` | Response only | Backend base URL, allowed origins, declared routes | `GET /api/health` | Verified and queryable | Whether the backend is up and which routes are wired into the WSGI app | No DB connectivity probe, no provider readiness probe, no recent error summary |

## Correlation Model

### Strongly supported correlations

The current implementation can reliably correlate the following once at least one persisted record exists:

- Participant account to product data through `user_id` on `flare_events`, `checkpoint_reflections`, `support_channels`, `support_channel_delivery_attempts`, `support_channel_provider_configs`, and `flare_plans`.
- One flare to one plan run through `flare_plan_runs.flare_event_id`.
- One flare to one or more support delivery attempts through `support_channel_delivery_attempts.flare_event_id`.
- One run to its snapshotted actions through `flare_plan_run_actions.run_id`.
- One reflection to one flare through `checkpoint_reflections.flare_event_id`.
- Current support configuration to last delivery summary through `support_channels.last_delivery_status` and `last_delivery_at`.

### Partially supported correlations

- Frontend send action to backend flare creation: inferable only if a `flare_events` row exists after the participant action.
- Frontend send action to backend support send attempt: inferable only if `support_channel_delivery_attempts` contains the `flare_event_id`, or if the participant observed the live blocked response when no channel existed.
- Authentication success for a specific request: inferable only from the request succeeding and producing downstream records.
- Provider acceptance to final human receipt: not supported. GroupMe success records provider acceptance, not delivery confirmation.

### Missing correlations

The following do not currently have a durable, implementation-backed correlation record:

- A single end-to-end trace identifier spanning the create request, support-send request, response-sheet load, and later checkpoint. Minimal Trace V0 now covers only the signed-in create path.
- Durable frontend crash evidence or JS exception capture.
- Durable per-request backend access log with request id, auth result, status code, and latency.
- Durable linkage from a participant report to the exact client build, device, browser, or app version.

## Investigation Scenario Findings

### Scenario 1: "I pressed Flare and nothing happened."

What can be established today:

- If a `flare_events` row exists, the backend received and persisted the flare creation request.
- If a `flare_plan_runs` row exists for that event, the backend also offered a persisted plan snapshot at creation time.
- If a `support_channel_delivery_attempts` row exists with that `flare_event_id`, the subsequent support-send request was attempted.
- If no support channel exists, the current configuration can be checked from `support_channels`, but that absence does not itself prove the support-send request was attempted because the missing-channel path does not persist an attempt row.
- If the participant remained on screen and saw an error, the frontend may have held an ephemeral error message in `responseError`, but it is not durably retained.

What cannot be established reliably:

- Whether the frontend tap happened at all if no `flare_events` row exists.
- Whether the create request was sent but failed before reaching the backend.
- Whether auth failed for the create request unless the participant observed the error at the time.
- Whether the frontend crashed between event creation and support-send initiation.

Assessment:

- Evidence sufficiency for the first cohort is partial. The operator can investigate persisted success and many partial failures, but not the absence of all downstream records.

### Scenario 2: "My support person never received the message."

What can be established today:

- Whether a support channel was configured, enabled, and connected from `support_channels`.
- Which destination group was configured from `external_group_id` and `external_group_name`.
- Whether a real send was attempted from `support_channel_delivery_attempts` once a support channel existed and the request reached `SupportChannelSender`.
- Which exact message was attempted from `message_snapshot`.
- Whether the attempt was blocked, failed, or marked sent, with safe error context and provider status ref.
- Whether the send was tied to a specific flare through `flare_event_id`.

What cannot be established reliably:

- Whether the app actually called `/api/support-channel/send-flare` when no support channel was configured, because that route returns a blocked result without writing a delivery-attempt row.
- Whether GroupMe final delivery to each device occurred.
- Whether any human saw the message.
- Whether notification delays happened on the recipient side after GroupMe accepted the request.

Assessment:

- This is the strongest investigated scenario in the current implementation. It is suitable for first-cohort troubleshooting as long as operator guidance states clearly that provider acceptance is not proof of human receipt.

### Scenario 3: "The plan did not help."

What can be established today:

- Whether a plan existed from `flare_plans` and `flare_plan_actions`.
- Whether a run was offered for that flare from `flare_plan_runs`.
- Which actions were snapshotted for that flare from `flare_plan_run_actions`.
- Which actions were done, skipped, or not reached, and when a done or skipped outcome was recorded.
- Whether the user declined, completed, or ended early.
- Whether a checkpoint/reflection exists and what qualitative text it captured.

What qualitative context is absent:

- Why a user skipped or ended the plan.
- Which action felt unhelpful unless the user wrote it into the reflection.
- Whether the plan copy or pacing was confusing in the moment.

Assessment:

- Sufficient for first-cohort structured reconstruction of plan usage.
- Insufficient for deeper qualitative judgment without participant follow-up or reflection text.

### Scenario 4: "The app crashed or stopped responding."

What can be established today:

- The last successful persisted operation if a new `flare_events`, `checkpoint_reflections`, or plan-run mutation row exists.
- Whether an unhandled backend exception reached the server log.
- Whether the backend health route was reachable when checked later.

What cannot be established reliably:

- Durable frontend crash evidence.
- Durable JS exception capture.
- A request timeline showing the last successful frontend request before the crash.
- Session correlation beyond the participant account and any already-persisted event ids.

Assessment:

- This is a major blind spot. The operator can inspect persisted state after the fact, but true crash investigation is weak when the failure happened before persistence.

### Scenario 5: "The support message arrived late."

What can be established today:

- Flare creation time from `flare_events.created_at`.
- Delivery attempt start time from `support_channel_delivery_attempts.attempted_at`.
- Provider-accepted time from `support_channel_delivery_attempts.delivered_at`, which is set to the same timestamp as provider acceptance in the GroupMe adapter.
- Whether the request was blocked or failed instead of sent.

What cannot be established reliably:

- Final delivery time to recipient devices.
- Read time or human-response time.
- Frontend-to-backend latency for the support-send request, because no durable request timing log exists.

Assessment:

- Good enough to distinguish "message was never attempted" from "provider accepted it."
- Not good enough to explain recipient-perceived lateness after provider acceptance.

## Known Blind Spots

- No durable frontend interaction log. If no server-side record was created, the operator cannot prove whether the participant tapped Send Flare.
- No durable backend request log or request correlation id. Successes and handled failures are not retained as structured server records.
- No durable crash reporting or JS exception capture.
- `GET /api/flare-events/{id}/response` exposes only the latest support delivery for a flare, not the full attempt history.
- History UI does not expose support delivery attempts, plan-run action history, or provider outcomes.
- Backend run checkpoint tables and routes exist in schema and contract, but the implemented participant reflection path uses `checkpoint_reflections` tied to `flare_events` instead.
- No participant-facing or operator-facing export surface was found.
- No configuration-change history for support channel settings.
- No provider confirmation beyond HTTP acceptance from GroupMe.
- Signed-out fallback flows create local-only flare state and built-in default runs that are not durably queryable.

## Private-Cohort Sufficiency Assessment

### Sufficient today for the first private cohort

- Confirming whether a signed-in flare event was persisted.
- Confirming whether a support group was configured.
- Confirming whether a support send was attempted, blocked, failed, or provider-accepted.
- Reconstructing plan offer, action progression, decline, completion, and early end.
- Reading participant-authored checkpoint/reflection content when it was saved.
- Reviewing participant event history and archive/restore state.

### Useful during the cohort but not strictly required before the first participant

- A direct operator query or internal tool that shows full support delivery attempts by `flare_event_id`.
- A direct operator query or internal tool that reconstructs one flare chronologically across event, delivery attempt, run, actions, and reflection.
- A lightweight way to capture which visible error the participant saw when the record already exists.

### Not sufficient today

- Proving that a frontend send attempt happened when no durable rows were created.
- Investigating frontend crashes or hangs with confidence.
- Measuring end-to-end request timing or recipient-side delivery latency.
- Proving final human receipt of support messages.

Overall assessment:

- Current runtime evidence is sufficient to begin a tightly managed first private cohort if participant expectations remain narrow and operator workflow explicitly acknowledges the blind spots above.
- Current runtime evidence is not strong enough to support low-friction investigation of "nothing happened" and crash-style reports without manual follow-up.

## Trace V0 Implementation Status

**Status: implemented on July 17, 2026 for signed-in `POST /api/flare-events`.**

What this now closes:

- Durable owner-scoped initiation evidence for the signed-in create attempt.
- Shared `trace_id` and `Idempotency-Key` correlation for the authenticated create path.
- Durable classification of validation, authenticated-backend, domain-persistence, unexpected-backend, and effective stale outcomes for that route when trace persistence succeeds.
- One saved operator retrieval surface that joins trace, event, delivery, and run evidence without persisting participant content in the trace row.

What remains intentionally deferred:

- Support-send route trace parity.
- Flare Plan mutation route trace parity.
- Crash reporting, broader request logging, dashboards, and aggregate analytics.
