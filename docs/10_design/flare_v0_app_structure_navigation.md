<!--
@context: {
  "kind": "design.contract",
  "layer": "docs",
  "name": "Flare V0 App Structure and Navigation",
  "domains": ["design", "navigation", "v0", "recovery", "mobile"]
}
-->

# Flare V0 App Structure and Navigation

## Status

* status: draft
* doc type: design contract
* role: Defines the V0 app structure, top-level navigation, screen responsibilities, and urgent Send Flare flow before product behavior implementation.
* last reviewed: 2026-06-27

---

## Purpose

This document defines the V0 app structure and navigation contract for Flare.

Flare is centered on one urgent user need: helping a user interrupt a behavior pattern, craving, spiral, or high-risk moment quickly enough to choose a recovery action.

The app structure should therefore keep the urgent `Send Flare` action as the emotional and functional center of the product. Setup, customization, history, and reflection should support that moment without competing with it.

---

## Navigation Contract

V0 top-level navigation should use three primary destinations:

```text
Flare | History | Customize
```

These labels are the canonical V0 navigation labels.

### Top-Level Destinations

| Destination | Role                                                                         |
| ----------- | ---------------------------------------------------------------------------- |
| `Flare`     | Primary urgent action surface. Home of `Send Flare`.                         |
| `History`   | Review past Flare Events, checkpoints, and reflections.                      |
| `Customize` | Configure the behavior pattern, Anchor Note, and future support options. |

### Navigation Principles

* Keep the app simple enough to use during an urgent moment.
* Do not make setup screens compete with the urgent action as top-level destinations.
* Keep the number of top-level destinations low.
* Prefer modal or sheet flows for secondary actions.
* Avoid burying `Send Flare` behind menus, confirmation steps, or setup flows.
* Treat `Flare` as the primary screen, not a generic home screen.

---

## App Header

The app should include a simple persistent header.

### Header Responsibilities

The header should provide:

* app title: `Flare`
* navigation/menu button or equivalent mobile navigation control
* enough orientation for the user to understand where they are

### Header Non-Responsibilities

The header should not become:

* a dense settings surface
* a notification center
* a dashboard
* a place for urgent recovery content
* a substitute for the primary `Send Flare` surface

---

## Flare Screen

The `Flare` screen is the primary screen of the app.

It owns the urgent interruption moment.

### Primary Action

The primary action is:

```text
Send Flare
```

The `Send Flare` button should be visually and functionally dominant.

### Send Flare Behavior

In V0, `Send Flare` should be immediate.

There should be no confirmation step before entering the recovery experience.

Expected design flow:

```text
User taps Send Flare
→ Flare Event starts
→ Flare Response opens immediately
→ User sees Anchor Note and recovery actions
→ User can continue to checkpoint/reflection when ready
```

### Why No Confirmation

The `Send Flare` moment is analogous to an emergency brake.

The user may be in a craving, spiral, compulsion, or high-risk moment. Additional confirmation creates friction at exactly the wrong time.

The app should assume that tapping `Send Flare` is intentional enough and should immediately help the user shift state.

### Secondary Actions

The `Flare` screen may include:

* `Checkpoint / Reflection` button
* small readiness/status indicators
* brief cues about configured recovery support

`Checkpoint / Reflection` should be secondary to `Send Flare` and should likely open as a modal or sheet.

### First-Use Setup Mode

When the required saved-support setup is incomplete, the `Flare` screen should temporarily behave like a guided setup surface instead of an operational recovery surface.

In that state:

* replace the dominant `Send Flare` hero with one setup-focused hero
* keep one obvious primary action that takes the user to the next setup task
* keep readiness visible but visually secondary
* keep detailed setup editing inside `Customize`
* return to the standard `Send Flare` hero once required setup is complete

The required setup order for V0 is:

```text
Behavior Pattern
→ Flare Plan
→ Anchor Note
```

`Support Group` remains visible as readiness progress, but does not block the return to the configured `Send Flare` experience in V0.

### Readiness Indicators

The `Flare` screen may show lightweight readiness indicators such as:

* Behavior Pattern configured
* Anchor Note configured
* Telegram Support not active / coming later

These indicators should be small and supportive. They should not clutter the urgent action surface.

### Flare Screen Responsibilities

The `Flare` screen owns:

* urgent entry into the recovery flow
* immediate access to `Send Flare`
* lightweight checkpoint/reflection entry
* lightweight setup readiness awareness

### Flare Screen Non-Responsibilities

The `Flare` screen does not own:

* long setup forms
* detailed history browsing
* analytics or trends
* Telegram configuration
* account or profile management
* dense settings

---

## Flare Response Experience

The Flare Response experience begins immediately after `Send Flare`.

This may be implemented as a dedicated screen, modal, route, or focused recovery state, but it should feel immediate and interruptive.

### Flare Response Responsibilities

Flare Response owns:

* presenting the user’s Anchor Note
* presenting clear recovery actions
* helping the user create distance from the behavior pattern
* giving the user a next safe step
* offering a path into checkpoint/reflection when appropriate

### Flare Response Non-Responsibilities

Flare Response does not own:

* editing the full Anchor Note
* configuring Telegram support
* historical analysis
* long-form journaling by default
* account management

### Flare Response Design Principles

* Keep copy short and direct.
* Prefer action over explanation.
* Make the next step obvious.
* Support the user without shaming them.
* Keep the experience useful even when the user has not fully configured every setup field.

---

## Checkpoint / Reflection Flow

`Checkpoint / Reflection` is a secondary flow.

It should likely open as a modal or sheet from the `Flare` screen or from the Flare Response experience.

### Checkpoint / Reflection Responsibilities

Checkpoint / Reflection owns:

* capturing how the user is doing after a Flare Event
* recording what action they took
* recording whether the urge, spiral, or risk moment changed
* optionally capturing a short note
* supporting later review in History

### Checkpoint / Reflection Non-Responsibilities

Checkpoint / Reflection does not own:

* primary emergency interruption
* Anchor Note setup
* Behavior Pattern setup
* Telegram setup
* trend analysis in V0

### V0 Reflection Shape

V0 reflection should be lightweight.

Possible fields:

* what happened
* what helped
* how the user feels now
* whether they avoided, delayed, reduced, or continued the behavior
* optional freeform note

This should remain quick enough to complete after an emotionally difficult moment.

---

## History Screen

The `History` screen owns review of past activity.

### History Responsibilities

History owns:

* past Flare Events
* past Checkpoints / Reflections
* simple chronological review
* basic event details

### V0 History Shape

V0 History should start as a simple list.

Each item may show:

* date/time
* behavior pattern label
* whether a checkpoint/reflection exists
* brief outcome/status
* optional note preview

V0 History may also include lightweight search and archive-aware filters so the
default view stays focused on non-archived events while older events remain
restorable from an archived view.

### History Non-Responsibilities

History does not own:

* heavy analytics
* complex charts
* streak systems
* social comparison
* clinical interpretation
* advanced filtering

Trends and analytics may be considered later, but they are not required for V0.

---

## Customize Screen

The `Customize` screen owns setup and configuration.

Setup flows should live here so they do not compete with the urgent `Send Flare` surface.

### Customize Responsibilities

Customize owns:

* Behavior Pattern Setup
* Anchor Note Setup
* Telegram Support visibility for future support configuration
* lightweight status for setup completeness

### Customize Non-Responsibilities

Customize does not own:

* sending a flare
* active flare response
* historical review
* reflection after a flare
* analytics-heavy reporting

---

## Behavior Pattern Setup

Behavior Pattern Setup should open as a modal or sheet from `Customize`.

### Behavior Pattern Setup Responsibilities

Behavior Pattern Setup owns:

* naming the behavior pattern the user wants to interrupt
* identifying common triggers
* identifying high-risk moments
* identifying default recovery actions or replacement actions
* helping the user make the pattern concrete enough for the app to respond usefully

### Behavior Pattern Setup Non-Responsibilities

Behavior Pattern Setup does not own:

* active flare response
* Anchor Note content
* checkpoint/reflection
* Telegram setup
* history review

### V0 Behavior Pattern Fields

Possible V0 fields:

* behavior name
* short description
* common triggers
* risk times or situations
* preferred recovery actions

The fields should be simple and editable.

---

## Anchor Note Setup

Anchor Note Setup should open as a modal or sheet from `Customize`.

Anchor Note is a first-class concept in Flare.

### Anchor Note Setup Responsibilities

Anchor Note Setup owns:

* clear-minded reasons for quitting, reducing, delaying, or interrupting the behavior
* consequences or costs of continuing the behavior
* reminders from the user’s more grounded self
* emergency actions or commitments
* phrases that should be shown during the flare response

### Anchor Note Setup Non-Responsibilities

Anchor Note Setup does not own:

* active flare event creation
* behavior pattern definition
* checkpoint/reflection
* history browsing
* Telegram setup

### Anchor Note Design Principles

* Encourage specificity.
* Encourage honesty.
* Encourage personal language.
* Avoid shame-heavy framing.
* Keep content easy to revisit and edit.
* Make clear that better Anchor Note improves the flare response.

---

## Telegram Support Setup

Telegram Support should be visible in `Customize`, but it should not be active V0 product behavior.

### V0 Treatment

Telegram Support should be presented as:

```text
Coming in V1
```

or equivalent future-scoped language.

### Telegram Support Responsibilities

In V0, Telegram Support only owns:

* communicating future product direction
* showing that support channels are part of the broader roadmap
* avoiding surprise when support features appear later

### Telegram Support Non-Responsibilities

In V0, Telegram Support does not own:

* real Telegram authentication
* bot setup
* group connection
* support contact configuration
* outbound messages
* support escalation

This feature should not expand V0 scope.

---

## Modal and Sheet Usage

V0 should prefer modals or sheets for secondary flows.

### Good Modal / Sheet Candidates

* Checkpoint / Reflection
* Behavior Pattern Setup
* Anchor Note Setup
* Telegram Support preview

### Modal / Sheet Principles

* Keep modals focused.
* Use clear titles.
* Provide obvious close/cancel actions.
* Avoid deep modal nesting.
* Avoid placing the urgent `Send Flare` action inside a modal.
* Do not require setup modals before the user can access the main Flare screen.

---

## First-Run Experience

V0 may include a lightweight first-run experience, but it should not block understanding of the app.

### First-Run Goals

First-run should help the user understand:

* what `Send Flare` does
* why Behavior Pattern setup matters
* why Anchor Note matters
* that setup can be improved over time

### First-Run Non-Goals

First-run should not:

* become a long onboarding wizard
* require Telegram setup
* block all use until every field is complete
* overwhelm the user with analytics or settings

### Acceptable V0 First-Run Pattern

An acceptable V0 pattern:

```text
Open app
→ Show Flare screen
→ Show setup readiness indicators
→ Encourage Behavior Pattern and Anchor Note setup
→ Allow user to continue without completing everything
```

---

## V0 Non-Goals

V0 app structure does not include:

* full authentication flow
* production account/profile management
* real Telegram integration
* support group setup
* advanced analytics
* trend dashboards
* clinical scoring
* multi-behavior management
* complex settings hierarchy
* social/community features
* heavy onboarding wizard
* confirmation step before Send Flare

These may be considered later, but they should not shape the V0 navigation structure.

---

## Implementation Guidance

Future implementation should follow this contract when building screens and flows.

### Route Guidance

The Expo Router implementation may map the top-level navigation to routes such as:

```text
/
 /history
 /customize
```

or similar framework-appropriate route names.

The user-facing labels should remain:

```text
Flare | History | Customize
```

### Component Guidance

Implementation should avoid generic or vague component names.

Prefer domain-aligned names such as:

* `FlareScreen`
* `SendFlareButton`
* `FlareResponse`
* `CheckpointReflectionModal`
* `CustomizeScreen`
* `BehaviorPatternSetupModal`
* `AnchorNoteSetupModal`
* `HistoryScreen`

Avoid names such as:

* `MainScreen`
* `Helper`
* `Misc`
* `Utils`
* `ThingModal`

### State Guidance

Early V0 may use local or in-memory state while product behavior is being shaped.

When persistence is added, Flare Events, Anchor Note, Behavior Pattern, and Checkpoints should remain distinct domain concepts.

---

## Acceptance Criteria

The V0 app structure is aligned with this contract when:

* top-level navigation is `Flare | History | Customize`
* `Send Flare` is the primary action on the `Flare` screen
* `Send Flare` has no confirmation step before Flare Response
* Flare Response begins immediately after `Send Flare`
* Checkpoint / Reflection is secondary and likely modal/sheet-based
* Behavior Pattern Setup lives under `Customize`
* Anchor Note Setup lives under `Customize`
* Telegram Support is visible but future-scoped for V1
* History starts as a simple list of past events and reflections
* setup flows do not compete with the urgent Flare action
* V0 avoids auth, real Telegram behavior, and analytics-heavy history

---

## Open Decisions

These decisions remain open for implementation:

* exact mobile navigation component
* whether Flare Response is a route, modal, or focused screen state
* exact first-run copy
* exact readiness indicator design
* exact History list item shape
* exact modal/sheet component approach
* exact local state shape before persistence

These decisions should be resolved in implementation slices without changing the core navigation contract unless the product direction changes.

