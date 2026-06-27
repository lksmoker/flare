# Flare

Flare is a mobile-first recovery-support app scaffold focused on helping a user interrupt a compulsive or high-risk moment with clear recovery prompts and a simple urgent flow.

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
- For local development, load runtime variables from `C:\Users\lukes\.toolbox-secrets\dev-toolbox-starter.env` or from the current process environment before starting Expo.

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
