<!-- @context: { "kind": "delivery.release_notes", "layer": "docs", "name": "Flare V0 Release Positioning", "domains": ["delivery", "release", "v0"] } -->

# Flare V0 Release Positioning

## Release state

- Release candidate status: V0 smoke-tested on July 2, 2026
- Smoke result: pass after closing the reflection-state feedback gap in the live app loop
- Launch blocker status: no remaining blocker found in this run
- Remaining release work: production deployment checklist, operator review, and final legal/product approval

## Manual smoke test summary

Smoke path executed on the mobile-sized web app against a signed-in Supabase-backed account:

1. Sign in
2. Confirm setup persistence status
3. Create and confirm `Behavior Pattern`
4. Create and confirm `Anchor Note`
5. Send Flare
6. Confirm `Flare Response` opens immediately
7. Confirm saved `Anchor Note` content appears in the response
8. Complete `Checkpoint / Reflection`
9. Confirm reflection attaches to the same `Flare Event`
10. Open `History`
11. Search `History`
12. Open event detail
13. Archive event
14. Confirm archived event leaves the default view
15. Switch to `Archived`
16. Restore event
17. Confirm restored event returns to the active/default view
18. Sign out
19. Sign back in
20. Confirm setup and event history reload durably

## What Flare V0 does

Flare V0 is a self-support and reflection tool for a user who wants to pause a pattern, reconnect with their own reasons, and record what happened.

In V0, Flare can:

- let a user define a `Behavior Pattern`
- let a user save an `Anchor Note`
- let a user press `Send Flare` to mark a moment and open self-support copy immediately
- let a user save a lightweight `Checkpoint / Reflection`
- let a user review, search, archive, and restore prior `Flare Events`
- reload saved setup and event history after sign-in on the same deployment

## What Flare V0 does not do

Flare V0 does not:

- monitor a user in real time
- detect crisis state or urgent risk
- contact emergency services
- contact supporters on the user's behalf
- replace therapy, counseling, or medical care
- provide medical advice
- guarantee relapse prevention or behavior change
- claim clinical effectiveness or validated outcomes

If a user may hurt themselves or someone else, or needs immediate help, they should contact local emergency services or a crisis hotline now.

## Privacy and safety positioning

- Flare is a self-directed tool, not a supervised service.
- The app should use calm, non-clinical language and should not imply diagnosis, treatment, emergency response, or guaranteed safety outcomes.
- Recovery content is user-authored and may be sensitive; deployment and device-access expectations should treat it that way.
- Release copy must not imply therapy, crisis support, emergency response, monitoring, supporter outreach, or guaranteed behavior change.

## Current deployment assumptions

- V0 is currently validated as an Expo web deployment.
- Public Supabase runtime variables must be present in the frontend runtime before launch.
- The configured auth redirect URL must be allowed in Supabase Auth for password and magic-link flows to behave predictably.
- The release-ready loop currently depends on signed-in Supabase persistence for durable setup and event history.
- Mobile-sized browser usability is the primary tested path for this release candidate.

## Known limitations

Known limitations are tracked in `docs/40_delivery/flare_v0_known_limitations.md`.

## Remaining launch blockers

No launch blocker remained after this run.

The only issue observed during the final smoke pass was a browser console `404` resource request that did not block sign-in, persistence, flare creation, reflection save, history search, archive/restore, or durable reload.
