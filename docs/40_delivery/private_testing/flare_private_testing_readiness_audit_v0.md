# Flare Private Testing Readiness Audit V0

## Status

- Audit date: 2026-07-14
- Repository revision inspected: `build/admin-config/testing-audit` at `c02c0f325421d49ddbcab243057f9e89bef3c220`
- Governing contract: `docs/00_product/contracts/flare_private_testing_v0_contract.md`
- Overall readiness rating: `Not Ready`

## Executive Summary

Flare is materially closer to a first private cohort than the older V0 docs suggest. The current repository contains a signed-out Welcome path, Supabase-backed authentication, durable behavior-pattern and anchor-note persistence, Flare Plan persistence and run-state APIs, account-owned history, and a backend-mediated GroupMe support-channel flow with ownership-aware storage and safe public API shapes. Evidence appears in `frontend/src/screens/WelcomeGateScreen.tsx`, `frontend/src/components/AuthStatusCard.tsx`, `frontend/src/screens/FlareScreen.tsx`, `frontend/src/components/SupportChannelSetupModal.tsx`, `backend/app/api/support_channels_api.py`, `backend/app/http/app.py`, and the related backend/frontend test suites.

The first invited tester should not be invited today. The largest gaps are not the core app loop, but the private-testing readiness layer required by the contract: there is no assembled tester-facing onboarding package, no dedicated tester-facing privacy/emergency/support materials, no private-test roster/checklist/pause-rollback-resume package, and no current live-environment evidence proving the exact deployed build can complete the contract-critical auth and GroupMe flows. The repo contains useful release and deployment docs in `docs/40_delivery/`, but not the private-testing artifacts the contract requires.

Minimum work before launch is therefore bounded but real:

1. Create the tester-facing onboarding and support documentation set.
2. Create the operator-facing first-cohort operational package.
3. Run and record live private-environment validation for auth, GroupMe, failure behavior, and rollback readiness.
4. Resolve scope contradictions where older authoritative docs still describe Telegram or support-channel work as future-only.

## Audit Method

### Documents reviewed

- Product direction and scope:
  - `docs/00_product/flare_vision_direction.md`
  - `docs/00_product/flare_mvp_scope.md`
- Governing contracts:
  - `docs/00_product/contracts/flare_private_testing_v0_contract.md`
  - `docs/00_product/contracts/flare_plan_v0_contract.md`
  - `docs/00_product/contracts/flare_response_experience_v0_contract.md`
  - `docs/00_product/contracts/flare_external_support_channel_v0.md`
- Design and architecture:
  - `docs/10_design/flare_v0_app_structure_navigation.md`
  - `docs/20_architecture/flare_v0_data_persistence_contract.md`
- Delivery and release documentation:
  - `docs/40_delivery/flare_prelaunch_readiness.md`
  - `docs/40_delivery/flare_v0_production_deployment_checklist.md`
  - `docs/40_delivery/flare_v0_launch_gate_status.md`
  - `docs/40_delivery/flare_v0_known_limitations.md`
  - `docs/40_delivery/flare_v0_deploy_checkpoint.md`
  - `docs/40_delivery/flare_external_support_channel_tailscale_validation.md`

### Application areas inspected

- Frontend signed-out and signed-in experience:
  - `frontend/src/screens/WelcomeGateScreen.tsx`
  - `frontend/src/components/WelcomeContent.tsx`
  - `frontend/src/components/AuthStatusCard.tsx`
  - `frontend/src/screens/FlareScreen.tsx`
  - `frontend/src/screens/CustomizeScreen.tsx`
  - `frontend/src/screens/HistoryScreen.tsx`
  - `frontend/src/components/FlareResponse.tsx`
  - `frontend/src/components/SupportChannelSetupModal.tsx`
  - `frontend/src/content/flareContent.json`
- Frontend service and auth boundaries:
  - `frontend/src/services/flareSupabaseAuth.ts`
  - `frontend/src/services/supportChannelApi.ts`
- Backend support-channel runtime:
  - `backend/app/http/app.py`
  - `backend/app/api/support_channels_api.py`
  - `backend/app/services/support_channel_management.py`
  - `backend/app/services/support_channel_sender.py`
  - `backend/app/db/support_channel_repository.py`
- Persistence and access-control artifacts:
  - `db/migrations/20260627_230500_flare_v0_persistence.sql`
  - `db/migrations/20260705220110_external_support_channel_v0.sql`
  - `db/migrations/20260706112500_support_channel_provider_configs.sql`
  - `db/migrations/20260708073000_flare_plan_v0_persistence.sql`

### Tests inspected or run

- Inspected:
  - `frontend/src/screens/__tests__/welcome_gate.test.tsx`
  - `frontend/src/screens/__tests__/app_shell.test.tsx`
  - `frontend/src/components/__tests__/FlareResponse.test.tsx`
  - `frontend/src/components/__tests__/AuthStatusCard.test.tsx`
  - `frontend/src/services/__tests__/supportChannelApi.test.ts`
  - `frontend/src/services/__tests__/flareSupabaseAuth.test.ts`
  - `backend/tests/test_support_channels_api.py`
  - `backend/tests/test_support_channel_http_app.py`
  - `backend/tests/test_support_channel_sender.py`
  - `backend/tests/test_flare_plan_run_v0.py`
- Run during this audit:
  - `python -m pytest backend/tests/test_support_channels_api.py backend/tests/test_support_channel_http_app.py`
  - `npm test -- --runInBand frontend/src/screens/__tests__/welcome_gate.test.tsx frontend/src/screens/__tests__/app_shell.test.tsx frontend/src/components/__tests__/FlareResponse.test.tsx frontend/src/components/__tests__/AuthStatusCard.test.tsx frontend/src/services/__tests__/supportChannelApi.test.ts frontend/src/services/__tests__/flareSupabaseAuth.test.ts`

### What was not live-validated

- The currently deployed web build at `https://lksmoker.github.io/flare/`
- Supabase production auth email delivery and redirect behavior
- GroupMe OAuth callback against the currently approved private-test environment
- GroupMe test-send and real-send behavior against a current approved tester group
- Intentional delivery failure against the live provider path
- Account access revocation against live tester accounts
- Rollback or provider-disable action against a live deployment

### Repository evidence versus runtime evidence

This audit treats repository evidence as proof only of implemented code paths, documented expectations, migrations, and test coverage. It does not treat historical delivery notes or past task summaries as proof that the currently approved private-test deployment still behaves the same way. Any conclusion about the actual first cohort environment is marked as requiring live validation unless this run directly exercised it.

## Existing Strengths

- Signed-out orientation exists and is intentionally useful without implying persistence. `frontend/src/screens/WelcomeGateScreen.tsx`, `frontend/src/components/WelcomeContent.tsx`, and `frontend/src/screens/__tests__/welcome_gate.test.tsx` show a first-use Welcome path, a signed-out sign-in handoff, and local completion handling.
- Signed-in auth flows are implemented with Supabase email/password and magic-link support. `frontend/src/components/AuthStatusCard.tsx`, `frontend/src/services/flareSupabaseAuth.ts`, `frontend/src/services/__tests__/flareSupabaseAuth.test.ts`, and `docs/40_delivery/flare_v0_production_deployment_checklist.md` show the intended auth boundary.
- Signed-out fallback remains usable instead of hard-blocking Flare. `docs/00_product/contracts/flare_response_experience_v0_contract.md` requires this, and `frontend/src/screens/FlareScreen.tsx` plus `frontend/src/screens/__tests__/app_shell.test.tsx` show local fallback flare creation and the built-in default plan path.
- Flare Plan configuration and one-step-at-a-time run behavior are implemented and tested. Evidence appears in `docs/00_product/contracts/flare_plan_v0_contract.md`, `frontend/src/components/FlareResponse.tsx`, `frontend/src/state/builtInDefaultFlarePlan.ts`, `backend/tests/test_flare_plan_run_v0.py`, and `db/migrations/20260708073000_flare_plan_v0_persistence.sql`.
- GroupMe support-channel flow is present in both frontend and backend. `frontend/src/components/SupportChannelSetupModal.tsx`, `frontend/src/services/supportChannelApi.ts`, `backend/app/http/app.py`, `backend/app/api/support_channels_api.py`, and `backend/tests/test_support_channels_api.py` cover connect, destination selection, save, test send, disable, reconnect, and real-send API behavior.
- The backend API shape is intentionally safe about provider secrets. `backend/tests/test_support_channels_api.py` explicitly asserts that response bodies do not leak `provider_config_ref`, access tokens, or bot identifiers.
- Ownership and access control are stronger than many early private-test repos. `db/migrations/20260627_230500_flare_v0_persistence.sql`, `db/migrations/20260705220110_external_support_channel_v0.sql`, and `db/migrations/20260706112500_support_channel_provider_configs.sql` define RLS and grants, while repository code scopes reads/writes by `user_id`.
- Delivery-state honesty is designed into the response flow. `frontend/src/screens/FlareScreen.tsx` distinguishes local flare creation from external support delivery, and `frontend/src/components/FlareResponse.tsx` plus `frontend/src/components/__tests__/FlareResponse.test.tsx` preserve recovery content when external delivery fails.
- Deployment and release-hardening documentation already exists. `docs/40_delivery/flare_v0_production_deployment_checklist.md`, `docs/40_delivery/flare_v0_launch_gate_status.md`, and `docs/40_delivery/flare_v0_deploy_checkpoint.md` give a useful base for the operator side of private testing.

## Readiness Matrix

| Contract area | Current state | Evidence | Classification | Severity | Required action |
| --- | --- | --- | --- | --- | --- |
| Supported private-test scope | Core auth, setup, local flare, plan, history, and GroupMe paths exist in repo; scope docs still conflict in places | `frontend/src/screens/FlareScreen.tsx`; `frontend/src/components/SupportChannelSetupModal.tsx`; `docs/10_design/flare_v0_app_structure_navigation.md`; `docs/40_delivery/flare_v0_known_limitations.md` | product | high | Align scope docs and freeze the exact first-cohort scope |
| Explicit non-goals and expectation management | Strong contract language exists; tester-facing package does not | `docs/00_product/contracts/flare_private_testing_v0_contract.md`; `frontend/src/content/flareContent.json` | documentation | blocker | Create tester-facing onboarding and limitations package |
| Tester eligibility and exclusions | Defined in contract only; no cohort procedure or operator checklist found | `docs/00_product/contracts/flare_private_testing_v0_contract.md` | operations | high | Create invite/approval procedure and tester roster fields |
| Tester onboarding and access instructions | Missing as a dedicated deliverable | no tester guide under `docs/40_delivery/private_testing/`; generic deployment docs only in `docs/40_delivery/` | documentation | blocker | Create invitation, onboarding, access, and first-session docs |
| Signed-out capabilities | Implemented and tested | `frontend/src/components/WelcomeContent.tsx`; `frontend/src/screens/FlareScreen.tsx`; `frontend/src/screens/__tests__/welcome_gate.test.tsx`; `frontend/src/screens/__tests__/app_shell.test.tsx` | not_a_gap | low | Live-validate on approved deployment |
| Signed-in capabilities | Implemented in repo; live environment still unproven | `frontend/src/components/AuthStatusCard.tsx`; `frontend/src/services/flareSupabaseAuth.ts`; `docs/40_delivery/flare_v0_production_deployment_checklist.md` | testing_or_validation | high | Run and record live auth/session validation |
| Flare Plan setup and response behavior | Implemented and well tested | `frontend/src/components/FlareResponse.tsx`; `backend/tests/test_flare_plan_run_v0.py`; `db/migrations/20260708073000_flare_plan_v0_persistence.sql` | not_a_gap | low | Live-validate empty-plan, begin, skip, end-early, resume |
| GroupMe setup, test sends, real sends, and failure behavior | Repo implementation exists; current approved environment evidence is incomplete | `frontend/src/components/SupportChannelSetupModal.tsx`; `backend/app/api/support_channels_api.py`; `backend/tests/test_support_channels_api.py`; `docs/40_delivery/flare_external_support_channel_tailscale_validation.md` | testing_or_validation | blocker | Run and record live GroupMe validation, including failure path |
| Privacy summary and data minimization | Partial in-app safety copy exists; tester-facing privacy summary does not | `frontend/src/content/flareContent.json`; `docs/20_architecture/flare_v0_data_persistence_contract.md` | documentation | blocker | Create tester-facing privacy summary and minimization guidance |
| Account ownership and tester isolation | Strong repo evidence; still needs live confirmation after migrations | `db/migrations/20260627_230500_flare_v0_persistence.sql`; `db/migrations/20260705220110_external_support_channel_v0.sql`; `backend/app/db/support_channel_repository.py` | testing_or_validation | medium | Run focused owner-isolation checks against target environment |
| Support and defect-reporting expectations | No authoritative private-test support channel or instructions found | `docs/00_product/contracts/flare_private_testing_v0_contract.md`; no private-test support doc in `docs/40_delivery/` | operations | high | Declare support channel, response expectations, and defect-report format |
| Known limitations | Generic V0 limitations exist; they are not private-test synchronized and still mention Telegram | `docs/40_delivery/flare_v0_known_limitations.md` | documentation | high | Replace or supersede with private-test-specific limitations |
| Emergency-service boundary | Partial safety copy exists, but the required tester-facing boundary is not yet packaged or clearly later-accessible | `frontend/src/content/flareContent.json`; `frontend/src/components/AuthStatusCard.tsx`; `frontend/src/components/WelcomeContent.tsx` | copy_or_ux | blocker | Add exact private-test emergency boundary to onboarding and About/support surfaces |
| Private-cohort entry criteria | Not yet assembled into a checklist or decision artifact | `docs/00_product/contracts/flare_private_testing_v0_contract.md`; `docs/40_delivery/flare_v0_launch_gate_status.md` | operations | high | Create first-cohort entry checklist and go/no-go template |
| Deployment and operational readiness | Good generic deployment docs exist; private-test smoke record is missing for current build | `docs/40_delivery/flare_v0_production_deployment_checklist.md`; `docs/40_delivery/flare_v0_deploy_checkpoint.md` | testing_or_validation | high | Run private-test environment smoke and capture build-specific evidence |
| Pause and rollback readiness | Concepts exist in contract/generic docs; no first-cohort procedure found | `docs/00_product/contracts/flare_private_testing_v0_contract.md`; `docs/40_delivery/flare_prelaunch_readiness.md` | operations | blocker | Create pause/rollback/resume playbook with access-disable steps |
| Criteria for expanding beyond the first private cohort | Defined in contract but not operationalized yet | `docs/00_product/contracts/flare_private_testing_v0_contract.md` | documentation | medium | Add explicit expansion decision checklist after first cohort |

## Blocking Gaps

### 1. Missing tester-facing onboarding package

- Contract requirement: The contract requires a concise onboarding package including access instructions, signed-out/signed-in behavior, plan setup, optional GroupMe setup, privacy summary, emergency boundary, known limitations, support path, failed-flare reporting, and exit/deletion instructions.
- Current behavior or missing evidence: The repo contains Welcome copy and generic deployment docs, but no tester-facing onboarding guide, invitation template, or first-session walkthrough under `docs/40_delivery/private_testing/`.
- Repository evidence:
  - Required by `docs/00_product/contracts/flare_private_testing_v0_contract.md` under `Onboarding Contract`, `Required Onboarding Sequence`, and `Acceptance Criteria`
  - About/Welcome copy in `frontend/src/components/WelcomeContent.tsx`
  - No private-testing onboarding doc exists in `docs/40_delivery/private_testing/`
- Risk to a private tester: The first tester would need ad hoc operator explanation, increasing misunderstanding about auth, persistence, GroupMe test sends, and emergency limitations.
- Required resolution: Create the tester invitation, onboarding guide, first-session walkthrough, privacy summary, emergency boundary, support instructions, and exit/removal instructions as a coherent package.
- Likely implementation surface:
  - `docs/40_delivery/private_testing/`
  - Possibly minor About/support-surface copy adjustments in `frontend/src/content/flareContent.json`
- Suggested validation:
  - Operator dry-run against one mock tester
  - Verify every required onboarding item maps to a concrete doc section
  - Confirm URLs and sign-in flows match the approved environment
- Standalone Codex work item: yes

### 2. Missing private-test operations package for entry, pause, rollback, resume, and rostering

- Contract requirement: The contract requires a first-cohort entry checklist, a launch roster and onboarding status mechanism, a pause/rollback/resume checklist, an active tester support channel, and a known process to remove tester access and handle tester data requests.
- Current behavior or missing evidence: Deployment and launch-gate docs exist, but there is no private-test-specific roster template, cohort checklist, pause/rollback/runbook, or access-removal procedure in the authoritative docs.
- Repository evidence:
  - Required by `docs/00_product/contracts/flare_private_testing_v0_contract.md` under `Entry Criteria for the First Cohort`, `Pause Criteria`, `Rollback Criteria and Actions`, `Resume Criteria`, and `Acceptance Criteria`
  - Generic readiness concepts in `docs/40_delivery/flare_prelaunch_readiness.md`
  - No dedicated private-testing operational docs exist under `docs/40_delivery/private_testing/`
- Risk to a private tester: If a privacy, auth, or misdelivery issue appears, the operator has no checked-in contract-aligned playbook for disabling access, pausing onboarding, communicating status, or proving the decision path.
- Required resolution: Create operator-facing private-test docs covering rostering, cohort entry, pause criteria execution, rollback choices, resume checks, and manual access-revocation/data-request handling.
- Likely implementation surface:
  - `docs/40_delivery/private_testing/`
  - Possibly admin/ops follow-up docs in `docs/40_delivery/`
- Suggested validation:
  - Tabletop run-through of a pause scenario
  - Confirm each contract-required operator action has an owner and a concrete step
- Standalone Codex work item: yes

### 3. Current private-test environment is not live-validated for the contract-critical auth and GroupMe flows

- Contract requirement: Before the first cohort begins, the approved environment must prove sign-in, local flare creation, plan offer/use, GroupMe connection, test send, real send, reconnect/disable behavior, visible failure handling, and smoke-test success against the actual environment.
- Current behavior or missing evidence: Repo code and unit tests are strong, and `docs/40_delivery/flare_v0_deploy_checkpoint.md` claims a production deployment, but this audit did not verify the current live build or the current live GroupMe path. The repo also does not include an up-to-date smoke record for the exact private-test build and environment.
- Repository evidence:
  - Required by `docs/00_product/contracts/flare_private_testing_v0_contract.md` under `Entry Criteria for the First Cohort`
  - Live-validation guidance in `docs/40_delivery/flare_external_support_channel_tailscale_validation.md`
  - Production operator checks in `docs/40_delivery/flare_v0_production_deployment_checklist.md`
- Risk to a private tester: The first tester could hit an auth redirect failure, expired callback flow, wrong destination selection issue, or delivery/failure mismatch not visible in unit tests.
- Required resolution: Run and record a build-specific smoke test against the approved private-test environment, including the failure path and reconnect/disable behavior.
- Likely implementation surface:
  - `docs/40_delivery/private_testing/`
  - Live environment and operator credentials, not repo code first
- Suggested validation:
  - Full smoke list in the `Required Live Validation` section below
  - Capture screenshots, timestamps, and backend/DB evidence for each step
- Standalone Codex work item: yes

### 4. Emergency boundary is not yet delivered in the contract-required tester-facing form

- Contract requirement: The application and tester-facing onboarding must communicate, in plain language, that Flare is not an emergency service and that users must contact local emergency services or another appropriate source of immediate help directly.
- Current behavior or missing evidence: The repo contains several safety statements, but they are fragmented. The Welcome/About copy does not include the contract’s private-test emergency boundary, and no dedicated tester-facing emergency summary exists.
- Repository evidence:
  - Partial safety copy in `frontend/src/content/flareContent.json`
  - Signed-in auth detail copy in `frontend/src/components/AuthStatusCard.tsx`
  - Welcome/About surface in `frontend/src/components/WelcomeContent.tsx`
  - Contract requirement in `docs/00_product/contracts/flare_private_testing_v0_contract.md` under `Emergency Boundary`
- Risk to a private tester: A tester could understand Flare as supportive but still miss the stronger private-test boundary around urgent danger, lack of monitoring, and lack of guaranteed delivery/response.
- Required resolution: Add the exact emergency boundary to the onboarding package and make it clearly reachable later from a stable informational surface.
- Likely implementation surface:
  - `docs/40_delivery/private_testing/`
  - Possibly `frontend/src/content/flareContent.json` and related About/support components
- Suggested validation:
  - Copy review against the contract text
  - Confirm visibility during onboarding and later retrieval from the app
- Standalone Codex work item: yes

## High-Priority Gaps

### 1. Scope contradiction between older authoritative docs and current implementation

- Contract requirement: Supported scope and known limitations must be honest and synchronized.
- Current behavior or missing evidence: `docs/10_design/flare_v0_app_structure_navigation.md` still says Telegram Support is future-scoped and not active V0 behavior, and `docs/40_delivery/flare_v0_known_limitations.md` still says Telegram is visible as future direction only. Current implementation and newer contracts use GroupMe as the actual support-channel feature.
- Repository evidence:
  - `docs/10_design/flare_v0_app_structure_navigation.md`
  - `docs/40_delivery/flare_v0_known_limitations.md`
  - `docs/00_product/contracts/flare_external_support_channel_v0.md`
  - `frontend/src/components/SupportChannelSetupModal.tsx`
- Risk to a private tester: Operator and tester instructions can diverge, especially around whether support-group setup should appear at all.
- Required resolution: Align the authoritative docs around current GroupMe-backed private-test scope and preserve Telegram as later or removed scope.
- Likely implementation surface: `docs/10_design/`, `docs/40_delivery/`, possibly app copy
- Suggested validation: Doc diff review against implemented UI and route set
- Standalone Codex work item: yes

### 2. No authoritative tester support/defect-reporting channel is defined

- Contract requirement: Testers must receive one authoritative support channel and defect-report expectations.
- Current behavior or missing evidence: Generic prelaunch docs mention a possible support email, but no private-testing support channel or response expectation is committed as the current authority.
- Repository evidence:
  - `docs/40_delivery/flare_prelaunch_readiness.md`
  - `docs/00_product/contracts/flare_private_testing_v0_contract.md`
- Risk to a private tester: Access failures, duplicate sends, or privacy concerns have no unambiguous reporting path.
- Required resolution: Choose and document the support channel, expected response posture, and minimum bug-report template.
- Likely implementation surface: `docs/40_delivery/private_testing/`
- Suggested validation: Operator dry-run with a sample report
- Standalone Codex work item: yes

### 3. No documented tester eligibility/exclusion workflow

- Contract requirement: The first cohort must apply age, dependency-risk, support-path, and consent-based exclusions.
- Current behavior or missing evidence: Eligibility is described only in the contract; no operator checklist or tester acknowledgment artifact is present.
- Repository evidence:
  - `docs/00_product/contracts/flare_private_testing_v0_contract.md`
- Risk to a private tester: Someone unsuitable for this private test could be admitted based on informal judgment alone.
- Required resolution: Add an operator checklist and tester acknowledgment step.
- Likely implementation surface: `docs/40_delivery/private_testing/`
- Suggested validation: Review the checklist against every contract eligibility and exclusion rule
- Standalone Codex work item: yes

### 4. Current build identifier is not clearly surfaced for tester/operator coordination

- Contract requirement: Each private-test build should have a human-readable build or release identifier available to the tester or support operator.
- Current behavior or missing evidence: The repo contains branch/commit and deployment notes, but there is no clearly designated tester-facing build identifier in the app or onboarding package.
- Repository evidence:
  - `docs/00_product/contracts/flare_private_testing_v0_contract.md`
  - `docs/40_delivery/flare_v0_deploy_checkpoint.md`
- Risk to a private tester: Support and bug triage become ambiguous when behavior changes between builds.
- Required resolution: Define a private-test build identifier and place it in onboarding/support materials, and optionally surface it in-app.
- Likely implementation surface: docs first; possibly frontend informational surface
- Suggested validation: Confirm bug reports can reference the build identifier unambiguously
- Standalone Codex work item: yes

### 5. Live wrong-destination and duplicate-send safeguards are not yet evidenced in the approved environment

- Contract requirement: Wrong-recipient and uncontrolled duplicate-send risks must be bounded before launch.
- Current behavior or missing evidence: Static repo inspection shows one configured channel per user and separate test vs real sends, but this audit found no current live smoke evidence for wrong-destination avoidance or safe retry behavior.
- Repository evidence:
  - Unique enabled-channel constraint in `db/migrations/20260705220110_external_support_channel_v0.sql`
  - Sender logic in `backend/app/services/support_channel_sender.py`
  - UI flow in `frontend/src/components/SupportChannelSetupModal.tsx`
- Risk to a private tester: A tester may trust the saved destination without current live evidence that the flow is still safe after deployment changes.
- Required resolution: Include wrong-destination and duplicate-send checks in live validation before inviting tester one.
- Likely implementation surface: live validation and smoke docs
- Suggested validation: save a known test group, send test, retry failure and success paths, inspect attempts
- Standalone Codex work item: yes

### 6. Access-revocation and tester data-request handling are not documented

- Contract requirement: A known process must exist for removing tester access and addressing tester data requests, even if manual.
- Current behavior or missing evidence: V0 deletion/export is explicitly deferred, but no manual private-test procedure is documented.
- Repository evidence:
  - `docs/40_delivery/flare_v0_known_limitations.md`
  - `docs/00_product/contracts/flare_private_testing_v0_contract.md`
- Risk to a private tester: A tester cannot be given clear exit expectations, and the operator lacks a bounded response to “remove me from the test.”
- Required resolution: Document the manual operator process and the tester-facing expectation language.
- Likely implementation surface: `docs/40_delivery/private_testing/`
- Suggested validation: Tabletop run-through for one test account
- Standalone Codex work item: yes

## Medium- and Low-Priority Gaps

- Medium: The app’s later-access informational surface is the repurposed Welcome content in `frontend/src/screens/CustomizeScreen.tsx`, which currently explains what Flare is for but does not centrally expose privacy, emergency, support, or limitations links. Classification: `copy_or_ux`, Severity: `medium`.
- Medium: `docs/40_delivery/flare_v0_known_limitations.md` is release-oriented, not tester-oriented, and omits several private-testing-specific limitations from the contract. Classification: `documentation`, Severity: `medium`.
- Medium: Supported-device/browser expectations are implicit in deployment docs but not stated as a tester-facing support matrix. Classification: `documentation`, Severity: `medium`.
- Medium: No explicit first-cohort expansion decision template exists, even though the contract defines expansion criteria. Classification: `operations`, Severity: `medium`.
- Low: The app copy already uses calm, bounded language, but the emergency and support boundaries are fragmented across multiple surfaces rather than centralized. Classification: `copy_or_ux`, Severity: `low`.
- Deferred: Public-distribution, supporter accounts, reply monitoring, read receipts, escalation, multiple support groups, billing, and final export/deletion UX remain outside Private Testing V0. Evidence: `docs/00_product/contracts/flare_private_testing_v0_contract.md`, `docs/40_delivery/flare_v0_known_limitations.md`.

## Documentation and Onboarding Gaps

The following tester-facing or operator-facing materials should be created in later work, but are intentionally not written in full in this audit run:

- Tester invitation
- Tester onboarding guide
- Privacy summary
- Known limitations for private testing
- Support instructions and defect-report template
- Emergency boundary summary
- First-session walkthrough
- GroupMe test instructions
- Tester exit / access-removal instructions
- First-cohort entry checklist
- Pause / rollback / resume checklist
- Private-test smoke-test record template
- Tester roster template

These should live under `docs/40_delivery/private_testing/` rather than being scattered across unrelated release docs.

## Product and UX Gaps

- Welcome and About content are strong as orientation copy, but they do not yet carry the full private-testing boundary set. Evidence: `frontend/src/components/WelcomeContent.tsx`, `frontend/src/content/flareContent.json`.
- Signed-out behavior is clearer than many early builds and appears aligned with the response contract: the app permits signed-out use and falls back to a built-in default plan. Evidence: `frontend/src/screens/FlareScreen.tsx`, `frontend/src/state/builtInDefaultFlarePlan.ts`, `frontend/src/screens/__tests__/app_shell.test.tsx`.
- Sign-in gating is intentionally narrow: auth is required for durable personalization and support-group configuration, not for basic flare use. Evidence: `frontend/src/components/AuthStatusCard.tsx`, `frontend/src/components/SupportChannelSetupModal.tsx`.
- Empty-plan behavior appears acceptable. Signed-out use falls back to the built-in default plan, while signed-in persistence and readiness logic avoid implying that a missing saved plan is configured. Evidence: `frontend/src/screens/FlareScreen.tsx`, `frontend/src/screens/CustomizeScreen.tsx`, `frontend/src/components/FlareResponse.tsx`.
- GroupMe setup warnings are productively calm but still incomplete for private-testing needs. The UI says “Send a test before relying on it” and explains that the message is predefined, but does not yet appear to include the private-testing emergency boundary or all GroupMe limitation copy. Evidence: `frontend/src/components/SupportChannelSetupModal.tsx`, `frontend/src/content/flareContent.json`.
- Delivery-success versus human-response expectations are partly handled. The app distinguishes send success/failure, but the full tester expectation that provider success does not imply human receipt or reply is not yet clearly delivered in a durable tester-facing material. Evidence: `frontend/src/components/FlareResponse.tsx`, `frontend/src/content/flareContent.json`.
- Delivery-failure presentation looks contract-aligned in repo evidence: the UI keeps the local flare and tells the user that the support message did not go through. Evidence: `frontend/src/components/FlareResponse.tsx`, `frontend/src/components/__tests__/FlareResponse.test.tsx`.

Recommendations should preserve the current calm, brief design direction. The repo already avoids alarm-heavy recovery UI; the better next step is to improve informational and onboarding surfaces, not to inject repetitive warnings into active flare flow screens.

## Privacy and Security Findings

### Verified protections from repository evidence

- Authenticated persistence tables use RLS and owner-scoped grants. Evidence: `db/migrations/20260627_230500_flare_v0_persistence.sql`.
- Support-channel tables use owner-scoped RLS and separate backend-only provider-config storage. Evidence: `db/migrations/20260705220110_external_support_channel_v0.sql`, `db/migrations/20260706112500_support_channel_provider_configs.sql`.
- Provider tokens are intended to remain backend-controlled. Evidence:
  - `backend/app/db/support_channel_repository.py` uses the service-role key server-side
  - `backend/tests/test_support_channels_api.py` asserts tokens and provider refs are not exposed
  - `frontend/src/services/supportChannelApi.ts` consumes only safe public fields
- Support-channel HTTP routes require bearer auth and fail closed when auth is missing or invalid. Evidence: `backend/app/api/support_channels_api.py`, `backend/app/http/app.py`, `backend/tests/test_support_channel_http_app.py`.
- Browser CORS is exact-origin rather than wildcard. Evidence: `backend/app/http/app.py`, `backend/tests/test_support_channel_http_app.py`.

### Protections that still require live or adversarial validation

- Cross-user reads/writes after real migrations in the current approved environment
- Whether backend logs in the active deployment remain free of sensitive payloads
- Whether provider credentials are rotated and managed operationally, not just structurally
- Whether tester access can be revoked quickly in the actual auth environment
- Whether data-request handling is practical for a live tester

### Privacy/security gaps

- No tester-facing privacy summary currently packages what is stored, what reaches GroupMe, and what is not guaranteed. Severity: `blocker`.
- No documented tester exit/access-removal path exists. Severity: `high`.
- No current live validation evidence confirms that the active deployment still matches the repo’s RLS and secret-handling assumptions. Severity: `medium`.

## GroupMe Findings

- One active support channel per user is structurally supported by `support_channels_one_enabled_per_user_idx` in `db/migrations/20260705220110_external_support_channel_v0.sql`.
- One selected destination at a time is reflected in the UI and backend model. Evidence: `frontend/src/components/SupportChannelSetupModal.tsx`, `backend/app/services/support_channel_management.py`.
- Test-message labeling is structurally supported in backend domain/service code and frontend setup flow. Evidence: `backend/app/services/support_channel_sender.py`, `backend/tests/test_support_channels_api.py`, `frontend/src/components/SupportChannelSetupModal.tsx`.
- Local flare success remains independent from external delivery. Evidence: `frontend/src/screens/FlareScreen.tsx`, `frontend/src/components/FlareResponse.tsx`.
- Delivery failure appears to be reported honestly in the implemented UI and backend result mapping. Evidence: `frontend/src/screens/FlareScreen.tsx`, `backend/app/api/support_channels_api.py`, `frontend/src/components/__tests__/FlareResponse.test.tsx`.
- Reconnect and disable behavior exist in repo code. Evidence: `frontend/src/components/SupportChannelSetupModal.tsx`, `backend/app/services/support_channel_management.py`.
- Wrong-destination risk is reduced by requiring a chosen destination and a manual test step, but it is not yet proven safe in the actual approved environment. Severity: `high`.
- Duplicate-send risk is partially bounded by the predefined message model and explicit channel state, but no current live retry evidence was found in this run. Severity: `high`.
- The product correctly does not claim reply monitoring, read receipts, acknowledgements, or escalation support. Evidence: `docs/00_product/contracts/flare_private_testing_v0_contract.md`, `docs/00_product/contracts/flare_external_support_channel_v0.md`, `frontend/src/content/flareContent.json`.

## Operational Readiness Findings

- Build/deploy basics are reasonably documented for generic release work. Evidence: `docs/40_delivery/flare_v0_production_deployment_checklist.md`, `docs/40_delivery/flare_v0_deploy_checkpoint.md`.
- Frontend/backend health checks exist for the backend HTTP runtime. Evidence: `/api/health` in `backend/app/http/app.py`, `backend/tests/test_support_channel_http_app.py`.
- Environment and CORS validation are documented and tested for the support-channel backend. Evidence: `docs/40_delivery/flare_external_support_channel_tailscale_validation.md`, `backend/tests/test_support_channel_http_app.py`.
- Deployment verification for the exact private-test build is not yet captured in a private-testing artifact. Severity: `high`.
- Logging/diagnosis support exists structurally through delivery-attempt records and last-delivery fields, but no operator-facing private-testing diagnostic runbook exists. Evidence: `db/migrations/20260705220110_external_support_channel_v0.sql`.
- Access revocation is not documented. Severity: `high`.
- Feature/provider disablement is discussed conceptually in `docs/40_delivery/flare_prelaunch_readiness.md`, but not turned into a first-cohort runbook. Severity: `blocker`.
- Rollback is defined in the contract but not yet operationalized for the first cohort. Severity: `blocker`.
- Tester communication outside Flare is required by the contract but not documented as an active operating practice. Severity: `high`.

## Required Live Validation

| What must be tested | Required environment | Expected result | Failure condition | Evidence to record |
| --- | --- | --- | --- | --- |
| New tester sign-in with approved email | Approved private-test frontend + Supabase project | Tester can create/access the account and returns to the right origin | Redirect mismatch, missing email, unusable session | Timestamp, account used, returned URL, screenshot |
| Session persistence after sign-out/sign-in | Same | Session survives ordinary reload and later re-entry | Session disappears or wrong auth state shown | Video/screenshot and browser/device details |
| Signed-out fallback flare | Same | Signed-out user reaches Welcome and can still use local fallback flare path | Signed-out user is hard-blocked or misled about persistence | Screenshots and notes |
| Signed-in plan persistence reload | Same | Saved plan, behavior pattern, and anchor note reload accurately | Saved setup missing or inconsistent | Before/after screenshots and DB row check |
| GroupMe OAuth callback | Approved backend callback host + allowed frontend origin | Callback returns user to Customize and loads destinations | Callback breaks, wrong origin, missing destinations | OAuth timestamp, callback URL, screenshot |
| Correct destination selection | Same plus approved test group | Selected group name matches intended group before save and after reload | Wrong name, wrong saved group, stale selection | Screenshot and stored channel row |
| Test message delivery | Same plus approved real GroupMe test group | Clearly marked test message reaches intended group | No message, wrong group, mislabeled message | Group screenshot, app result, delivery-attempt row |
| Real message delivery | Same | Real message reaches intended group without test label | No message, wrong group, still labeled as test | Group screenshot, app result, delivery-attempt row |
| Intentional delivery failure | Same with disabled/revoked/broken provider state | App shows failure or blocked state, local flare still exists | App reports success or hides failure | Screenshot, backend result, DB row |
| Reconnect and disable flow | Same | Disabled channel stops sends; reconnect restores working sends | Sends still happen while disabled or reconnect fails silently | Screenshots and attempt rows |
| Empty-plan or no-saved-plan flare behavior | Signed-in and signed-out cases | User gets usable response without broken controls | Broken CTA or false configured state | Screenshots |
| Cross-device / second-session behavior | Two supported browsers/devices | Saved account-owned setup reloads correctly | Missing state or mixed ownership | Device matrix and screenshots |
| Access revocation | Private-test auth/admin environment | Revoked tester cannot continue using approved access | Tester keeps access after revocation step | Timestamp, operator action, screenshot |
| Rollback / provider disable verification | Approved operator environment | Unsafe send capability can be disabled and communicated | No reliable way to stop risky behavior | Checklist result and screenshots |

## Explicitly Deferred Work

- Supporter accounts
- Reply monitoring
- Read receipts
- Escalation
- Multiple support groups
- In-app developer announcements
- Automated post-Flare follow-up
- Public distribution
- Billing
- Broad analytics
- Final polished export or deletion UX

These are explicitly outside Private Testing V0 unless the governing contract changes.

## Go / No-Go Assessment

Recommendation: `No-Go`

- Current blocker count: `4`
- Current high-priority gap count: `6`
- Conditions required before inviting tester one:
  - Complete the tester-facing onboarding/support/privacy/emergency materials
  - Complete the operator-facing first-cohort operations package
  - Run and record live validation for the approved private-test environment
  - Align contradictory GroupMe versus Telegram scope docs
- Conditions that may be handled manually for the first cohort:
  - Tester roster can be managed outside the app if a checked-in template exists
  - Access revocation and data requests may remain manual if documented
- Conditions that may be deferred:
  - Public-beta expansion criteria operationalization beyond a checklist
  - Export/delete product implementation beyond manual first-cohort handling

## Recommended Work Items

### 1. Private-Test Tester Materials V0

- Title: `Create first-cohort tester-facing onboarding package`
- Description: Create the invitation, onboarding guide, first-session walkthrough, private-test privacy summary, emergency boundary summary, known limitations, support instructions, GroupMe test instructions, and tester exit/removal instructions.
- Why it is required: The private-testing contract explicitly requires these artifacts before testers rely on the product.
- In-scope files or product surfaces:
  - `docs/40_delivery/private_testing/`
  - Possibly `frontend/src/content/flareContent.json` if later About/support links are added
- Explicit non-goals:
  - No product behavior changes
  - No new provider functionality
  - No legal-policy overhaul beyond bounded tester materials
- Acceptance criteria:
  - Every onboarding-contract item maps to a concrete doc section
  - Privacy, emergency, support, and limitation statements match the current implementation honestly
  - GroupMe test-send expectations are explicit
- Required validation:
  - Operator dry-run of onboarding from invitation through first session
- Dependencies:
  - This audit
- Suggested priority: `P0`

### 2. Private-Test Operations Pack V0

- Title: `Create first-cohort operator runbook, roster, and go/pause/rollback package`
- Description: Create the first-cohort entry checklist, tester roster template, pause/rollback/resume checklist, access-revocation/data-request procedure, and a go/no-go decision template.
- Why it is required: The first cohort must be reversible and actively managed, not informally improvised.
- In-scope files or product surfaces:
  - `docs/40_delivery/private_testing/`
- Explicit non-goals:
  - No admin UI build
  - No auth-system implementation changes
- Acceptance criteria:
  - Contract-required operational decisions have a concrete documented procedure
  - Tester roster fields match the contract
  - Pause and rollback actions are specific enough to execute
- Required validation:
  - Tabletop incident exercise against the runbook
- Dependencies:
  - This audit
- Suggested priority: `P0`

### 3. Private-Test Live Validation Pass V0

- Title: `Run and document live private-environment auth and GroupMe validation`
- Description: Execute the focused smoke and failure checks against the exact approved private-test frontend/backend/auth/provider environment and record the results.
- Why it is required: Static code and historical notes are not enough for first-cohort entry.
- In-scope files or product surfaces:
  - Approved deployment environment
  - `docs/40_delivery/private_testing/` smoke record
- Explicit non-goals:
  - No feature development except narrow fixes if validation reveals breakage in a later run
- Acceptance criteria:
  - Live evidence exists for auth, plan persistence, GroupMe connect, test send, real send, failure handling, disable/reconnect, and rollback feasibility
- Required validation:
  - The work item is itself the validation run
- Dependencies:
  - Work items 1 and 2 for the operator/tester framing
- Suggested priority: `P0`

### 4. Scope and Limitations Alignment

- Title: `Align authoritative Flare docs with current GroupMe-backed private-test scope`
- Description: Update older authoritative docs that still describe Telegram or support-channel behavior as future-only where that now contradicts implementation and newer contracts.
- Why it is required: Tester and operator expectations must match the actual supported build.
- In-scope files or product surfaces:
  - `docs/10_design/flare_v0_app_structure_navigation.md`
  - `docs/40_delivery/flare_v0_known_limitations.md`
  - Any directly conflicting authority docs discovered during implementation
- Explicit non-goals:
  - No broad product-repositioning rewrite
- Acceptance criteria:
  - No authoritative doc contradicts the current supported GroupMe scope for private testing
- Required validation:
  - Cross-check against implemented UI and backend routes
- Dependencies:
  - This audit
- Suggested priority: `P1`

### 5. In-App Informational Surface Alignment

- Title: `Add durable in-app access to emergency, privacy, support, and limitations summaries`
- Description: Expand the About/information surface so a tester can later retrieve the private-test boundary set without re-reading external onboarding only.
- Why it is required: The contract requires later availability of the emergency boundary and clearer ongoing expectation management.
- In-scope files or product surfaces:
  - `frontend/src/components/WelcomeContent.tsx`
  - `frontend/src/screens/CustomizeScreen.tsx`
  - `frontend/src/content/flareContent.json`
- Explicit non-goals:
  - No change to the active recovery flow’s calm, low-density design
- Acceptance criteria:
  - Emergency boundary, privacy summary pointer, support path, and known limitations are reachable from a stable informational surface
- Required validation:
  - Mobile-width manual pass and targeted UI tests
- Dependencies:
  - Work item 1 for canonical copy
- Suggested priority: `P1`

## Recommended Execution Order

1. Private-Test Tester Materials V0
2. Private-Test Operations Pack V0
3. Scope and Limitations Alignment
4. In-App Informational Surface Alignment
5. Private-Test Live Validation Pass V0

This order keeps privacy, emergency, and operational boundaries ahead of live tester use, and keeps live validation against the final intended docs/scope rather than a moving target.

## First-Cohort Entry Checklist Draft

- [x] Verified: Signed-out Welcome/orientation flow exists in repo
- [x] Verified: Signed-in auth flow exists in repo
- [x] Verified: Signed-in Flare Plan persistence and run behavior exist in repo
- [x] Verified: Account-owned history and checkpoint persistence exist in repo
- [x] Verified: GroupMe support-channel code path exists in repo
- [x] Verified: Owner-scoped persistence and support-channel RLS/grants exist in checked-in migrations
- [ ] Required: Tester invitation and onboarding guide exist
- [ ] Required: Tester-facing privacy summary exists
- [ ] Required: Tester-facing emergency boundary summary exists
- [ ] Required: Tester-facing known limitations doc exists and matches current build
- [ ] Required: Tester support/defect-reporting instructions exist
- [ ] Required: Tester exit/access-removal instructions exist
- [ ] Required: First-cohort roster template exists
- [ ] Required: First-cohort entry checklist exists as an operator artifact
- [ ] Required: Pause/rollback/resume checklist exists
- [ ] Required: Access-revocation and tester data-request procedure exists
- [~] Requires live validation: Approved private-test build identifier is set and communicated
- [~] Requires live validation: Production/private-test sign-in works end to end
- [~] Requires live validation: Session persistence works on the approved environment
- [~] Requires live validation: GroupMe callback works on the approved environment
- [~] Requires live validation: Test flare reaches the intended real group
- [~] Requires live validation: Real flare reaches the intended real group
- [~] Requires live validation: Intentional delivery failure appears as failure, not success
- [~] Requires live validation: Disable/reconnect flow behaves safely
- [~] Requires live validation: Access revocation works for a live tester account
- [~] Requires live validation: Rollback/provider-disable path works in practice
- [-] Deferred: Public distribution, billing, reply monitoring, escalation, multiple support groups, export/delete UX polish
