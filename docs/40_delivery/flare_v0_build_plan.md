<!-- @context: { "kind": "delivery.plan", "layer": "docs", "name": "Flare V0 Build Plan", "domains": ["delivery", "v0", "planning"] } -->

Flare V0 Build Plan

Status: draft
Doc Type: delivery plan
Role: Break the first version into buildable slices.

Goal

Build the first usable version of Flare.

V0 should prove that a user can:

define a behavior pattern they want to interrupt
create meaningful Recovery Memory
press Send Flare during a real urge or spiral
receive immediate, useful interruption support
optionally checkpoint what happened afterward

The goal is not to build every future feature. The goal is to prove that the core experience is valuable.

Build Principles
Build the solo-user loop first.
Keep the urgent moment extremely simple.
Prefer plain language over clinical language.
Make Recovery Memory feel personal and useful.
Avoid social/support integrations until V1.
Keep the data model understandable.
Ship in thin vertical slices.
Preserve existing lightweight `@context` headers on durable docs and add them to future `docs/` Markdown files where applicable.
Build Slice 1: Project Skeleton

Set up the repo and app foundation.

Note: the repo structure and conventions contract now lives at `docs/20_architecture/flare_repo_structure_conventions.md` and should guide scaffold selection and initial folder layout.

Deliverables:

app scaffold
basic routing
docs folder in place
environment setup
local dev command
initial README
placeholder landing screen

Acceptance:

app runs locally
repo structure is clear
project can be deployed or prepared for deployment
Build Slice 2: Auth and User Profile

Add account basics.

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

Deliverables:

create behavior pattern
edit behavior pattern
list current patterns
choose primary pattern if multiple are supported

V0 may start with one primary behavior pattern if that keeps the product simpler.

Acceptance:

user can name the pattern in their own words
pattern is available during Send Flare flow
Build Slice 4: Recovery Memory Setup

Create the clear-minded memory bank.

Deliverables:

Recovery Memory setup screen
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

user can save meaningful Recovery Memory
saved memory can be surfaced later during a flare
setup is optional but encouraged
Build Slice 5: Send Flare Flow

Implement the central action.

Deliverables:

main app screen with primary Send Flare button
create Flare Event
choose/use active behavior pattern
transition into recovery response screen

Acceptance:

user can press Send Flare with minimal friction
a durable flare event is created
response appears immediately
Build Slice 6: Recovery Response Screen

Give the user useful support in the moment.

Deliverables:

show one recommended recovery action
show selected Recovery Memory content
offer simple alternatives
allow user to mark action as taken
allow user to exit safely

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
Recovery Memory appears in the moment
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
Build Slice 8: Basic Checkpoints

Allow reflection after a flare.

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
Build Slice 9: Polish and Deploy

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
Can the user configure a behavior without friction?
Does Recovery Memory feel worth filling out?
Is Send Flare fast enough for a low-capacity moment?
Does the recovery response feel supportive rather than annoying?
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
Should the first session force Recovery Memory setup or defer it?
What tone should the app use during a flare?
Should history emphasize streaks, events, or learning?
What is the minimum useful subscription version?
What safety/privacy language is needed before broader testing?
