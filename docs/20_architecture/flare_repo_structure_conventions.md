<!-- @context: { "kind": "architecture.contract", "layer": "docs", "name": "Flare Repo Structure and Conventions", "domains": ["architecture", "governance", "repo-structure"] } -->

# Flare Repo Structure and Conventions

Status: draft
Doc Type: architecture contract
Role: Define the initial repo structure and conventions for Flare V0 before app implementation begins.

## Purpose

This document is the repo structure and conventions contract for Flare V0.

It defines the intended project shape, naming conventions, documentation placement, environment handling, and starter testing boundaries so future implementation work stays organized even before the exact app scaffold is finalized.

## Intended Architecture Shape

Flare V0 should be organized as a modern React-based frontend plus an app/API backend or server layer.

The exact scaffold may still change, but the high-level separation of concerns should remain stable:

- user-facing UI and client state in the frontend/app layer
- request handling, auth/session logic, and API endpoints in the backend/server layer
- domain behavior isolated from transport and rendering concerns
- persistence concerns isolated in database and migration folders
- durable product, design, architecture, research, and delivery docs under `docs/`

The repo should be structured as a real product codebase, not a throwaway prototype. Folder names may shift once the framework is selected, but the architecture boundaries should not collapse into one undifferentiated code surface.

## Proposed Folder Structure

The starter structure below is the expected shape for V0 planning:

```text
docs/
  00_product/
  10_design/
  20_architecture/
  30_research/
  40_delivery/

frontend/ or app/
  src/
    components/
    screens/
    routes/
    services/
    state/
    styles/
    tests/

backend/ or server/
  app/
    api/
    domain/
    services/
    db/
    integrations/
    tests/

db/
  migrations/
  seed/

scripts/
```

Conventions for this structure:

- `docs/` holds durable written guidance and decisions.
- `frontend/` or `app/` holds the React-based user experience.
- `backend/` or `server/` holds API, domain orchestration, persistence access, and future integrations.
- `db/` holds schema migrations and seed material if those are not owned by the chosen backend scaffold.
- `scripts/` holds explicit developer or operational scripts only when they have a clear purpose.

Final top-level folder names may be adjusted after scaffold selection, but the separation between UI, server/application logic, database concerns, and durable docs should remain stable.

## Domain Naming Conventions

Use these initial domain terms consistently across docs, routes, services, schema, and UI copy:

- `User`
- `Flare Profile`
- `Behavior Pattern`
- `Anchor Note`
- `Flare Event`
- `Recovery Action`
- `Checkpoint` / `Reflection`
- `Support Channel` later
- `Support Contact` / `Group` later

Conventions for usage:

- Prefer explicit domain names over invented synonyms.
- Keep `Send Flare` as the user-facing primary action label.
- Treat `Anchor Note` as a first-class concept, not an optional helper artifact hidden inside generic profile data.
- Reserve support-oriented terms for later phases unless a document is explicitly discussing V1 or beyond.

## File Naming Conventions

- Prefer lowercase snake_case for durable documentation files.
- Prefer clear component names for UI files such as `SendFlareButton` or `AnchorNoteSetupModal`.
- Prefer explicit service or domain names such as `flare_event_service` over generic names such as `helpers` or `misc`.
- Avoid vague files such as `utils.js` unless the scope is tight, obvious, and local to one area.
- Name files after the domain behavior they own, not after temporary implementation details.

## Documentation Conventions

- Product docs live in `docs/00_product`.
- Design and user-flow docs live in `docs/10_design`.
- Architecture decisions and contracts live in `docs/20_architecture`.
- Research notes live in `docs/30_research`.
- Delivery and build plans live in `docs/40_delivery`.
- Each durable doc should include `Status`, `Doc Type`, and `Role` near the top.

When a doc becomes a durable source of truth for future implementation, keep it concise, explicit, and named for the decision or contract it owns.

## Lightweight `@context` Header Conventions

Flare V0 adopts a lightweight `@context` header convention for durable Markdown documentation files under `docs/`.

This convention is intentionally narrow for scaffold work:

- It applies to durable Markdown documentation files under `docs/`.
- It does not yet require source files to carry file-level `@context` headers.
- Source files may adopt broader file-level governance later, but that is outside Flare V0 scaffold scope.

Required base fields for Flare V0 documentation headers:

- `kind`
- `layer`
- `name`
- `domains`

Expected Markdown placement and format:

- The header should be a leading HTML comment block.
- It should be the first logical content in the file.
- The payload inside the comment should be valid JSON.

Expected shape:

```markdown
<!-- @context: { "kind": "example.kind", "layer": "docs", "name": "Human Readable Name", "domains": ["domain-a", "domain-b"] } -->
```

Example headers by durable doc type:

Product doc:

```markdown
<!-- @context: { "kind": "product.brief", "layer": "docs", "name": "Flare Vision Direction", "domains": ["product", "recovery", "behavior-change"] } -->
```

Design doc:

```markdown
<!-- @context: { "kind": "design.spec", "layer": "docs", "name": "Flare Recovery Flow Design", "domains": ["design", "ux", "recovery-flow"] } -->
```

Architecture contract:

```markdown
<!-- @context: { "kind": "architecture.contract", "layer": "docs", "name": "Flare Repo Structure and Conventions", "domains": ["architecture", "governance", "repo-structure"] } -->
```

Research note:

```markdown
<!-- @context: { "kind": "research.note", "layer": "docs", "name": "Recovery Prompt Research Notes", "domains": ["research", "recovery", "prompts"] } -->
```

Delivery or build plan:

```markdown
<!-- @context: { "kind": "delivery.plan", "layer": "docs", "name": "Flare V0 Build Plan", "domains": ["delivery", "v0", "planning"] } -->
```

AI task-summary archive artifact:

```markdown
<!-- @context: { "kind": "archive.task_summary", "layer": "docs", "name": "Initial Flare V0 App Scaffold Run Summary", "domains": ["archive", "ai-run", "scaffold"] } -->
```

Agent handling guidance:

- Codex and other agents should preserve existing `@context` headers unless a task explicitly requires changing them.
- Codex and other agents should avoid whole-document rewrites when a targeted section edit is sufficient.
- When adding a new durable Markdown doc under `docs/`, include a lightweight `@context` header when the file is intended to remain a durable reference.

## Environment and Secrets Conventions

- Do not commit local `.env` files.
- Use `.env.example` only to document expected variable names, never real secret values.
- Keep real secrets outside the repo.
- For local development, the external secrets file is `C:\Users\lukes\.toolbox-secrets\dev-toolbox-starter.env`.
- Flare should read local runtime configuration from that external file or from process environment variables, not from repo-local `.env` files.
- Production secrets should be managed in deployment provider settings.
- Do not copy secret values into docs, scripts, commits, or sample files.

The expected local development pattern is:

1. Load environment variables from the external secrets file or from the current process environment.
2. Pass those variables into the selected frontend/backend runtime.
3. Keep repo-tracked examples limited to variable names and brief descriptions.

## Testing Conventions

- Unit tests should sit near the code they verify or in a clear local `tests/` folder.
- Domain behavior should be tested separately from UI rendering where practical.
- API or server behavior should be testable without requiring the full UI.
- UI tests should focus on user-visible behavior in the urgent moment, not only component internals.
- V0 smoke tests should cover the full loop: behavior setup -> Anchor Note setup -> Send Flare -> flare response -> checkpoint/history.

Testing should stay proportional to V0 scope, but the core loop must remain verifiable end to end.

## Implementation Principles

- Keep the urgent `Send Flare` moment simple.
- Keep `Anchor Note` first-class.
- Keep V0 solo-user first.
- Do not prematurely build Telegram or support-group features.
- Avoid overengineering before the core loop is proven.

When in doubt, choose the structure that makes the V0 interruption-and-recovery loop easier to build, test, and change.

## Open Decisions

These decisions remain intentionally open at the repo-structure stage:

- exact framework scaffold
- exact backend/server layout
- exact deployment target
- exact auth/database provider
- whether frontend and backend live as separate top-level folders or a unified app structure

These can be resolved later without changing the separation-of-concerns rules defined in this document.

