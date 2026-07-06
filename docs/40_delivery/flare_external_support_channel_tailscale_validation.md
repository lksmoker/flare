Status: draft
Doc Type: delivery note
Role: Local and Tailscale runtime setup for External Support Channel V0 live validation.

# External Support Channel Tailscale Validation

This note covers the local/Tailscale runtime contract for validating External Support Channel V0 before any production backend host is chosen.

## Runtime contract

Frontend:

- `EXPO_PUBLIC_FLARE_API_BASE_URL`
  - Purpose: Browser/mobile client base URL for support-channel backend calls.
  - Example: `https://flare-api.tailnet.ts.net:9001`
- `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL`
  - Purpose: Supabase Auth redirect for the Expo web URL the tester actually opens.
  - Example: `http://100.64.0.10:8081`
- `EXPO_PUBLIC_FLARE_SUPABASE_URL`
  - Purpose: Public Supabase project URL used by the frontend auth/data client.
- `EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY`
  - Purpose: Public Supabase anon key used by the frontend auth/data client.

Backend:

- `FLARE_ALLOWED_FRONTEND_ORIGINS`
  - Purpose: Exact browser origins allowed to call backend support-channel routes.
  - Format: comma-separated full origins only, no wildcard.
  - Example: `http://100.64.0.10:8081,https://flare-web.tailnet.ts.net`
- `FLARE_PUBLIC_BACKEND_BASE_URL`
  - Purpose: Public URL the frontend and GroupMe callback should use for the backend.
  - Example: `https://flare-api.tailnet.ts.net:9001`
- `FLARE_SUPABASE_URL`
  - Purpose: Backend/admin Supabase base URL for support-channel persistence.
- `FLARE_SUPABASE_SERVICE_ROLE_KEY`
  - Purpose: Backend/admin service-role key for support-channel persistence.

GroupMe:

- `GROUPME_OAUTH_CLIENT_ID`
  - Purpose: GroupMe OAuth client id for the connect flow.
- `GROUPME_OAUTH_REDIRECT_URL`
  - Purpose: GroupMe OAuth callback URL.
  - Expected value: `https://<backend-host>/api/support-channel/groupme/connect/callback`
  - Note: If this env var is omitted, the backend config loader derives it from `FLARE_PUBLIC_BACKEND_BASE_URL`.
- `GROUPME_BOT_NAME`
  - Purpose: Display name used when provisioning the GroupMe bot.
- `GROUPME_BOT_CALLBACK_URL`
  - Purpose: Optional provider-side callback URL for GroupMe bot configuration.
- `GROUPME_BOT_AVATAR_URL`
  - Purpose: Optional provider-side avatar URL for GroupMe bot configuration.
- `GROUPME_TEST_GROUP_ID`
- `GROUPME_TEST_GROUP_NAME`
- `GROUPME_TEST_BOT_ID`
  - Purpose: Existing dedicated test-send runtime values for direct backend validation scripts.

## Example local/Tailscale env shape

```powershell
$env:EXPO_PUBLIC_FLARE_SUPABASE_URL="https://<project>.supabase.co"
$env:EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY="<frontend-anon-key>"
$env:EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL="http://100.64.0.10:8081"
$env:EXPO_PUBLIC_FLARE_API_BASE_URL="https://flare-api.tailnet.ts.net:9001"

$env:FLARE_ALLOWED_FRONTEND_ORIGINS="http://100.64.0.10:8081,https://flare-web.tailnet.ts.net"
$env:FLARE_PUBLIC_BACKEND_BASE_URL="https://flare-api.tailnet.ts.net:9001"
$env:FLARE_SUPABASE_URL="https://<project>.supabase.co"
$env:FLARE_SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"

$env:GROUPME_OAUTH_CLIENT_ID="<groupme-client-id>"
$env:GROUPME_OAUTH_REDIRECT_URL="https://flare-api.tailnet.ts.net:9001/api/support-channel/groupme/connect/callback"
$env:GROUPME_BOT_NAME="Flare Support Bot"
```

## Run shape

Backend:

- Start the backend HTTP runtime on a host/port reachable through Tailscale.
- Bind to a reachable interface such as `0.0.0.0` rather than `127.0.0.1` if another device on the tailnet will open it.
- Keep CORS exact: use only the Expo web/Tailscale origins you will actually browse from in `FLARE_ALLOWED_FRONTEND_ORIGINS`.
- Publish the same backend URL through `FLARE_PUBLIC_BACKEND_BASE_URL` and `EXPO_PUBLIC_FLARE_API_BASE_URL`.
- Canonical startup command:

```powershell
python -m backend.app.http.server --host 0.0.0.0 --port 9001
```

- Lightweight startup check:

```powershell
Invoke-WebRequest http://127.0.0.1:9001/api/health
```

Frontend:

- Start Expo web on a host/port reachable through Tailscale.
- Open the frontend through the same origin you placed in `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL` and `FLARE_ALLOWED_FRONTEND_ORIGINS`.
- If Supabase login is part of the test, add that same frontend origin to the Supabase allowed redirect URLs.

GroupMe callback:

- Configure the GroupMe OAuth app callback URL to match `GROUPME_OAUTH_REDIRECT_URL` exactly.
- For Tailscale validation, that means the callback should use the backend Tailscale URL, not the frontend URL.
- The backend callback route now serves a small bridge page that reads the GroupMe OAuth fragment and redirects back to `/customize` on the allowed frontend origin that started the connect flow.

## Live validation checklist

1. Load frontend and backend env vars from your external secret store.
2. Start the backend HTTP runtime on a Tailscale-reachable host/port.
3. Start Expo web on a Tailscale-reachable host/port.
4. Open the frontend through Tailscale.
5. Sign in.
6. Open Customize -> Support Group.
7. Press Connect GroupMe.
8. Complete the GroupMe OAuth callback back to the backend Tailscale URL.
9. Confirm the frontend returns to setup and lists GroupMe groups.
10. Select the intended test group and save it.
11. Press Send test flare and confirm the GroupMe test message arrives.
12. Press real Send Flare and confirm the real support message arrives.
13. Verify the related `support_channel_delivery_attempts` rows and the current `support_channels.last_delivery_*` fields.

## Known blocker

If GroupMe rejects the callback because the URL is private or not publicly reachable over HTTPS, Tailscale-only validation is blocked at OAuth callback time. In that case, keep the frontend/backend runtime the same and expose only the backend callback through one of these options:

- Tailscale Funnel
- ngrok
- Cloudflare Tunnel
- a small temporary backend host with HTTPS

Do not move provider secrets, access tokens, bot ids, or `provider_config_ref` internals into the frontend as a workaround.
