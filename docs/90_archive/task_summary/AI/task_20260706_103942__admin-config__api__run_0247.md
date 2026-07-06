Run name: External Support Channel API Slice

# Build Run Summary
## Phase 1 - Implementation
- scope: Implemented a backend API slice for External Support Channel V0 covering authenticated read, GroupMe configure foundation, reconnect, disable, and test-send flows on top of the existing provider adapter and delivery-attempt sender service. Shifted test sends from the prior single env-bound GroupMe bot assumption to backend-only `provider_config_ref` resolution so saved per-user channel config can drive sends without exposing bot ids.
- files changed: `backend/app/api/support_channels_api.py`; `backend/app/db/support_channel_repository.py`; `backend/app/domain/support_channels.py`; `backend/app/services/support_channel_groupme_provisioner.py`; `backend/app/services/support_channel_management.py`; `backend/app/services/support_channel_provider_config.py`; `backend/app/services/support_channel_sender.py`; `backend/scripts/send_groupme_test_flare.py`; `backend/tests/test_support_channel_sender.py`; `backend/tests/test_support_channels_api.py`
- tests run: `python -m unittest backend.tests.test_groupme_provider backend.tests.test_support_channel_sender backend.tests.test_support_channels_api`
- initial result: The backend now has a minimal route layer with explicit auth injection and safe response shaping, repository support for current-channel read/create/update, a backend-only provider-config reference encoder/resolver, and route-level tests covering empty, configured, disabled, success, provider-failure, configure, reconnect, and disable behavior without leaking provider secrets or bot ids.
## Phase 2 - Review and Gap Closure
- compared against: task requirements; `docs/20_architecture/TOOLBOX_CONSTITUTION.md`; `docs/00_product/flare_external_support_channel_v0.md`; `db/migrations/20260705220110_external_support_channel_v0.sql`; `C:/dev/dev-toolbox-starter/.toolbox/schema_supabase.json`
- gaps identified: The first implementation pass still returned the full sender result shape from the test endpoint, which exposed more operational detail than the contract-required safe status/result surface. The Supabase schema snapshot was consulted per governance and is still stale relative to this feature: it does not yet include `public.support_channels` or `public.support_channel_delivery_attempts`. Also, while this run adds the configure/reconnect backend boundary, it does not implement live GroupMe OAuth, group listing, or bot provisioning yet; the new provisioner is intentionally injectable and the default runtime manager remains unconfigured.
- fixes applied: Narrowed the test endpoint response to a safe public result shape (`provider`, `send_kind`, `status`, timestamps, destination display name, message preview, and safe error fields). Reran the backend unittest suite after that tightening change. Removed generated backend `__pycache__` directories after validation to keep the worktree clean.
- remaining gaps: Live GroupMe connect flow pieces are still pending outside this slice: OAuth exchange, provider destination listing, and real bot creation/provisioning are not wired in this run. The new configure/reconnect code establishes the backend-only interface for that work, but production runtime wiring still needs to be added before mobile can complete the full end-to-end GroupMe onboarding flow.
- final assessment: The requested API slice is implemented within the current repo constraints. Authenticated read, configure foundation, reconnect, disable, and test-send paths now exist with safe frontend-facing payloads, persisted delivery-attempt behavior, delivery-status updates, and backend coverage for no-channel, configured read, disabled send block, successful send, provider failure, reconnect, and no-secret response requirements. The main unfinished area is the live GroupMe provisioning integration behind the new backend boundary.
## Learning Candidates
- status: none
- reason: Evaluated repeated failures, schema/constraint drift, path/env issues, diagnostics gaps, and test gaps; no reusable, scoped, evidence-backed learning candidate emerged from this run beyond feature-specific implementation choices that are already captured directly in the changed code and summary.

## Diff
- terminal_state_snapshot: completed
- files_changed: 11
- insertions: 1120
- deletions: 48
- note: terminal_state_snapshot reflects the run state when diff metadata was captured.
- changed_files:
  - backend/app/api/support_channels_api.py
  - backend/app/db/support_channel_repository.py
  - backend/app/domain/support_channels.py
  - backend/app/services/support_channel_groupme_provisioner.py
  - backend/app/services/support_channel_management.py
  - backend/app/services/support_channel_provider_config.py
  - backend/app/services/support_channel_sender.py
  - backend/scripts/send_groupme_test_flare.py
  - backend/tests/test_support_channel_sender.py
  - backend/tests/test_support_channels_api.py
  - docs/90_archive/task_summary/AI/task_20260706_103942__admin-config__api__run_0247.md
## Validation Summary
- validation_requested: true
- validation_ran: true
- validation_result: passed
- tests_run: `python -m unittest backend.tests.test_groupme_provider backend.tests.test_support_channel_sender backend.tests.test_support_channels_api`
- summary: Validation details were derived from the Build Run Summary body.
## Final Run State
- terminal_state: completed
- summary_written: true
- validation_requested: true
- validation_ran: true
- validation_result: passed
- tests_run: `python -m unittest backend.tests.test_groupme_provider backend.tests.test_support_channel_sender backend.tests.test_support_channels_api`
