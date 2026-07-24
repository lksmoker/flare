# Build Run Summary

## Phase 1 - Implementation
- scope
  - Moved the repo-managed production frontend URL to `https://lksmoker.github.io/flare/` in the GitHub Pages workflow by pinning `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL` to the project-site URL and keeping the backend API base URL externally configured.
  - Configured Expo web export for the GitHub Pages project base path with `expo.experiments.baseUrl = "/flare"` in `frontend/app.json`.
  - Added a post-export GitHub Pages fallback step in `frontend/scripts/prepare-pages-build.mjs` and wired it into the frontend build so `frontend/dist/404.html` is emitted from `index.html` for direct route refresh fallback on GitHub Pages.
  - Updated the frontend GroupMe connect flow in `frontend/src/services/supportChannelApi.ts` to derive the current frontend base URL, including `/flare`, and send it to the backend via `x-flare-frontend-url`.
  - Updated the backend callback bridge in `backend/app/http/app.py` to accept the explicit frontend base URL for OAuth state, preserve exact-origin CORS, allow the new request header, and redirect GroupMe callback completion back to the initiating frontend base URL before `/customize`.
  - Updated deployment and operator documentation to replace active `https://flare.lukesmoker.com/` references with `https://lksmoker.github.io/flare/`, and clarified the page URL versus CORS origin distinction.
- files changed
  - `.github/workflows/deploy-flare-pages.yml`
  - `.env.example`
  - `README.md`
  - `backend/README.md`
  - `backend/app/http/app.py`
  - `backend/tests/test_support_channel_http_app.py`
  - `docs/40_delivery/flare_v0_deploy_checkpoint.md`
  - `docs/40_delivery/flare_v0_production_deployment_checklist.md`
  - `docs/40_delivery/private_testing/flare_private_testing_readiness_audit_v0.md`
  - `frontend/app.json`
  - `frontend/package.json`
  - `frontend/scripts/prepare-pages-build.mjs`
  - `frontend/src/services/supportChannelApi.ts`
  - `frontend/src/services/__tests__/supportChannelApi.test.ts`
- tests run
  - `npm test -- --runInBand frontend/src/services/__tests__/supportChannelApi.test.ts` -> pass
  - `python -m unittest backend.tests.test_support_channel_http_app` -> pass
  - `npm run typecheck` -> pass
  - `$env:EXPO_NO_TELEMETRY='1'; npm run build` -> pass
  - Generated-output inspection:
    - `frontend/dist/index.html` references `"/flare/_expo/static/js/web/entry-...js"`
    - `frontend/dist/404.html` exists alongside `index.html`, `customize.html`, and `history.html`
    - active-doc repo search for `flare.lukesmoker.com` outside `docs/90_archive/` -> no matches
- initial result
  - Final frontend URL: `https://lksmoker.github.io/flare/`
  - Final configured GitHub Pages base path: `/flare/`
  - CORS behavior changed in code and docs to allow the callback flow to preserve the initiating frontend base URL while keeping the browser allowlist origin-only and exact.
  - Authentication redirect behavior changed in the GitHub Pages workflow from an external variable to the pinned production Pages URL `https://lksmoker.github.io/flare/`.
  - GroupMe callback behavior changed in code so the backend bridge returns to the initiating frontend base URL, including `/flare`, instead of assuming a domain-root `/customize`.

## Phase 2 - Review and Gap Closure
- compared against
  - `docs/20_architecture/TOOLBOX_CONSTITUTION.md`
  - the `admin-config` feature contract in the run prompt
  - the build task requirements and acceptance criteria in the run prompt
- gaps identified
  - The initial backend test update was too brittle because it matched escaped JavaScript regex literals instead of the callback behavior.
  - The local Python environment does not include `pytest`, so the backend focused validation had to use the repo’s `unittest` path instead.
  - The repo does not contain the deployed backend runtime environment itself, so the production CORS allowlist change for `https://lksmoker.github.io` remains a manual operator/runtime update outside source control.
- fixes applied
  - Relaxed the backend callback-bridge assertions in `backend/tests/test_support_channel_http_app.py` to validate the new redirect behavior without coupling to exact escape formatting.
  - Re-ran backend validation with `python -m unittest backend.tests.test_support_channel_http_app` and confirmed pass.
  - Verified the production build output after the Pages-base-path change and the `404.html` fallback generation.
  - Re-checked active docs and workflow-owned configuration for stale `flare.lukesmoker.com` references and confirmed none remain outside archive history.
- remaining gaps
  - External-console or runtime updates still required:
    - backend deployed runtime: add `https://lksmoker.github.io` to `FLARE_ALLOWED_FRONTEND_ORIGINS` and remove `https://flare.lukesmoker.com` if it is still present there
    - Supabase Auth console: set `Site URL` and allowed redirect URL to `https://lksmoker.github.io/flare/` if not already updated
    - GitHub Pages settings: verify the custom domain is still removed and the project site publishes from the default Pages URL
  - GroupMe external-console change: no repo evidence showed a frontend-domain callback dependency; the GroupMe OAuth callback remains backend-based. No provider-console change is required from repo evidence unless the live GroupMe app was manually configured with the old frontend URL outside this repo.
- final assessment
  - Scope completed:
    - frontend production export now targets the GitHub Pages project path `/flare/`
    - generated asset URLs resolve under `/flare/`
    - direct route refresh has a documented and emitted `404.html` GitHub Pages fallback artifact
    - GroupMe callback completion no longer assumes a domain-root frontend path
    - active deployment/private-testing docs no longer present `https://flare.lukesmoker.com/` as the current frontend URL
  - Files inspected:
    - `.github/workflows/deploy-flare-pages.yml`
    - `frontend/app.json`
    - `frontend/package.json`
    - `frontend/app/_layout.tsx`
    - `frontend/src/services/supportChannelApi.ts`
    - `frontend/src/services/flareSupabaseAuth.ts`
    - `frontend/src/services/flarePlanApi.ts`
    - `frontend/src/services/flareResponseApi.ts`
    - `backend/app/http/app.py`
    - `backend/app/services/support_channel_config.py`
    - `backend/tests/test_support_channel_http_app.py`
    - `README.md`
    - `backend/README.md`
    - `docs/40_delivery/flare_v0_production_deployment_checklist.md`
    - `docs/40_delivery/flare_v0_deploy_checkpoint.md`
    - `docs/40_delivery/private_testing/flare_private_testing_readiness_audit_v0.md`
  - CORS origins added, retained, or removed:
    - repo example/docs added: `https://lksmoker.github.io`
    - retained guidance for local/Tailscale origins
    - removed active custom-domain documentation dependency on `https://flare.lukesmoker.com`
  - Tests and checks run:
    - `npm test -- --runInBand frontend/src/services/__tests__/supportChannelApi.test.ts`
    - `python -m unittest backend.tests.test_support_channel_http_app`
    - `npm run typecheck`
    - `$env:EXPO_NO_TELEMETRY='1'; npm run build`
  - Production build result:
    - pass
  - Generated-output inspection result:
    - `frontend/dist/index.html` uses `/flare/_expo/...` asset URLs
    - `frontend/dist/404.html` exists for GitHub Pages route-refresh fallback
  - Deployment smoke-test steps:
    - open `https://lksmoker.github.io/flare/`
    - confirm the main page shell loads and static assets return 200 in the browser network panel
    - verify anonymous flow loads and a signed-out user can still reach the basic Flare path
    - sign in and confirm the auth redirect returns to `https://lksmoker.github.io/flare/`
    - sign out and sign back in
    - perform one authenticated API-backed load such as history or support-channel status and confirm no browser CORS failure from origin `https://lksmoker.github.io`
    - create a Flare and confirm the response flow opens normally
    - open History and confirm saved history loads
    - refresh `https://lksmoker.github.io/flare/customize` and `https://lksmoker.github.io/flare/history` and confirm the Pages fallback still boots the app
    - if GroupMe is configured, start connect flow and confirm callback returns to `/flare/customize`; if already connected, run a test-send flow and confirm delivery/failure reporting remains honest
  - Risks and follow-ups:
    - live backend CORS and Supabase redirect settings must still be updated manually if they still contain the old domain
    - GitHub Pages route refresh now has a committed fallback artifact, but live validation on the deployed Pages site is still required because build success alone does not prove host behavior
  - Anything intentionally not changed:
    - backend API hostname
    - Supabase auth architecture
    - GroupMe provider callback hostname, which remains backend-based
    - DNS or Cloudflare resources
  - Unexpected scope expansion or repository discoveries:
    - the backend GroupMe callback bridge needed a new frontend-base-url header and state handling to preserve `/flare`; changing only Expo base-path settings would not have fixed the callback return path
    - the repo already had focused backend CORS and callback tests, which kept the change localized and validation-first

## Learning Candidates
{
  "learning_candidates": [
    {
      "status": "candidate",
      "summary": "When moving an Expo Router static export to a GitHub Pages project path, validate both the build-time base path and a committed `404.html` fallback because a successful export does not prove direct route refresh behavior.",
      "learning_type": "test_recommendation",
      "proposed_scope": {
        "type": "feature",
        "feature_slug": "admin-config"
      },
      "guidance": [
        "Set the Expo web base path explicitly for the project-site prefix before validating asset URLs.",
        "After export, inspect generated HTML for the prefixed asset path and confirm `404.html` exists for GitHub Pages refresh fallback.",
        "Include at least one manual smoke step that refreshes a non-root route on the deployed Pages URL."
      ],
      "anti_guidance": [
        "Do not treat a successful static export alone as proof that `/repo-path/route` refreshes will work on GitHub Pages.",
        "Do not assume origin-only callback or redirect handling is sufficient when the frontend is hosted under a project subpath."
      ],
      "applies_when": {
        "run_modes": ["build", "repair", "validation"],
        "file_globs": [
          ".github/workflows/*.yml",
          "frontend/app.json",
          "frontend/package.json",
          "frontend/dist/*.html"
        ],
        "failure_modes": [
          "GitHub Pages project-site subpath deployment",
          "static assets load from the wrong base path",
          "browser refresh on a non-root route returns a Pages 404 shell"
        ]
      },
      "evidence_refs": [
        "frontend/app.json",
        "frontend/scripts/prepare-pages-build.mjs",
        ".github/workflows/deploy-flare-pages.yml",
        "docs/90_archive/task_summary/AI/task_20260724_175059__admin-config__github-pages-url__run_a7c4.md"
      ],
      "confidence": "high",
      "rationale": "This run needed both `expo.experiments.baseUrl` and an emitted `404.html` fallback to satisfy the GitHub Pages project-site path requirements. That combination is reusable for future Pages-path migrations in this feature area."
    }
  ]
}

## Diff
- terminal_state_snapshot: completed
- files_changed: 15
- insertions: 401
- deletions: 36
- note: terminal_state_snapshot reflects the run state when diff metadata was captured.
- changed_files:
  - .env.example
  - .github/workflows/deploy-flare-pages.yml
  - README.md
  - backend/README.md
  - backend/app/http/app.py
  - backend/tests/test_support_channel_http_app.py
  - docs/40_delivery/flare_v0_deploy_checkpoint.md
  - docs/40_delivery/flare_v0_production_deployment_checklist.md
  - docs/40_delivery/private_testing/flare_private_testing_readiness_audit_v0.md
  - docs/90_archive/task_summary/AI/task_20260724_175059__admin-config__github-pages-url__run_a7c4.md
  - frontend/app.json
  - frontend/package.json
  - frontend/scripts/prepare-pages-build.mjs
  - frontend/src/services/__tests__/supportChannelApi.test.ts
  - frontend/src/services/supportChannelApi.ts
## Validation Summary
- validation_requested: true
- validation_ran: true
- validation_result: passed
- tests_run: npm test -- --runInBand frontend/src/services/__tests__/supportChannelApi.test.ts` -> pass, python -m unittest backend.tests.test_support_channel_http_app` -> pass, npm run typecheck` -> pass, $env:EXPO_NO_TELEMETRY='1'; npm run build` -> pass, Generated-output inspection:, frontend/dist/index.html` references `"/flare/_expo/static/js/web/entry-...js", frontend/dist/404.html` exists alongside `index.html`, `customize.html`, and `history.html, active-doc repo search for `flare.lukesmoker.com` outside `docs/90_archive/` -> no matches
- summary: Validation details were derived from the Build Run Summary body.
## Final Run State
- terminal_state: completed
- summary_written: true
- validation_requested: true
- validation_ran: true
- validation_result: passed
- tests_run: npm test -- --runInBand frontend/src/services/__tests__/supportChannelApi.test.ts` -> pass, python -m unittest backend.tests.test_support_channel_http_app` -> pass, npm run typecheck` -> pass, $env:EXPO_NO_TELEMETRY='1'; npm run build` -> pass, Generated-output inspection:, frontend/dist/index.html` references `"/flare/_expo/static/js/web/entry-...js", frontend/dist/404.html` exists alongside `index.html`, `customize.html`, and `history.html, active-doc repo search for `flare.lukesmoker.com` outside `docs/90_archive/` -> no matches
