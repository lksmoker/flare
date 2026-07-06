Status: draft
Doc Type: implementation note
Role: Reserve the backend boundary for future API, domain, and integration work.

This scaffold keeps backend concerns out of the Expo client. Future server-side work should stay under `backend/app/` and avoid leaking transport or persistence logic into the mobile UI layer.

For External Support Channel V0 local/Tailscale validation, the backend HTTP runtime should:

- load exact browser origins from `FLARE_ALLOWED_FRONTEND_ORIGINS`
- publish its reachable callback/API base through `FLARE_PUBLIC_BACKEND_BASE_URL`
- use `GROUPME_OAUTH_REDIRECT_URL` or derive it from `FLARE_PUBLIC_BACKEND_BASE_URL`

The current repo contains the support-channel API package and runtime config loader, but not a committed production HTTP bootstrap. Any local wrapper used for live validation should consume that env contract rather than hard-coding broad CORS or localhost-only callback URLs.
