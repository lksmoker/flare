<!-- @context: { "kind": "architecture.contract", "layer": "docs", "name": "Flare V0 Data and Persistence Contract", "domains": ["architecture", "data-model", "persistence", "privacy", "v0"] } -->

# Flare V0 Data and Persistence Contract

Status: draft
Doc Type: architecture contract
Role: Define the durable V0 domain model, persistence boundaries, and privacy constraints before Flare implements storage.

## Purpose

This document defines the V0 data and persistence contract for Flare.

It exists to keep future storage work aligned with the product and navigation contracts while preventing accidental mixing of:

- transient UI state
- durable user data
- sensitive recovery content
- offline/PWA caching behavior
- future support-channel features

This is a documentation and architecture contract only. It does not implement persistence, auth, backend behavior, local storage, AsyncStorage, Supabase tables, Telegram flows, or analytics.

## Governing Inputs

This contract is shaped by:

- `docs/10_design/flare_v0_app_structure_navigation.md`
- `docs/20_architecture/flare_repo_structure_conventions.md`
- `docs/20_architecture/flare_stack_decision.md`
- `docs/40_delivery/flare_v0_build_plan.md`
- product vocabulary under `docs/00_product/`

When implementation begins, lower-level schema and API work must conform to this contract unless this document is deliberately revised first.

## Scope

This contract covers:

- the durable V0 domain entities
- snapshot versus live-reference rules
- local/in-memory versus durable responsibilities
- privacy and sensitivity expectations
- persistence non-goals for V0
- migration readiness from the current local-only app state
- minimal acceptance criteria for future durable storage work

This contract does not define:

- a concrete database schema
- API payloads
- auth/session implementation
- offline sync algorithms
- Telegram integration behavior
- analytics models

## Domain Boundaries

Flare V0 is a solo-user product centered on one urgent recovery loop:

1. define a `BehaviorPattern`
2. define `AnchorNote`
3. create a `FlareEvent` with `Send Flare`
4. surface recovery support
5. optionally attach a `CheckpointReflection`

Future support and messaging concepts remain explicitly outside that V0 loop even if they are named here for boundary clarity.

## Entity Overview

### V0 Durable Entities

- `BehaviorPattern`
- `AnchorNote`
- `FlareEvent`
- `CheckpointReflection`

### Future-Scoped Entities

- `SupportChannel`
- `SupportContact`
- `SupportGroup`
- Telegram-related setup and connection artifacts

Future-scoped entities are intentionally separated so V0 persistence does not create premature support-network coupling.

## Shared Modeling Rules

The following rules apply across V0 durable entities:

- Every durable entity should have a stable opaque `id`.
- Every durable entity should record `createdAt` and `updatedAt`.
- User-owned records should be attributable to exactly one user once auth exists.
- Freeform text fields may contain sensitive personal content and must be treated accordingly.
- Product meaning should not depend on mutable display labels alone.
- Derived display summaries may exist later, but the source record should remain explicit.

## V0 Entity Contracts

### `BehaviorPattern`

### Purpose

Represents the behavior, craving, spiral, or risk pattern the user wants to interrupt.

It is configuration authored while relatively clear-minded, not an urgent-moment event record.

### Required Fields

- `id`
- `createdAt`
- `updatedAt`
- `label`
  - the plain-language name of the pattern, such as `YouTube spiral`
- `status`
  - recommended V0 values: `active`, `archived`

### Optional Fields

- `description`
- `commonTriggers`
  - user-authored trigger list or notes
- `riskTimesOrSituations`
- `preferredRecoveryActions`
  - user-authored action ideas or replacements
- `isPrimary`
  - only if V0 later supports more than one pattern
- `archivedAt`

### Relationships

- One user may own one or more `BehaviorPattern` records in future persisted V0.
- One `BehaviorPattern` may be referenced by many `FlareEvent` records.

### Lifecycle

- `active`: selectable for future flares
- `archived`: not selectable for new flares but retained for history integrity

### Snapshot vs Live Reference

`FlareEvent` must not depend only on a live mutable pointer to `BehaviorPattern`.

Each `FlareEvent` should retain a behavior snapshot sufficient to preserve historical meaning if the user later edits or archives the pattern. The minimum expected snapshot is:

- `behaviorPatternId` when available
- `behaviorLabelSnapshot`
- optional short `behaviorDescriptionSnapshot`

Trigger lists and recovery-action lists do not need to be fully duplicated into every event unless the product later proves that history needs them.

### `AnchorNote`

### Purpose

Represents the user's clear-minded recovery content that should be available during a flare.

This is a first-class durable concept, not a generic note blob hidden under profile data.

### Required Fields

- `id`
- `createdAt`
- `updatedAt`
- `status`
  - recommended V0 values: `active`, `archived`

At least one of the content-bearing fields below should be present before a record is considered meaningfully configured.

### Optional Fields

- `reasonsToInterrupt`
- `costsOfContinuing`
- `groundedSelfReminder`
- `emergencyActions`
- `supportivePhrase`
- `futureSelfMessage`
- `notes`
- `version`
  - monotonic revision marker once persistence exists
- `archivedAt`

### Relationships

- One user may own one or more `AnchorNote` records in future persisted V0, though the product may expose only one active note at first.
- One `AnchorNote` may be used by many `FlareEvent` records.

### Lifecycle

- `active`: available to current recovery flows
- `archived`: retained for audit/history but not used for new flares

### Snapshot vs Live Reference

`FlareEvent` may reference the current `AnchorNote`, but V0 should avoid unnecessary duplication of full recovery text into every event because this content is highly sensitive.

Recommended V0 baseline:

- persist `anchorNoteId` when an anchor note was available
- persist an `anchorNoteVersion` or equivalent revision marker when available
- do not require full-text anchor-note snapshots per event
- if SQL tables are introduced later, map this entity toward `anchor_notes` rather than legacy `recovery_memories` naming

If future product behavior needs event-level proof of exactly what the user saw, prefer a minimal displayed-content snapshot over storing the entire recovery record. Any such snapshot should be narrowly scoped to the content intentionally surfaced during that flare.

### `FlareEvent`

### Purpose

Represents a single `Send Flare` occurrence and the beginning of the urgent recovery flow.

This is the central historical event in V0.

### Required Fields

- `id`
- `createdAt`
- `status`
  - recommended V0 values: `active`, `reflected`, `closed`
- `behaviorLabelSnapshot`
  - if a behavior pattern exists at flare time

### Optional Fields

- `updatedAt`
- `behaviorPatternId`
- `behaviorDescriptionSnapshot`
- `anchorNoteId`
- `anchorNoteVersion`
- `recoveryActionShown`
- `recoveryActionTaken`
- `responseMode`
  - for example `configured` or `fallback-generic`
- `closedAt`
- `checkpointReflectionId`
- `notePreview`
  - only if later needed for list rendering, and only if privacy review approves it

### Relationships

- Many `FlareEvent` records may reference one `BehaviorPattern`.
- Many `FlareEvent` records may reference one `AnchorNote`.
- One `FlareEvent` may have zero or one `CheckpointReflection`.

### Lifecycle

- `active`: flare created and recovery flow started
- `reflected`: a checkpoint/reflection was recorded
- `closed`: the event is considered complete even if no reflection exists

Implementations may add internal workflow states later, but these V0 user-meaningful states should remain understandable.

### Snapshot vs Live Reference

`FlareEvent` is a durable historical record and should preserve the meaning of the moment even if related setup data changes later.

Required snapshot expectations:

- behavior identity should be historically reconstructable from event-local snapshot fields
- anchor-note linkage should preserve which note version supported the flare when that information is available

Not required in V0:

- full copy of all anchor-note text
- full trigger taxonomy snapshot
- support-contact or Telegram data

### `CheckpointReflection`

### Purpose

Represents lightweight post-event reflection attached to a `FlareEvent`.

It is optional and should stay quick enough to complete after a difficult moment.

### Required Fields

- `id`
- `createdAt`
- `flareEventId`

### Optional Fields

- `updatedAt`
- `whatHappened`
- `whatHelped`
- `howIFeelNow`
- `outcome`
  - recommended V0 values may include `avoided`, `delayed`, `reduced`, `continued`, `unclear`
- `actionTaken`
- `note`

### Relationships

- Each `CheckpointReflection` belongs to exactly one `FlareEvent`.
- Each `FlareEvent` may have at most one V0 `CheckpointReflection` unless the product later explicitly adopts multi-checkpoint flows.

### Lifecycle

V0 does not require a rich status model for `CheckpointReflection`.

If an explicit lifecycle is needed later, `draft` and `submitted` are sufficient starting states. Draft handling may remain purely local until durable save behavior is implemented.

### Snapshot vs Live Reference

`CheckpointReflection` is authored after the flare and is itself the authoritative record. It does not need snapshot copies of other entities beyond its explicit link to `FlareEvent`.

If list rendering later needs a behavior label next to reflections, prefer reading that through the related `FlareEvent` snapshot rather than duplicating more text into the reflection row.

## Future-Scoped Entity Boundaries

The entities below are intentionally defined separately. They may shape future schema planning, but they are not V0 persistence requirements.

### `SupportChannel`

### Purpose

Represents a configured support medium such as Telegram, SMS, email, or another future transport.

### V0 Boundary

- no real persistence required in V0
- no runtime coupling to `Send Flare`
- no outbound delivery behavior

### Likely Future Fields

- `id`
- `type`
  - example future values: `telegram`, `sms`, `email`
- `status`
  - example future values: `not_connected`, `connected`, `paused`, `revoked`
- `displayName`
- `connectionMetadata`

### `SupportContact`

### Purpose

Represents a trusted person the user may contact or notify in a later version.

### V0 Boundary

- no persistence required in V0
- no message template binding required in V0
- no relationship to `FlareEvent` required in V0

### Likely Future Fields

- `id`
- `supportChannelId`
- `displayName`
- `externalHandle`
- `contactStatus`

### `SupportGroup`

### Purpose

Represents a trusted group or shared support destination in a later version.

### V0 Boundary

- no persistence required in V0
- no group membership model required in V0
- no message-routing behavior required in V0

### Likely Future Fields

- `id`
- `supportChannelId`
- `displayName`
- `externalGroupHandle`
- `groupStatus`

## Telegram-Related Setup

Telegram-related setup is future-scoped and should remain separate from V0 durable entities.

Do not model Telegram setup as hidden optional fields on `BehaviorPattern`, `AnchorNote`, or `FlareEvent`.

Future Telegram persistence may later require distinct artifacts such as:

- channel connection record
- external chat or group reference
- user consent flags
- message template drafts
- escalation preferences
- delivery attempts or audit records

None of those artifacts are required for V0 persistence.

## Local / In-Memory State vs Durable Persistence

The current app uses local or in-memory V0 state. That is acceptable until persistence is intentionally implemented.

### Local / In-Memory Responsibilities

Local or in-memory state should own:

- active screen state
- modal or sheet open/close state
- unsaved form drafts
- temporary validation errors
- currently displayed recovery flow state
- ephemeral timers or countdown UI
- non-durable first-run hints
- temporary reflection drafts before explicit save

### Durable Persistence Responsibilities

Durable persistence should own:

- saved `BehaviorPattern` records
- saved `AnchorNote` records
- created `FlareEvent` history
- saved `CheckpointReflection` records
- archived versus active status for durable records
- revision/version markers needed to preserve event meaning

### Boundary Rules

- Do not treat every React or screen-state value as a persistence requirement.
- Do not silently persist partial drafts unless the product explicitly decides to do so.
- `Send Flare` should create a durable event only when persistence is intentionally enabled, not merely because UI state changed.
- A saved reflection should result from explicit user action, not from opening the checkpoint UI.

## Privacy and Sensitivity Expectations

`BehaviorPattern`, `AnchorNote`, `FlareEvent`, and `CheckpointReflection` may all contain sensitive personal content.

Examples include:

- relapse or compulsion details
- emotional state
- habit triggers
- self-authored recovery language
- notes about what happened in a vulnerable moment

### Required Privacy Posture

- Collect only data needed for the V0 product loop.
- Avoid duplicating sensitive text across entities unless history meaning truly requires it.
- Do not log raw recovery content, reflection content, or freeform user notes unnecessarily.
- Do not include anchor-note text or reflection text in telemetry.
- Treat debug logging of user-authored content as a defect unless there is an explicit, justified safe-development exception.

### Telemetry Guidance

Telemetry, if added later, should prefer non-content metadata such as:

- event created
- reflection saved
- setup completed
- generic status transitions

Telemetry should not capture:

- full behavior descriptions
- full anchor-note text
- reflection note bodies
- trigger lists
- costs, reminders, or supportive phrases in raw form

### PWA / Offline / Cache Guidance

Flare is mobile-first, but offline storage decisions must be treated carefully because the app may contain highly sensitive content.

Until an explicit privacy review and storage design exist:

- do not assume browser caches, service-worker caches, or offline storage are acceptable for sensitive payloads
- do not cache sensitive API responses broadly for convenience
- do not make content-bearing records publicly cacheable

If offline capability is later added, the implementation should specify:

- which records are stored locally
- whether local storage is encrypted or otherwise protected
- how sign-out or device change clears cached content
- whether reflection drafts are local-only until explicit submission

## Data Deletion and Export Expectations

Because Flare records may contain sensitive recovery content, future persistence work should define how a user can delete stored records and, if applicable, export their own data.

V0 does not need to implement full export behavior before persistence exists, but durable storage work should not proceed without an explicit deletion path for user-authored content.

Open decisions:

- whether deletion is hard delete or soft/archive for each entity
- whether event history can be deleted independently from setup records
- whether export is required in V0 or deferred
- how locally cached/offline records are cleared

## V0 Persistence Non-Goals

V0 persistence should explicitly avoid:

- real Telegram persistence
- support contact persistence
- support group persistence
- analytics-heavy history models
- clinical scoring
- diagnosis-oriented data models
- multi-user or social graph modeling
- delivery-attempt audit logs for support messaging
- community, sponsor, or peer-network schemas

The goal is a durable solo-user recovery loop, not a generalized support-platform schema.

## Persistence Options and Provider Direction

This contract does not force a concrete implementation, but it should remain compatible with plausible future storage approaches.

### Current Direction from Existing Architecture Docs

`docs/20_architecture/flare_stack_decision.md` currently points to a Supabase-first backend with auth, Postgres, RLS, and future edge-function support.

That direction should be treated as the current default for cloud persistence planning unless the architecture docs change.

### High-Level Options the Contract Should Tolerate

- Supabase/Postgres as the primary durable store
- a backend API layer that mediates writes and reads for sensitive content
- limited device-local persistence for drafts or offline support later
- future export/import or backup flows

The entity boundaries in this contract should remain stable even if the exact storage engine, API shape, or sync strategy evolves.

## Migration and Readiness Guidance

The current app state is local and in-memory. Future persistence work should migrate from that state deliberately rather than by leaking component structure into schema design.

### Readiness Guidance

- Keep domain state shapes separate from view-only state.
- Use explicit domain names in code and storage design: `BehaviorPattern`, `AnchorNote`, `FlareEvent`, `CheckpointReflection`.
- Introduce stable ids before relying on durable lists or editing flows.
- Add revision markers where future snapshots depend on historical meaning.
- Preserve the difference between active setup records and event history.

### Migration Guidance

When persistent storage is introduced later:

1. Map the current local setup forms into explicit `BehaviorPattern` and `AnchorNote` save operations.
2. Ensure `Send Flare` creates a `FlareEvent` record with a behavior snapshot rather than only a mutable pointer.
3. Keep reflection save separate from flare creation so unfinished reflections do not appear as completed history.
4. Decide explicitly whether device-local drafts exist before implementing autosave behavior.
5. Add privacy-safe logging and telemetry boundaries before storing sensitive text.
6. Add mobile/offline handling only after storage-clearance behavior and cache boundaries are defined.

### Anti-Patterns to Avoid

- deriving database tables directly from component names
- storing the full screen state as one generic JSON blob
- mixing Telegram setup fields into V0 recovery entities
- duplicating full anchor-note text into every flare event by default
- persisting reflection drafts without explicit product intent

## Minimal Acceptance Criteria for Future Durable Storage

Future persistence work is aligned with this contract when:

- the four V0 entities exist as distinct durable concepts
- `BehaviorPattern`, `AnchorNote`, `FlareEvent`, and `CheckpointReflection` are not collapsed into one generic record type
- `FlareEvent` preserves historical meaning through required behavior snapshot fields
- `CheckpointReflection` is optional and linked to a `FlareEvent`
- recovery content is stored with privacy-aware boundaries and is excluded from telemetry payloads
- V0 persistence does not include real Telegram, support-contact, or support-group data
- local UI state and unsaved drafts are not silently treated as durable product records
- the implementation defines how active versus archived durable records behave
- mobile/offline caching decisions for sensitive content are explicit rather than implicit

## Validation Expectations for Future Implementation

When durable storage is later implemented, validation should include more than schema creation.

Minimum expected validation:

- save and reload a `BehaviorPattern`
- save and reload a `AnchorNote`
- create a `FlareEvent` and confirm its behavior snapshot remains meaningful after the source `BehaviorPattern` is edited
- save a `CheckpointReflection` and confirm it remains linked to the correct `FlareEvent`
- verify sensitive content is not emitted through telemetry or unnecessary logs
- verify logout, cache-clear, or equivalent privacy boundaries once auth and offline behavior exist

## Open Decisions

These decisions remain intentionally open for later implementation slices:

- whether V0 persists one active `BehaviorPattern` or multiple patterns
- whether V0 persists one active `AnchorNote` or multiple revisions surfaced in UI
- whether event detail views need a minimal displayed-content snapshot from `AnchorNote`
- whether local encrypted draft storage is needed for offline resilience
- whether future cloud writes are direct-to-provider or mediated by a backend API layer
- hard-delete versus soft-delete/archive behavior for each durable entity
- whether event history can be deleted independently from setup records
- whether user data export is required in V0 or deferred
- how locally cached/offline records are cleared when deletion or sign-out exists

Those decisions can be resolved later without collapsing the entity boundaries defined here.


