# Flare

Flare is a mobile-first self-support app scaffold focused on helping a user interrupt an urge, reconnect with their reasons, record a flare event, and reflect afterward.

Flare V0 is not a crisis service, therapy replacement, medical treatment, emergency response system, or guaranteed relapse-prevention tool. If someone may hurt themselves or someone else, or needs immediate help, they should contact local emergency services or a crisis hotline now.

Release positioning and smoke-tested release notes live in `docs/40_delivery/flare_v0_release_positioning.md`.
Known limitations live in `docs/40_delivery/flare_v0_known_limitations.md`.
Production deployment steps and smoke checks live in `docs/40_delivery/flare_v0_production_deployment_checklist.md`.
Launch-gate status for limited external testing lives in `docs/40_delivery/flare_v0_launch_gate_status.md`.

## Current stage

Phase 1 V0 scaffold.

## Stack direction

- Expo
- React Native
- TypeScript
- Expo Router
- Supabase later for auth, data, and edge functions

## Repo shape

- `frontend/`: Expo client, routes, screens, and client-side UI state
- `backend/`: reserved API, domain, persistence, and future integration boundary
- `db/`: reserved migrations and seed material
- `docs/`: durable product, architecture, and delivery guidance

## Local development

1. Install dependencies:

```powershell
npm run install:frontend
```

2. Start the Expo app:

```powershell
npm run dev
```

3. Optional platform targets:

```powershell
npm run web
npm run android
npm run ios
```

## Validation commands

Run these from the repo root:

```powershell
npm run lint
npm run test
npm run typecheck
npm run build
```

If Expo CLI telemetry file writes fail in this shell, run the Expo-backed commands with telemetry disabled:

```powershell
$env:EXPO_NO_TELEMETRY='1'
npm run build
```

## Environment and secrets

- Keep real secrets outside the repo.
- Do not create or commit repo-local `.env` files.
- Use `.env.example` for variable names only.
- Frontend-safe Expo variables are `EXPO_PUBLIC_FLARE_SUPABASE_URL`, `EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL`.
- Server/admin-only Supabase variables must stay outside frontend code: `FLARE_SUPABASE_URL`, `FLARE_SUPABASE_PROJECT_ID`, and `FLARE_SUPABASE_SERVICE_ROLE_KEY`.
- Flare Plan direct Postgres access uses `FLARE_POSTGRES_DSN`. `FLARE_SUPABASE_DB_URL` remains a deprecated backend-only fallback and must not be repurposed to replace the Supabase project URL.
- For local development, load runtime variables from `C:\Users\lukes\.toolbox-secrets\dev-toolbox-starter.env` or from the current process environment before starting Expo.

## Local auth note

- Define `EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL` in your external env file before starting Expo.
- For Tailscale or other mobile web testing, set it to the Expo web URL you are actually using, for example `http://<tailscale-ip>:8081`.
- For the GitHub Pages private-test deployment, set it to `https://lksmoker.github.io/flare/`.
- In the Supabase Dashboard, add the same URL to the allowed Auth redirect URLs.
- If the Supabase project Site URL still points to `http://localhost`, magic links may still send users back to localhost when the redirect URL is missing or not allowed.

## External Support Channel Tailscale Validation

- Frontend support-channel calls use `EXPO_PUBLIC_FLARE_API_BASE_URL`; point it at the backend URL you will open through Tailscale, for example `https://flare-api.tailnet.ts.net:9001`.
- Backend support-channel HTTP runtimes should expose the same public base through `FLARE_PUBLIC_BACKEND_BASE_URL` and restrict browser callers with `FLARE_ALLOWED_FRONTEND_ORIGINS` as a comma-separated exact-origin list.
- The GitHub Pages deployment uses the page URL `https://lksmoker.github.io/flare/` but the browser origin `https://lksmoker.github.io`; add the origin, not the `/flare/` path, to `FLARE_ALLOWED_FRONTEND_ORIGINS`.
- `GROUPME_OAUTH_REDIRECT_URL` should be `https://<backend-host>/api/support-channel/groupme/connect/callback`. If it is omitted, the backend config loader now derives that callback from `FLARE_PUBLIC_BACKEND_BASE_URL`.
- The GroupMe callback bridge returns to the frontend base URL that initiated the connect flow, including the `/flare` project path when using GitHub Pages.
- Detailed setup steps and the live validation checklist live in `docs/40_delivery/flare_external_support_channel_tailscale_validation.md`.

Example backend startup for local/Tailscale validation:

```powershell
python -m backend.app.http.server --host 0.0.0.0 --port 9001
Invoke-WebRequest http://127.0.0.1:9001/api/health
```

Example PowerShell session:

```powershell
Get-Content C:\Users\lukes\.toolbox-secrets\dev-toolbox-starter.env |
  ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $name, $value = $_ -split '=', 2
    Set-Item -Path "Env:$name" -Value $value
  }

npm run dev
```
