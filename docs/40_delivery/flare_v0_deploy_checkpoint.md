# Flare V0 Deployment Checkpoint

Date: 2026-07-04

## Summary

Flare V0 is deployed and working at:

https://lksmoker.github.io/flare/

The V0 release-readiness loop is now effectively complete for personal and limited external testing. The app has the core solo-user loop implemented, polished copy/theme, production GitHub Pages hosting, Supabase auth/config wired correctly, and working magic-link redirect behavior.

## Current production state

- Host: GitHub Pages
- Production URL: https://lksmoker.github.io/flare/
- GitHub Pages base path: /flare/
- Custom domain: removed
- Supabase public config: loaded in deployed Expo web bundle
- Supabase auth redirect: working
- Magic link redirect: working
- Auth/session persistence: working
- App copy: centralized and polished in `frontend/src/content/flareContent.json`
- Theme: blue/night-sky visual polish applied
- Release docs: known limitations, release positioning, launch gate status, and deployment checklist exist
- Launch blocker status: none known for limited external testing

## Completed V0 readiness work

- Implemented durable Supabase auth/config path for deployed web.
- Centralized static user-facing copy into one content JSON file.
- Refactored content JSON into app/navigation/common/safety/auth/screens/components groups.
- Polished copy for calm, trustworthy, mobile-first use.
- Added privacy/safety/non-emergency positioning.
- Added known limitations and release positioning docs.
- Added production deployment checklist.
- Added launch-gate status documentation.
- Added owner-scoped persistence regression coverage.
- Ran authenticated V0 smoke test locally.
- Fixed reflection save flow so saving Checkpoint / Reflection returns to reflected Flare Response.
- Applied blue theme polish.
- Configured GitHub Pages deployment workflow.
- Removed the old custom-domain dependency and standardized on the GitHub Pages project URL.
- Fixed GitHub Actions Supabase env wiring.
- Fixed Expo web env access for Supabase config and auth redirect URL.

## Important fixes from deployment

### GitHub Actions env names

The frontend reads Flare-prefixed env vars:

- `EXPO_PUBLIC_FLARE_SUPABASE_URL`
- `EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL`

The GitHub Pages workflow must expose those exact names during `npx expo export --platform web`.

### Expo web env access

Expo web env inlining required direct env access rather than dynamic key lookup.

Fixed:

- `frontend/src/services/supabaseClient.ts`
- `frontend/src/services/flareSupabaseAuth.ts`

The auth redirect reader now uses direct access to:

- `process.env.EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL`

## Final verification notes

Confirmed after deploy:

- Production app loads at `https://lksmoker.github.io/flare/`
- Supabase config no longer shows local-only
- Magic link redirect no longer reports missing redirect URL
- UI looks good on the deployed app
- GitHub Pages project URL works

## Remaining follow-up candidates

These should move to future workstreams rather than extending this V0 readiness sprint:

1. Add a simple external feedback link for limited testers.
2. Capture V1 Telegram/support-group follow-up workstream.
3. Add V0/V1 data export/delete implementation later.
4. Run a formal post-deploy smoke test checklist after any future deployment.
5. Consider app-store/native packaging later if the web V0 proves useful.

## Recommended sprint status

`Flare V0 Readiness + Deploy` can be treated as complete for limited external testing once the final repo status is clean and the checkpoint/docs are committed.

