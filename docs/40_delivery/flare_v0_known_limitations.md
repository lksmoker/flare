<!-- @context: { "kind": "delivery.limitations", "layer": "docs", "name": "Flare V0 Known Limitations", "domains": ["delivery", "limitations", "v0"] } -->

# Flare V0 Known Limitations

## Product boundaries

- Flare does not provide therapy, medical treatment, crisis care, emergency response, monitoring, or supporter outreach.
- Flare does not guarantee behavior change, relapse prevention, or clinical outcomes.
- `Telegram Support` is visible as future direction only and does not send messages in V0.

## Functional limitations

- V0 supports one lightweight `Behavior Pattern` and one lightweight `Anchor Note` per signed-in user flow.
- `Checkpoint / Reflection` is intentionally short-form and does not provide deeper journaling, scoring, or analysis.
- `History` supports search, archive, and restore, but not export, bulk actions, or advanced filtering.
- There are no push notifications, SMS alerts, supporter notifications, or scheduled interventions.

## Deployment limitations

- The validated release path is the Expo web deployment with public Supabase runtime configuration loaded.
- Auth flows depend on a correct allowed redirect URL in Supabase.
- Durable persistence is validated against signed-in Supabase sessions, not offline-first local sync.

## UX and polish limitations

- Mobile-sized usability is the primary supported layout; broader release hardening is still needed before expanding device/browser claims.
- The final smoke pass still produced a non-blocking browser console `404` resource request that should be cleaned up during deployment hardening.

## Operational follow-up before launch expansion

- Complete the production deployment checklist and operator review before broader rollout.
- Confirm final legal/privacy copy for the production surface that hosts V0.
- Add release-hardening checks for deployment assets and console-noise cleanup if broader launch confidence is required.
