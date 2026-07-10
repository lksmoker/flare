# Flare Response Experience V0 Contract

## Status

Active implementation contract.

## Purpose

The Flare Response experience guides a user from the moment they send a Flare through immediate recovery and later reflection.

Its purpose is not to present event details or act as a status dashboard. Its purpose is to help the user regain control with the lowest practical cognitive load.

The interface is part of the recovery intervention.

## Scope

This contract governs the user-facing recovery flow across:

1. Initial Flare Response
2. Transition into the Flare Plan
3. Flare Plan execution
4. Plan completion or early exit
5. Checkpoint transition

This contract does not redefine Flare Plan configuration, support-channel setup, event persistence, or historical event-detail views.

## User State Assumption

The experience must be designed for a user who may be experiencing:

- narrowed attention
- elevated emotion
- reduced working memory
- urgency
- impaired patience for explanation
- a strong desire to act, escape, or abandon the flow

The interface must not assume the user has normal reading capacity, attention, or decision-making bandwidth.

## Core Experience Model

The recovery flow should move through four distinct stages:

### 1. Support

Purpose:

Reassure the user that their request for support was delivered.

User question:

> Did anyone hear me?

### 2. Remember

Purpose:

Reconnect the user with the clear-minded reasons they previously recorded.

User question:

> Why am I choosing recovery?

### 3. Act

Purpose:

Guide the user through one manageable recovery action at a time.

User question:

> What should I do now?

### 4. Reflect

Purpose:

Capture useful learning after the immediate craving state has passed or weakened.

User question:

> What can I learn from this moment?

Each stage must have one clear purpose and one primary action.

## Design Principles

### Support first, personalization second

A user must be able to initiate a Flare and receive an immediate recovery experience without creating an account or signing in.

Authentication exists to enable personalization, persistence, synchronization, and history. It must not gate access to the core recovery flow.

When no authenticated personalized configuration is available:

- the user may still send a Flare
- the user must still be able to enter the Flare Response experience
- the user must receive a functional built-in default Flare Plan
- unavailable personalized content should be omitted cleanly rather than blocking recovery
- the interface should explain that signing in enables customization without suggesting that support itself is unavailable

Authentication may be required to:

- create or modify a personal Flare Plan
- configure persistent support-channel settings
- save personal Recovery Memory content
- view account-linked history
- synchronize configuration across devices

The experience should degrade from personalized support to default support, never from support to no support.

### Design for a craving state

Every element must justify the attention it requires.

Extra text, repeated confirmations, metadata, secondary explanations, and persistent status cards create cognitive cost.

When deciding whether content belongs in the recovery flow, ask:

> Would removing this make recovery harder right now?

If the answer is no, the content should generally be removed, deferred, or placed behind progressive disclosure.

### One stage, one purpose, one primary action

Each visible state should have:

- one dominant purpose
- one primary action
- no competing calls to action
- no unnecessary status reporting

Secondary actions may exist when necessary, but they must remain visually subordinate.

### One reassurance, one reminder, one action

The initial response experience should provide:

1. one reassurance that support was sent
2. one brief reminder of why recovery matters
3. one clear next action

These may be presented as one cohesive guided experience rather than multiple independent cards.

### Recovery over information

Prefer content that helps the user recover over content that merely describes the event.

Do not prioritize timestamps, event status, behavior-pattern metadata, timelines, or historical summaries during the immediate recovery flow.

Those details may remain available elsewhere when they are useful.

### Guide, do not report

Flare should feel like a calm companion guiding the user through the next helpful step.

It should not feel like an event dashboard, activity log, administrative workflow, or collection of status panels.

### Retire completed information

Once an element has served its purpose, it should disappear or become visually subordinate.

Examples:

- support-delivery confirmation should not remain prominent after it has reassured the user
- the current-event summary should not persist when the user already knows they sent a Flare
- plan-completion or plan-skipped status should not displace the next recovery action
- the Checkpoint action should become primary once the plan stage is finished

The interface should evolve with the user's recovery stage.

### Progressive disclosure

Store rich recovery information, but show only the portion useful in the current moment.

The full Recovery Memory may contain substantial detail. The initial Response experience should normally show only a brief, high-value reminder such as:

- the user's why
- the user's consequences if they continue

Additional material should remain preserved and available without competing with the primary recovery action.

### Calm over density

The recovery flow is not required to maximize the amount of visible content.

Prefer:

- generous whitespace
- readable typography
- large touch targets
- clear hierarchy
- limited visible choices
- slower visual pacing

Whitespace is a recovery tool, not wasted space.

### Calm over efficiency

The fastest or most compact interface is not necessarily the best interface.

Favor emotional clarity and deliberate pacing over minimizing taps, scrolling, or vertical height.

Progress through recovery is more important than fitting everything above the fold.

### Allow greater vertical presence

The Flare Response surface may use more of the viewport when doing so improves calm, clarity, focus, or readability.

Do not keep the response sheet artificially low or compressed merely to expose the underlying Flare screen.

The Response experience may:

- open higher on the screen
- use most or all of the available viewport
- provide additional vertical breathing room
- scroll when necessary

The preferred height is the height that best supports recovery, not the smallest height that contains the content.

### Mobile first

The recovery flow must be designed and validated primarily for a mobile viewport.

Important content and controls must remain readable and operable without horizontal overflow, crowded buttons, or dense multi-column layouts.

## Initial Flare Response Contract

The initial response state should move the user through:

1. reassurance
2. remembering
3. action

It should communicate, in substance:

> Your people know.  
> Remember why this matters.  
> Take the next step.

### Required content

The initial state should include:

- a clear support-delivery confirmation when delivery succeeded
- the user's saved why, when available
- the user's saved consequences, when available
- a primary action to begin the Flare Plan
- a subordinate option to skip or defer the plan

### Recovery reminder

The recovery reminder should be brief.

Preferred conceptual structure:

- Remember why you're doing this
- Why
- If I continue...

Do not display the entire Recovery Memory by default.

### Content to exclude from the immediate state

Unless required to resolve an active error, the initial response state should not prominently display:

- event timestamp
- event status
- behavior-pattern metadata
- current-event summary cards
- repeated explanations that the user sent a Flare
- long motivational paragraphs
- timelines
- historical information
- repeated support confirmations
- dense emergency or safety copy embedded inside the reminder card

Safety behavior and emergency access must remain available where required, but should not be mixed indiscriminately into every recovery surface.

### Composition

The support confirmation, recovery reminder, and plan action may be combined into one cohesive surface when that reduces visual fragmentation.

The implementation should avoid creating separate cards merely because the content originates from separate data or application concerns.

The user should experience one guided recovery sequence.

## Flare Plan Contract

The current Flare Plan step interaction is the canonical recovery UX and must be preserved unless a later explicit contract supersedes it.

### Canonical characteristics

Each plan step should retain:

- one step displayed at a time
- a clear step count
- a large, readable action title
- one brief supporting instruction
- generous whitespace
- one clear completion action
- one optional skip action
- a visually subordinate option to end the plan
- no unrelated event information
- no competing cards or recovery content

### Preservation requirement

An audit or alignment pass must not redesign, condense, combine, or replace the existing step-by-step Flare Plan presentation simply for visual consistency with the Response screen.

The existing Flare Plan interaction model is the UX benchmark for the rest of the recovery experience.

The surrounding Response flow should be aligned toward the clarity already achieved by the plan steps.

## Plan Completion and Early Exit Contract

Once the Flare Plan is completed, skipped, or ended:

- completed support-delivery information should not be repeated prominently
- the current-event summary should not return as the dominant content
- a large plan-completion or plan-skipped status card should not bury the next useful action
- the experience should transition toward reflection

A lightweight completion acknowledgement may be shown when useful, but it must not compete with the next recovery step.

## Checkpoint Contract

After the immediate recovery stage, the Checkpoint becomes the primary action.

The Checkpoint should be easy to discover without requiring the user to scroll through already-completed stages or repeated status information.

Its purpose is to help the user capture learning while the event is still recent, without making reflection feel mandatory during the most intense part of the craving.

The experience should distinguish between:

- immediate recovery, when action and reduced cognitive load are primary
- later reflection, when the user may have more capacity to think and record detail

## Visual and Interaction Standard

Across the recovery flow:

- use strong hierarchy rather than many containers
- avoid card stacking when one cohesive surface would communicate the sequence more clearly
- do not use decorative density to imply importance
- keep body copy short
- prefer direct language
- avoid forcing the user to interpret internal feature names
- keep secondary actions visibly secondary
- preserve accessible focus order and touch-target sizing
- preserve keyboard and screen-reader usability
- avoid layout shifts that obscure the current primary action

## Error and Exception States

Errors may require additional information, but must still follow the same principles.

An error state should:

- state what failed
- distinguish delivery failure from plan availability
- provide one clear recovery or retry action
- avoid exposing implementation details
- preserve access to any recovery content that remains usable

A support-delivery failure must not falsely report that the message was sent.

## Audit Requirements

Any implementation audit against this contract must examine at minimum:

- initial post-send response
- support-delivery success and failure states
- Recovery Memory presentation
- transition into the Flare Plan
- each Flare Plan step
- step completion
- step skipping
- plan ending
- plan completion
- plan skipped state
- Checkpoint visibility and transition
- mobile viewport behavior
- response-surface height and vertical placement
- repeated content across stages
- primary-action hierarchy
- accessibility behavior

For each finding, the audit should identify:

1. current behavior
2. applicable contract principle
3. user impact during a craving state
4. severity
5. recommended alignment
6. whether the recommendation preserves the canonical Flare Plan step experience

## Alignment Priorities

Findings should be prioritized in this order:

1. Anything that can mislead the user about support delivery
2. Anything that obscures the current primary recovery action
3. Anything that materially increases cognitive load
4. Repeated or already-completed information
5. Visual fragmentation and unnecessary card stacking
6. Copy and spacing refinements
7. Cosmetic consistency

## Non-Goals

This contract does not require:

- redesigning the existing Flare Plan steps
- introducing a new backend data model
- changing support-channel delivery
- changing event persistence
- redesigning History
- redesigning Customize
- creating analytics or progress dashboards
- removing access to detailed event information outside the immediate recovery flow
- forcing all recovery stages onto one screen

## Acceptance Standard

The aligned flow should feel like a guided recovery conversation:

1. Your people know.
2. Remember why this matters.
3. Take one manageable action.
4. Reflect when you are ready.

A successful implementation will feel calmer, clearer, and less demanding than the current implementation while preserving the effective step-by-step Flare Plan behavior.