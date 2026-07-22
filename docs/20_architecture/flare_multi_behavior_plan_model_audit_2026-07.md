<!-- @context: { "kind": "architecture.audit", "layer": "docs", "name": "Flare Multi-Behavior Plan Model Audit 2026-07", "domains": ["architecture", "persistence", "data-model", "flare", "private-testing"] } -->

# Flare Multi-Behavior Plan Model Audit 2026-07

Status: draft  
Doc Type: architecture audit  
Role: Assess whether the current Flare persistence and runtime model can safely support a first limited private test constrained to one primary behavior per tester while the full multi-behavior product model is deferred.

## 1. Status and scope

- Verified fact: This audit is repository-evidence-only and documentation-only. No runtime code, schema, or test behavior was changed in this run.
- Verified fact: The audited question is whether Flare can safely collect real tester data under a one-primary-behavior-per-tester constraint before implementing the long-term model of multiple behavior patterns with behavior-specific plans.
- Verified fact: The product model treated as settled for this audit is the seven-point model provided in the run prompt, including generic flare signaling, later behavior selection, behavior-specific plans, and historical retention of the behavior and plan actually used.

## 2. Executive conclusion

- Recommendation: **Disposition A. SAFE TO TEST AS CONSTRAINED.**
- Verified fact: The current implementation is fundamentally a `one active plan per user` model, not a `one active plan per behavior pattern` model, enforced in both schema and runtime (`db/migrations/20260708073000_flare_plan_v0_persistence.sql:200`; `backend/app/db/flare_plan_repository.py:1227-1268`; `frontend/src/state/FlarePlanContext.tsx:228-353`).
- Verified fact: The current implementation also preserves the historical plan actually used at flare time through `flare_plan_runs` and snapshotted `flare_plan_run_actions`, which prevents later plan edits from rebinding plan-history meaning (`db/migrations/20260708073000_flare_plan_v0_persistence.sql:75-118,233`; `backend/app/db/flare_plan_repository.py:1633-1669`; `backend/tests/test_flare_plan_run_v0.py:17-39,243-268`).
- Inference: Because the current model is user-singleton for plan configuration but event-snapshotted for plan execution, the first private test can safely collect semantically correct data if each tester is deliberately limited to one primary behavior for the duration of the cohort.
- Recommendation: The test protocol must state that each tester should configure Flare for one primary behavior or situation only, and should not repurpose the same account mid-cohort for a different primary behavior without explicit operator review.
- Recommendation: Broader beta should not begin until Flare has an explicit behavior-to-plan ownership model and a flare-event model that can exist without a behavior classification.

## 3. Product model being evaluated

- Verified fact: The target product model requires a generic flare event, an optional later behavior selection, behavior-specific plan execution, non-disclosing external support delivery, multiple future plans per user, and durable historical evidence of the behavior and plan actually used.
- Verified fact: The current V0 product contract still declares one active plan per user and at most one plan run per flare event (`docs/00_product/contracts/flare_plan_v0_contract.md:70,95`).
- Verified fact: The current private-testing contract also declares one active external support channel and one GroupMe destination per tester (`docs/00_product/contracts/flare_private_testing_v0_contract.md:715-716`).

## 4. Evidence sources inspected

- Verified fact: Persistence and schema evidence:
  - `db/migrations/20260627_230500_flare_v0_persistence.sql`
  - `db/migrations/20260702_110000_flare_events_archive_support.sql`
  - `db/migrations/20260705220110_external_support_channel_v0.sql`
  - `db/migrations/20260708073000_flare_plan_v0_persistence.sql`
  - `db/migrations/20260717120000_flare_minimal_trace_v0.sql`
  - `C:/dev/dev-toolbox-starter/.toolbox/schema_supabase.json` generated `2026-07-18 21:13:12` UTC
- Verified fact: Backend runtime evidence:
  - `backend/app/db/flare_plan_repository.py`
  - `backend/app/services/flare_plan_service.py`
  - `backend/app/api/flare_plan_api.py`
  - `backend/app/db/support_channel_repository.py`
  - `backend/app/services/support_channel_management.py`
- Verified fact: Frontend runtime evidence:
  - `frontend/src/services/behaviorPatternRepository.ts`
  - `frontend/src/state/BehaviorPatternContext.tsx`
  - `frontend/src/services/anchorNoteRepository.ts`
  - `frontend/src/state/AnchorNoteContext.tsx`
  - `frontend/src/state/FlarePlanContext.tsx`
  - `frontend/src/state/FlareEventContext.tsx`
  - `frontend/src/services/flareEventRepository.ts`
  - `frontend/src/services/flareResponseApi.ts`
  - `frontend/src/services/sendFlareWithTrace.ts`
  - `frontend/src/screens/CustomizeScreen.tsx`
  - `frontend/src/screens/FlareScreen.tsx`
  - `frontend/src/screens/HistoryScreen.tsx`
- Verified fact: Contract and prior architecture evidence:
  - `docs/00_product/contracts/flare_plan_v0_contract.md`
  - `docs/00_product/contracts/flare_response_experience_v0_contract.md`
  - `docs/00_product/contracts/flare_private_testing_v0_contract.md`
  - `docs/20_architecture/flare_v0_data_persistence_contract.md`
  - `docs/20_architecture/flare_signed_in_persistence_ownership_audit_2026-07.md`
  - `docs/20_architecture/flare_runtime_evidence_and_ai_investigation_v0.md`
- Verified fact: Focused existing validation used in this audit:
  - `python -m unittest backend.tests.test_flare_plan_run_v0`
  - `npm test -- --runTestsByPath src/screens/__tests__/flare_plan_configure.test.tsx`

## 5. Current end-to-end model

- Verified fact: A signed-in `Send Flare` call posts directly to `POST /api/flare-events`, supplying `behavior_label_snapshot`, optional `behavior_pattern_id`, optional `anchor_note_id` and `anchor_note_version`, `response_mode`, and optional `support_action_shown` (`backend/app/api/flare_plan_api.py:97-108`; `frontend/src/services/flareResponseApi.ts:327-351`; `frontend/src/screens/FlareScreen.tsx:280-293`).
- Verified fact: After the flare event is created, the backend immediately ensures there is at most one run for that event and snapshots the active user plan into `flare_plan_run_actions` (`backend/app/db/flare_plan_repository.py:1633-1669`).
- Verified fact: External support delivery is a separate step after flare creation; the mobile screen uses the returned `flare_event_id` to call support send, and the delivery attempt table is keyed by `flare_event_id` without any behavior-specific field (`frontend/src/screens/FlareScreen.tsx:324-343`; `db/migrations/20260705220110_external_support_channel_v0.sql:80-118`).
- Verified fact: Response loading later uses the flare event id as the canonical join point for event state, latest delivery state, and plan-run state (`backend/app/db/flare_plan_repository.py:542-549,1473-1479,1498-1509`; `frontend/src/services/flareResponseApi.ts:359-365`).
- Inference: Today's runtime model is `user-owned setup -> flare_event snapshot -> one optional event-bound run -> later history lookup by flare_event_id`, not `generic flare -> later behavior classification -> behavior-selected plan launch`.

## 6. Cardinality and ownership findings

- Verified fact: One user can own multiple `behavior_patterns` rows at the schema level because the table has no unique `(user_id, status)` constraint and the only unique partial index is on `is_primary` when active (`db/migrations/20260627_230500_flare_v0_persistence.sql:1-18,101-103`).
- Verified fact: The repository and context do not expose multiple behavior patterns. They always load one latest active record and save the current record back as `is_primary: true` (`frontend/src/services/behaviorPatternRepository.ts:48-66,91-111`; `frontend/src/state/BehaviorPatternContext.tsx:127-176`).
- Verified fact: One user can own multiple `anchor_notes` rows at the schema level because the table has no one-active-note-per-user constraint (`db/migrations/20260627_230500_flare_v0_persistence.sql:20-39`).
- Verified fact: The anchor-note repository and context also collapse to one latest active row and treat saving as updating the current row or inserting a new one (`frontend/src/services/anchorNoteRepository.ts:48-65,89-113`; `frontend/src/state/AnchorNoteContext.tsx:101-157`).
- Verified fact: Each flare plan action belongs to a plan, and multiple actions can exist per plan with unique contiguous active positions (`db/migrations/20260708073000_flare_plan_v0_persistence.sql:36-73,208-227,283-375`).
- Verified fact: The critical singleton is `idx_flare_plans_one_active_per_user`, which enforces exactly one active plan container per user (`db/migrations/20260708073000_flare_plan_v0_persistence.sql:200-202`).
- Verified fact: The backend repository reinforces that singleton by reading or lazily creating only one active plan for the user (`backend/app/db/flare_plan_repository.py:1227-1268`).
- Verified fact: The frontend plan state is also singleton-oriented. It loads exactly one `ActiveFlarePlan`, exposes one `plan`, and treats readiness as `Boolean(plan?.active_action_count)` (`frontend/src/state/FlarePlanContext.tsx:128-136,228-353,666-667`).
- Verified fact: No current table or route assigns a plan to a `behavior_pattern_id`.
- Verified fact: `legacy_behavior_pattern_id` on `flare_plan_actions` is a migration trace field for old `preferred_recovery_actions`, not a current ownership boundary (`db/migrations/20260708073000_flare_plan_v0_persistence.sql:44,227-231,819-821`; `frontend/src/screens/__tests__/flare_plan_configure.test.tsx:725-754`).
- Inference: The current persisted model safely supports one plan per user and multiple actions in that plan, but it does not support independent concurrent plans for multiple behavior patterns owned by the same user.

## 7. Flare creation and behavior-binding findings

- Verified fact: `flare_events.behavior_pattern_id` is nullable in the table definition (`db/migrations/20260627_230500_flare_v0_persistence.sql:49-57`).
- Verified fact: `flare_events.behavior_label_snapshot` is not nullable and must be non-blank (`db/migrations/20260627_230500_flare_v0_persistence.sql:52,61`).
- Verified fact: The backend service rejects flare creation when `behavior_label_snapshot` is blank and only accepts `response_mode` values `configured` or `fallback-generic` (`backend/app/services/flare_plan_service.py:175-185`).
- Verified fact: The signed-in frontend currently always sends a behavior label, falling back to `"Behavior pattern not configured"` when no behavior is configured (`frontend/src/screens/FlareScreen.tsx:285-288`).
- Verified fact: The local signed-out fallback path also creates a flare event with a behavior label, using the same default string if needed (`frontend/src/state/FlareEventContext.tsx:127,414-418`).
- Verified fact: External support delivery occurs after flare-event creation and only receives `flare_event_id`; the support-channel runtime does not require a behavior id or behavior label (`frontend/src/screens/FlareScreen.tsx:324-343`; `backend/app/api/support_channels_api.py:173-180`; `db/migrations/20260705220110_external_support_channel_v0.sql:83-118`).
- Inference: The current model already keeps external support delivery generic with respect to behavior selection.
- Inference: The current model does not yet support the settled long-term rule that a flare can exist before behavior selection or permanently without any behavior classification, because the API still requires a non-empty `behavior_label_snapshot`.
- Recommendation: Treat `support-only` and `unclassified flare` as explicitly deferred architecture work for before broader beta, not as a blocker for the one-behavior cohort.

## 8. Plan loading and execution findings

- Verified fact: Plan loading after send is by user singleton, not by behavior. `_ensure_run_for_event()` calls `_get_or_create_plan(user_id)` and snapshots that plan's active actions into the run (`backend/app/db/flare_plan_repository.py:1633-1669`).
- Verified fact: The created run stores `source_plan_id`, but the run does not store `behavior_pattern_id` or any behavior-specific plan linkage (`db/migrations/20260708073000_flare_plan_v0_persistence.sql:75-88`; `backend/app/db/flare_plan_repository.py:280-307,1650-1658`).
- Verified fact: A flare event may have at most one run due to `idx_flare_plan_runs_one_per_event` (`db/migrations/20260708073000_flare_plan_v0_persistence.sql:233-234`).
- Verified fact: The tests assert that a configured plan creates exactly one offered run with snapshotted active actions in order (`backend/tests/test_flare_plan_run_v0.py:17-39`).
- Verified fact: The frontend Configure experience is a single Flare Plan card and a single modal, not a behavior-scoped plan editor (`frontend/src/screens/CustomizeScreen.tsx:53-60,164-211`; `frontend/src/screens/__tests__/flare_plan_configure.test.tsx:331-723`).
- Inference: If a future user had multiple behavior patterns today, the runtime would still offer exactly one user-level plan, so there is no safe current way to keep behavior A and behavior B plans independent inside one account.
- Inference: If the cohort is constrained to one primary behavior per tester, the user-level singleton plan is still semantically coherent for that tester's chosen use case.

## 9. Historical integrity and versioning findings

- Verified fact: `flare_events` preserve behavior meaning through `behavior_pattern_id`, `behavior_label_snapshot`, and optional `behavior_description_snapshot` (`db/migrations/20260627_230500_flare_v0_persistence.sql:49-57`; `frontend/src/services/flareEventRepository.ts:151-165`).
- Verified fact: `behavior_pattern_id` and `anchor_note_id` use `on delete set null`, so history is not deleted when source setup rows are removed (`db/migrations/20260627_230500_flare_v0_persistence.sql:49-55`).
- Verified fact: Plan history is stronger than live configuration history: `flare_plan_runs` preserve `source_plan_id`, and `flare_plan_run_actions` preserve title, description, position, outcome, and optional `source_action_id` snapshots (`db/migrations/20260708073000_flare_plan_v0_persistence.sql:75-118`; `backend/tests/test_flare_plan_run_v0.py:243-268`).
- Verified fact: The run tests prove later plan edits do not rewrite the event-time action snapshot (`backend/tests/test_flare_plan_run_v0.py:243-268`).
- Verified fact: There is no plan version table and no behavior-to-plan join on the flare event itself.
- Verified fact: Anchor-note history is weaker. The event stores `anchor_note_id` and `anchor_note_version`, but the anchor-note save path updates the same row and increments `version` in the client (`frontend/src/services/anchorNoteRepository.ts:48-65,107-113`).
- Inference: Flare can later prove which plan steps the user actually saw and followed for a flare event, but it cannot reconstruct prior anchor-note text from persisted data alone after later note edits.
- Inference: For this audit's main question, the lack of historical anchor-note text is a real provenance limitation, but it does not contaminate plan-run attribution the way a missing plan snapshot would.
- Verified fact: Reflection persistence is also split across two client-coordinated writes: insert reflection, then update flare-event status (`frontend/src/state/FlareEventContext.tsx:500-570`; `docs/20_architecture/flare_signed_in_persistence_ownership_audit_2026-07.md`).
- Inference: Reflection/status split is a separate integrity risk, but it is not a foundational blocker to the one-primary-behavior cohort decision.

## 10. API and frontend singleton assumptions

- Verified fact: `GET /api/flare-plan` and the related action routes all operate on a single implicit active plan for the authenticated user (`backend/app/api/flare_plan_api.py:89-96,150-214`; `frontend/src/services/flarePlanApi.ts:285-416`).
- Verified fact: The frontend plan context has no behavior parameter anywhere in its load or mutation APIs (`frontend/src/state/FlarePlanContext.tsx:103-136,317-353,430-641`).
- Verified fact: The behavior-pattern repository loads one active row ordered by `updated_at desc limit 1` and saves with `is_primary: true` (`frontend/src/services/behaviorPatternRepository.ts:52-66,91-111`).
- Verified fact: The flare-event creation flow reads exactly one `behaviorPatternRecord?.id` and one `behaviorPattern?.behaviorName` (`frontend/src/screens/FlareScreen.tsx:282-289`).
- Verified fact: History views one behavior snapshot per flare event and has no plan-to-behavior disambiguation layer (`frontend/src/screens/HistoryScreen.tsx:31-43,173-205`).
- Inference: Current UI and API assumptions are consistent with a single current behavior configuration and a single current plan configuration, even though the base `behavior_patterns` table itself does not force that singleton.

## 11. Anonymous/authenticated lifecycle findings

- Verified fact: The response-experience contract explicitly supports signed-out recovery with a built-in default plan and without requiring authentication for support itself (`docs/00_product/contracts/flare_response_experience_v0_contract.md`).
- Verified fact: The frontend plan context swaps to `createBuiltInDefaultPlan()` whenever the user is not in an authenticated editable state (`frontend/src/state/FlarePlanContext.tsx:228,317-353`).
- Verified fact: The signed-in flare path goes through backend event creation plus trace, while the signed-out path creates a local-only fallback event in client state (`frontend/src/screens/FlareScreen.tsx:280-355`; `frontend/src/services/sendFlareWithTrace.ts:50-92`).
- Verified fact: The current persisted setup ownership remains account-scoped and user-owned through authenticated Supabase rows and backend-authenticated APIs (`db/migrations/20260627_230500_flare_v0_persistence.sql:149-341`; `db/migrations/20260708073000_flare_plan_v0_persistence.sql:470-813`).
- Verified fact: The auth context supports sign-in and sign-out but does not implement a cross-account merge or anonymous-to-authenticated migration path for plan or behavior data (`frontend/src/state/FlareAuthContext.tsx:141-214`).
- Inference: There is no current evidence that signing in would merge multiple anonymous behavior-specific configurations into one account, because the signed-out path is intentionally local and fallback-only.
- Inference: The absence of cross-account merge logic reduces accidental contamination risk for this cohort, but it also means signed-out preparatory data is not part of the authenticated multi-behavior question.

## 12. Private-test data-safety assessment

- Verified fact: One tester can configure one current behavior and one current plan without schema conflict.
- Verified fact: Each real flare event records its own behavior snapshot and its own snapshotted run actions, so later edits to the current behavior row or current plan do not erase which plan steps were actually offered and completed for that flare event (`db/migrations/20260627_230500_flare_v0_persistence.sql:49-67`; `db/migrations/20260708073000_flare_plan_v0_persistence.sql:91-118`; `backend/tests/test_flare_plan_run_v0.py:243-268`).
- Verified fact: External support delivery is keyed to the generic flare event and does not require or expose a behavior selection (`frontend/src/screens/FlareScreen.tsx:324-343`; `db/migrations/20260705220110_external_support_channel_v0.sql:83-118`).
- Inference: The first cohort's data remains semantically correct if each tester keeps one stable primary behavior because the singleton plan can be interpreted as that tester's plan for that one chosen situation.
- Inference: The first cohort's data becomes semantically mixed if a tester repurposes the same account for a materially different primary behavior during the cohort, because the current active plan is user-level rather than behavior-level.
- Recommendation: Test operations should treat a request like "I also wanted a separate plan for another behavior" as product feedback and as a cohort-boundary event, not as an in-test reconfiguration to be mixed into the same interpretation set.
- Recommendation: The first test can validly evaluate functional reliability, delivery clarity, plan usefulness, and plan helpfulness for one defined behavior or situation per tester. It cannot validate multi-behavior selection, behavior-specific plan routing, or support-only flare initiation.

## 13. Pre-test recommendation

- Recommendation: Proceed with the first limited private test under this explicit rule: **one tester, one primary behavior or situation, one active personalized plan for the duration of the cohort unless the operator intentionally resets or reclassifies that tester's participation.**
- Recommendation: Add one operator feedback question for every tester: **"Were there other behaviors or situations where you wanted a different Flare Plan than the one Flare currently lets you keep?"**
- Recommendation: Interpret any mid-cohort attempt to reconfigure the same account for another distinct behavior as evidence of deferred multi-behavior demand, not as ordinary same-model use.
- Recommendation: No pre-test schema or runtime correction is required solely to avoid unsafe or misleading data collection for the constrained cohort.

## 14. Deferred multi-behavior requirements

- Recommendation: Add an explicit behavior-to-plan ownership boundary so each `behavior_pattern` can own its own active plan or plan family.
- Recommendation: Allow flare creation without requiring a non-empty behavior label, so a generic flare can exist before classification and can remain `support only` when needed.
- Recommendation: Decide whether flare events should store `behavior_pattern_id`, `plan_id`, and a distinct event-time `plan_version` or immutable plan snapshot reference.
- Recommendation: Decide whether behavior selection happens at flare creation, after support delivery, or at plan-launch time, and make the API shape explicit.
- Recommendation: Rework Configure UX from one singleton plan editor to either behavior-scoped plan editing or an explicit "primary plan" model with deliberate constraints.
- Recommendation: Strengthen anchor-note provenance if historical exact-note reconstruction matters for future support or audits.

## 15. Risks, unresolved questions, and follow-up work

- Risk: A tester who changes the account's primary behavior mid-cohort will still have historically meaningful flare events and run snapshots, but the user-level current plan will no longer represent one stable behavior configuration.
- Risk: The current `support-only` or unclassified-flare product direction is not yet implemented because `behavior_label_snapshot` is required on event creation (`backend/app/services/flare_plan_service.py:175-185`).
- Risk: Anchor-note history is version-number-only, not text-snapshot-complete (`frontend/src/services/anchorNoteRepository.ts:48-65,107-113`).
- Risk: Reflection persistence still uses two client-coordinated writes and can split status from reflection content (`frontend/src/state/FlareEventContext.tsx:500-570`).
- Unresolved question: The repository evidence is strong, but this run did not query a local database instance to prove the live local schema exactly matches the latest migrations. The architecture conclusion here relies on migrations, code, tests, and the `2026-07-18` schema snapshot.
- Recommendation: Follow-up work items should be split into:
  - one small product/architecture contract slice for multi-behavior plan ownership
  - one backend/data-model slice for behavior-optional flare creation
  - one later provenance slice if exact anchor-note history becomes required

## 16. Evidence matrix

| Capability | Current support status | Supporting evidence | Risk if deferred | Required timing |
| --- | --- | --- | --- | --- |
| One tester can keep one primary behavior configuration | Verified fact: Supported, with UI singleton behavior loading | `db/migrations/20260627_230500_flare_v0_persistence.sql:1-18,101-103`; `frontend/src/services/behaviorPatternRepository.ts:52-66,91-111`; `frontend/src/state/BehaviorPatternContext.tsx:127-176` | Inference: Low if testers stay within one primary behavior | Recommendation: Before first test |
| One tester can keep multiple independent behavior-specific plans | Verified fact: Not supported | `db/migrations/20260708073000_flare_plan_v0_persistence.sql:200-202`; `backend/app/db/flare_plan_repository.py:1227-1268`; `frontend/src/state/FlarePlanContext.tsx:228-353` | Inference: High for multi-behavior use, low for one-behavior cohort | Recommendation: Before broader beta |
| A flare can exist without `behavior_pattern_id` | Verified fact: Partially supported | `db/migrations/20260627_230500_flare_v0_persistence.sql:49-57`; `backend/app/api/flare_plan_api.py:103-108` | Inference: Low for one-behavior cohort | Recommendation: Later |
| A flare can exist without any behavior classification at all | Verified fact: Not supported because non-empty behavior label is required | `db/migrations/20260627_230500_flare_v0_persistence.sql:52,61`; `backend/app/services/flare_plan_service.py:175-185` | Inference: Medium because it blocks the long-term `support only` path | Recommendation: Before broader beta |
| External support delivery stays generic and does not expose behavior selection | Verified fact: Supported | `frontend/src/screens/FlareScreen.tsx:324-343`; `db/migrations/20260705220110_external_support_channel_v0.sql:83-118` | Inference: Low | Recommendation: Before first test |
| A behavior-specific plan can be snapshotted for history | Verified fact: Supported only for the one user-level active plan | `backend/app/db/flare_plan_repository.py:1633-1669`; `backend/tests/test_flare_plan_run_v0.py:17-39,243-268` | Inference: Medium if interpreted as behavior-specific without the one-behavior constraint | Recommendation: Before first test with explicit test constraint |
| Two behaviors can keep distinct plans without overwriting or ambiguous loading | Verified fact: Not supported | `backend/app/db/flare_plan_repository.py:1227-1268,1633-1669`; `frontend/src/screens/CustomizeScreen.tsx:164-211` | Inference: High for multi-behavior product direction | Recommendation: Before broader beta |
| Historical records preserve the plan actually followed | Verified fact: Supported | `db/migrations/20260708073000_flare_plan_v0_persistence.sql:75-118`; `backend/tests/test_flare_plan_run_v0.py:243-268` | Inference: Low | Recommendation: Before first test |
| Historical records preserve the exact anchor note text shown | Verified fact: Not fully supported | `frontend/src/services/anchorNoteRepository.ts:48-65,107-113`; `db/migrations/20260627_230500_flare_v0_persistence.sql:54-65` | Inference: Medium provenance gap, but not the main blocker for this cohort decision | Recommendation: Later |
| Configure and response UI naturally support one configured behavior auto-launching one plan | Verified fact: Supported | `frontend/src/screens/CustomizeScreen.tsx:53-60,164-211`; `frontend/src/screens/FlareScreen.tsx:280-355`; `frontend/src/screens/__tests__/flare_plan_configure.test.tsx:331-723` | Inference: Low | Recommendation: Before first test |
