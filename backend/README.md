Status: draft
Doc Type: implementation note
Role: Reserve the backend boundary for future API, domain, and integration work.

This scaffold keeps backend concerns out of the Expo client. Future server-side work should stay under `backend/app/` and avoid leaking transport or persistence logic into the mobile UI layer.

For External Support Channel V0 local/Tailscale validation, the backend HTTP runtime should:

- load exact browser origins from `FLARE_ALLOWED_FRONTEND_ORIGINS`
- publish its reachable callback/API base through `FLARE_PUBLIC_BACKEND_BASE_URL`
- use `GROUPME_OAUTH_REDIRECT_URL` or derive it from `FLARE_PUBLIC_BACKEND_BASE_URL`

The repo now includes a committed stdlib HTTP bootstrap for that contract:

```powershell
python -m backend.app.http.server --host 0.0.0.0 --port 9001
```

Runtime notes:

- CORS stays exact and fail-closed: only origins listed in `FLARE_ALLOWED_FRONTEND_ORIGINS` receive browser access, and `*` is rejected.
- The health probe is `GET /api/health`.
- GroupMe callback setup should point to `https://<backend-host>:<port>/api/support-channel/groupme/connect/callback`.
- The callback bridge redirects the browser back to `/customize` on the allowed frontend origin that initiated the connect flow.
