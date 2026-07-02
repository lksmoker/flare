<!-- @context: { "kind": "delivery.checklist", "layer": "docs", "name": "Flare V0 Production Deployment Checklist", "domains": ["delivery", "deployment", "supabase", "v0"] } -->

# Flare V0 Production Deployment Checklist

## Release target

- Current production target: Expo web static export hosted on a static web host.
- Current validated user path: signed-in mobile-sized web browser flow backed by Supabase Auth and Postgres persistence.
- This checklist does not cover native iOS/Android store release work.

## Launch blocker status

- Launch blocker status: none identified as of July 2, 2026.
- Remaining required work before deploy: operator review, production env setup, Supabase redirect verification, build/export, static-host publish, and post-deploy smoke test.

## Required environment variables

Set these in the production host environment before building or serving the static export:

| Variable | Required for production web | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_FLARE_SUPABASE_URL` | yes | Public Supabase project URL used by the web client. |
| `EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY` | yes | Public anon key used by the web client. |
| `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL` | yes | Absolute production web URL used for Supabase email/password follow-up and magic-link redirect behavior. |
| `FLARE_APP_ENV` | recommended | Deployment label such as `production` for operator clarity. |

Do not load server/admin-only variables into the Expo web client bundle:

| Variable | Client use | Notes |
| --- | --- | --- |
| `FLARE_SUPABASE_URL` | no | Admin/server-only duplicate of the project URL. |
| `FLARE_SUPABASE_PROJECT_ID` | no | Admin/operator reference only. |
| `FLARE_SUPABASE_SERVICE_ROLE_KEY` | no | Never expose to the browser bundle. |
| `FLARE_SUPABASE_DB_URL` | no | Migration/admin access only. |

## Supabase project configuration

Verify the production Supabase project matches these assumptions:

- Auth provider support:
  - Email/password sign-in enabled.
  - Email OTP / magic link allowed if that path will remain visible in production.
- Auth URLs:
  - Supabase `Site URL` set to the production app origin.
  - Supabase allowed redirect URLs include the exact `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL` value.
  - If preview/staging URLs are used, add them explicitly instead of relying on localhost fallback behavior.
- Persistence:
  - The signed-in V0 flow depends on Supabase-backed persistence for setup and history reload.
  - The app stores browser session auth state with the `flare-auth-token` storage key.
- Secrets discipline:
  - Only the public URL, anon key, and redirect URL belong in the Expo runtime.
  - Service role and DB connection values stay in operator-only tooling.

## Database migrations and expected tables

Apply the checked-in migrations before the first production smoke test:

1. `db/migrations/20260627_230500_flare_v0_persistence.sql`
2. `db/migrations/20260702_110000_flare_events_archive_support.sql`

Expected production tables:

- `public.behavior_patterns`
- `public.anchor_notes`
- `public.flare_events`
- `public.checkpoint_reflections`

Expected production indexes/constraints include:

- one reflection per flare event via `idx_checkpoint_reflections_flare_event_id`
- owner/history lookup indexes on each durable table
- archive support on `public.flare_events.archived_at`
- status and content validation checks defined in the migrations

## RLS and access expectations

Production should not proceed unless these migration-backed access controls are present:

- RLS enabled on all four public tables.
- `anon` has no table privileges on the durable V0 tables.
- `authenticated` has `select`, `insert`, `update`, and `delete` grants on the durable V0 tables.
- `service_role` retains full access for operator/admin tooling only.
- Authenticated policies restrict reads and writes to `auth.uid() = user_id`.
- `flare_events` insert/update policies validate linked `behavior_patterns` and `anchor_notes` ownership.
- `checkpoint_reflections` insert/update policies require ownership of the linked `flare_event`.

## Build and release steps

1. Confirm the working tree is clean enough to release:

```powershell
git status --short
```

2. Confirm `.tmp/` automation artifacts are ignored or otherwise intentionally excluded from the release diff.

3. Load production-safe environment variables into the shell or host build settings.

4. Run the required validation commands from the repo root:

```powershell
npm run lint
npm run typecheck
npm run test
$env:EXPO_NO_TELEMETRY='1'
npm run build
```

5. Confirm the Expo web export completed successfully.

6. Publish the generated static site from `frontend/dist` to the chosen static host.

7. Ensure the deployed origin exactly matches the configured `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL` and Supabase allowed redirect entry.

## Manual deploy notes

Because this repo does not include a host-specific deployment config, use the static host's manual or CI-driven upload flow:

- run `npm run build` from the repo root
- upload or publish the contents of `frontend/dist`
- configure the host to serve the static export at the same origin used in Supabase Auth
- keep production env vars in the host secret/config surface rather than in repo-local files

## Post-deploy smoke test

Run the smoke test against the deployed production URL on a mobile-sized browser viewport:

1. Open the production app URL.
2. Confirm the app loads without missing-config auth gating.
3. Sign in with a production-ready test account.
4. Confirm setup persistence status appears ready for Supabase-backed save behavior.
5. Create and confirm a `Behavior Pattern`.
6. Create and confirm an `Anchor Note`.
7. Press `Send Flare`.
8. Confirm `Flare Response` opens immediately with no confirmation step.
9. Confirm saved `Anchor Note` content appears in the response.
10. Complete `Checkpoint / Reflection`.
11. Confirm the reflection attaches to the same `Flare Event`.
12. Open `History`.
13. Search `History`.
14. Open event detail.
15. Archive the event.
16. Confirm archived event leaves the default view.
17. Switch to `Archived`.
18. Restore the event.
19. Confirm restored event returns to the default active view.
20. Sign out.
21. Sign back in.
22. Confirm setup and event history reload durably.

Capture at minimum:

- deployed URL
- smoke date/time
- account used
- pass/fail result
- any console or network errors that affect the user flow

## Known non-blocking issues

- One browser console `404` resource request remains from the latest release-candidate smoke pass.
- That `404` did not block sign-in, persistence, flare creation, reflection save, history search, archive/restore, or durable reload.
- Treat it as release hardening follow-up, not a current launch blocker.

## Operator sign-off check

Before declaring production ready, explicitly confirm:

- production env vars are present and correct
- Supabase auth URLs match the production origin
- both checked-in migrations are applied
- RLS/grants/policies are present on all four tables
- the static host is serving the latest `frontend/dist` export
- the full signed-in smoke path passes on the deployed URL
- the remaining console `404` is understood and accepted as non-blocking for V0
