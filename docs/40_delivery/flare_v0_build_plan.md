<!-- @context: { "kind": "delivery.plan", "layer": "docs", "name": "Flare V0 Build Plan", "domains": ["delivery", "v0", "planning"] } -->

Flare V0 Build Plan

Status: draft
Doc Type: delivery plan
Role: Break the first version into buildable slices.

Goal

Build the first usable version of Flare.

V0 should prove that a user can:

define a behavior pattern they want to interrupt
create meaningful Anchor Note
press Send Flare during a real urge or spiral
receive immediate, useful interruption support
optionally checkpoint what happened afterward

The goal is not to build every future feature. The goal is to prove that the core experience is valuable.

Navigation and Structure Gate

Before implementation of screen, route, navigation, or app-shell work, the product build must conform to:

- `docs/10_design/flare_v0_app_structure_navigation.md`
- `docs/20_architecture/flare_repo_structure_conventions.md`

This gate is required for all future implementation slices that touch app structure or user-facing flow.

Required V0 navigation and structure constraints:

- top-level navigation labels must remain `Flare | History | Customize`
- `Flare` is the primary screen and owns the dominant `Send Flare` action
- `Send Flare` must enter Flare Response immediately with no confirmation step
- `Checkpoint / Reflection` must remain a secondary modal or sheet flow rather than a top-level destination
- `Behavior Pattern Setup` and `Anchor Note Setup` must live under `Customize`
- `Telegram Support` should be visible under `Customize` but explicitly future-scoped for V1

If an implementation slice cannot satisfy these constraints, the slice should be re-scoped or blocked until the contract mismatch is resolved in docs first.

Data and Persistence Gate

Before implementation of durable storage, local database state, local device persistence, backend persistence, or history persistence behavior, the product build must conform to:

- `docs/20_architecture/flare_v0_data_persistence_contract.md`

This gate is required for all future implementation slices that create or save durable `Behavior Pattern`, `Anchor Note`, `Flare Event`, or `Checkpoint / Reflection` data.

Required persistence constraints:

- V0 durable entities must remain distinct: `BehaviorPattern`, `AnchorNote`, `FlareEvent`, `CheckpointReflection`
- `FlareEvent` history must preserve behavior meaning through snapshot fields rather than only live mutable references
- local UI state, drafts, and modal state must not be treated as durable records by default
- privacy-sensitive recovery content must stay out of telemetry and unnecessary logs
- V0 persistence must not quietly expand into Telegram, support-contact, or support-group data

If a persistence slice cannot satisfy these constraints, the slice should be re-scoped or blocked until the contract mismatch is resolved in docs first.

Build Principles
Build the solo-user loop first.
Keep the urgent moment extremely simple.
Prefer plain language over clinical language.
Make Anchor Note feel personal and useful.
Avoid social/support integrations until V1.
Keep the data model understandable.
Ship in thin vertical slices.
Preserve existing lightweight `@context` headers on durable docs and add them to future `docs/` Markdown files where applicable.
Build Slice 1: Project Skeleton

Set up the repo and app foundation.

Note: the repo structure and conventions contract now lives at `docs/20_architecture/flare_repo_structure_conventions.md` and should guide scaffold selection and initial folder layout.
Note: the app shell, route plan, and navigation scaffold must also follow `docs/10_design/flare_v0_app_structure_navigation.md` before implementation proceeds beyond placeholders.

Deliverables:

app scaffold
basic routing aligned to `Flare | History | Customize`
docs folder in place
environment setup
local dev command
initial README
placeholder `Flare`, `History`, and `Customize` screens

Acceptance:

app runs locally
repo structure is clear
project can be deployed or prepared for deployment
top-level scaffold reflects the V0 navigation contract
Build Slice 2: Auth and User Profile

Add account basics.

Auth work should not replace or rename the V0 top-level navigation contract. Authenticated shell work must preserve `Flare | History | Customize` as the primary destinations.

Deliverables:

sign up
login
logout
authenticated app shell
basic user profile record

Acceptance:

user can create an account
user can return to their own data
unauthenticated users cannot access private app screens
Build Slice 3: Behavior Pattern Setup

Let the user define what they want help interrupting.

This setup flow belongs under `Customize` and should be implemented as a secondary screen, modal, or sheet flow rather than a top-level destination.

Deliverables:

create behavior pattern
edit behavior pattern
list current patterns
choose primary pattern if multiple are supported

V0 may start with one primary behavior pattern if that keeps the product simpler.

Acceptance:

user can name the pattern in their own words
pattern is available during Send Flare flow
setup remains visually secondary to the urgent `Flare` screen
Build Slice 4: Anchor Note Setup

Create the clear-minded memory bank.

This setup flow belongs under `Customize` and should be implemented as a secondary screen, modal, or sheet flow rather than a top-level destination.

Deliverables:

Anchor Note setup screen
guided prompts
save/edit behavior
optional completion state
gentle explanation of why it matters

Prompts may include:

Why do I want to interrupt this pattern?
What does continuing cost me?
What do I want my future self to remember?
What helps in the first two minutes?
What emergency action should I try first?

Acceptance:

user can save meaningful Anchor Note
saved memory can be surfaced later during a flare
setup is optional but encouraged
setup remains visually secondary to the urgent `Flare` screen
Note: any future move from local state to durable save behavior for this slice must first follow `docs/20_architecture/flare_v0_data_persistence_contract.md`.
Build Slice 5: Send Flare Flow

Implement the central action.

Deliverables:

`Flare` screen with primary `Send Flare` button
create Flare Event
choose/use active behavior pattern
transition into Flare Response immediately with no confirmation step

Acceptance:

user can press Send Flare with minimal friction
a durable flare event is created
response appears immediately
the app does not insert a confirmation step before Flare Response
Note: any durable event-creation implementation must follow `docs/20_architecture/flare_v0_data_persistence_contract.md`, including behavior snapshot requirements.
Build Slice 6: Flare Response Screen

Give the user useful support in the moment.

Deliverables:

show one recommended recovery action
show selected Anchor Note content
offer simple alternatives
allow user to mark action as taken
allow user to exit safely
offer a secondary path into `Checkpoint / Reflection`

Possible default recovery actions:

stand up and move away from the trigger
drink water
breathe for one minute
put the phone down
write one sentence
manually contact someone
wait two minutes before deciding

Acceptance:

screen is calm and not crowded
user gets one clear next step
Anchor Note appears in the moment
the experience feels immediate from `Send Flare`
Build Slice 7: Flare Event History

Let the user see prior flares.

Deliverables:

event history list
timestamp
behavior pattern
action shown/taken
optional result
event detail view

Acceptance:

user can review recent flare events
history is useful but not overwhelming
history remains a top-level destination separate from setup/configuration
Build Slice 8: Basic Checkpoints

Allow reflection after a flare.

`Checkpoint / Reflection` should remain a secondary modal or sheet flow launched from the `Flare` screen or Flare Response, not a top-level navigation destination.

Deliverables:

optional post-flare checkpoint
quick outcome capture
optional note
link checkpoint to Flare Event

Possible checkpoint fields:

did this help?
urge passed/reduced/continued
action taken
note for next time

Acceptance:

checkpoint can be completed quickly
user can skip it
checkpoint data appears in event history
checkpoint flow remains secondary to the urgent `Send Flare` path
Note: any future persistence work for checkpoint data must follow `docs/20_architecture/flare_v0_data_persistence_contract.md` before implementation.
Build Slice 9: Customize Surface and Future Support Visibility

Make setup and future support boundaries explicit.

Deliverables:

`Customize` screen
entry points for `Behavior Pattern Setup`
entry points for `Anchor Note Setup`
visible `Telegram Support` placeholder labeled as future-scoped for V1
lightweight setup readiness indicators where useful

Acceptance:

user can clearly distinguish urgent action, history, and customization
setup lives under `Customize`
Telegram Support is visible without expanding V0 into real Telegram behavior
Build Slice 10: Polish and Deploy

Prepare V0 for real use.

Deliverables:

mobile-friendly layout
empty states
loading states
error states
basic privacy copy
production deploy
README update
final V0 smoke test

Acceptance:

user can complete the full loop on a phone
app is stable enough for personal testing
deployment is accessible
V0 Validation

V0 should be tested against real product questions:

Can the user understand what Flare does within 30 seconds?
Is the top-level navigation clearly `Flare | History | Customize`?
Is `Send Flare` obviously the primary action on the `Flare` screen?
Can the user configure a behavior without friction?
Does Anchor Note feel worth filling out?
Is Send Flare fast enough for a low-capacity moment?
Does Flare Response start immediately with no confirmation barrier?
Does `Checkpoint / Reflection` feel secondary rather than competing with the urgent action?
Is `Customize` the clear home for Behavior Pattern Setup and Anchor Note Setup?
Is Telegram Support visible as future-scoped V1 direction without inflating V0 scope?
Does the flare response feel supportive rather than annoying?
Does the user want to use it again after the first test?
Candidate V1 Build Slices

After V0 proves the solo loop, V1 may add:

Telegram connection
support contact/group setup
support message templates
support escalation choices
manual or automatic support notification
support-flow audit/history
subscription/billing experiment
Open Questions
Should V0 allow multiple behavior patterns?
What is the best default action after Send Flare?
Should the first session force Anchor Note setup or defer it?
What tone should the app use during a flare?
Should history emphasize streaks, events, or learning?
What is the minimum useful subscription version?
What safety/privacy language is needed before broader testing?

