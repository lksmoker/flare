# Flare Experience Principles

## Purpose

This document defines the enduring experience principles for Flare.

It should guide product design, interaction design, copy, navigation, and implementation decisions across the application.

Flare is not a dashboard. It is a calm guide that helps people prepare before difficult moments and supports them during those moments.

> The best Flare interface is one the user barely notices. Every screen should quietly guide the user toward the next meaningful step while keeping attention on recovery—not on the software itself.

## Product promise

> Flare helps people reconnect with two things that can be hardest to reach in a difficult moment: their support and their clarity.

### Their support

The people, messages, encouragement, and connection they have chosen ahead of time.

### Their clarity

The reminders, plans, reasons, and intentions they prepared while thinking clearly.

Every major Flare capability should strengthen one or both of these connections.

If a proposed feature does neither, it should be carefully evaluated before becoming part of the product.

## Core philosophy

Flare may be used by someone who is already overwhelmed, distressed, distracted, or struggling to make a clear decision.

Every design decision should therefore reduce:

- cognitive load

- uncertainty

- unnecessary effort

- competing choices

- attention placed on the interface itself

The experience should increase:

- clarity

- confidence

- calm

- momentum toward the next helpful action

## Experience model

Flare should separate distinct user moments rather than forcing one screen to perform several jobs.

### Welcome

Purpose: explain Flare.

The Welcome experience should briefly answer:

- What is Flare?

- What is it for?

- Can I use it without signing in?

- What does signing in add?

- What should I do next?

This should be a first-use orientation experience, not a permanent operational home screen.

### Setup

Purpose: prepare support before it is needed.

The Setup experience should guide the user through configuring Flare with one clear next step at a time.

It should not require the user to interpret a dashboard of configuration states before acting.

### Ready

Purpose: make Flare immediately available.

Once setup is sufficient, the main Flare screen should prioritize the primary operational action: sending a Flare.

Supporting readiness information may remain available, but it should not compete with the primary action.

### Response

Purpose: guide the user through the immediate difficult moment.

The Response experience should minimize thinking, navigation, interpretation, and configuration.

It should prioritize the current helpful action and progressively reveal only what is useful.

### History

Purpose: review prior Flare moments.

History should support reflection and continuity without turning recovery into performance tracking or an analytics dashboard.

## Design principles

### One purpose per screen

Every screen should have one clear responsibility.

Avoid combining:

- product education

- configuration

- diagnostics

- operational actions

- reflection

unless those elements are necessary for the same immediate user goal.

### One primary action

Every screen should present one obvious next step.

Secondary actions may remain available, but they should not compete visually with the primary action.

A user should not need to ask:

> What am I supposed to do next?

### Guidance over dashboards

Favor guidance instead of collections of status information.

Status should support a decision or action. It should not become the main focus of the interface.

Do not require users to study several cards, labels, badges, or readiness indicators before they understand what to do.

### Simplicity over density

Prefer fewer, clearer elements over compressed information.

Use whitespace intentionally.

Do not add information merely because screen space is available.

When information is not necessary for the current decision, move it elsewhere or reveal it progressively.

### Progressive disclosure

Reveal complexity only when it becomes useful.

Users should not need to understand the entire product before taking their first meaningful step.

Orientation comes before setup.

Setup comes before operation.

Advanced detail appears only when the user needs it.

### Clear visual hierarchy

Each screen should have a single visual focal point.

The primary action and its supporting explanation should be immediately recognizable.

Supporting information should visually recede.

### Calm interaction

The interface should feel supportive rather than administrative.

Avoid:

- dashboard aesthetics

- dense grids of cards

- competing visual emphasis

- unnecessary warnings

- technical terminology

- implementation details

- aggressive urgency

- decorative complexity

### Honest communication

Explain what Flare actually does and does not do.

Capabilities and limitations should be clear, especially for:

- signed-out use

- signed-in use

- local storage

- cloud persistence

- cross-device access

- support messages

- privacy

- recovery and restoration

Do not imply functionality that is not currently implemented.

### Mobile first

Flare should feel natural on a phone rather than like a desktop interface compressed onto a smaller screen.

Favor:

- large touch targets

- generous spacing

- short flows

- fewer simultaneous decisions

- readable line lengths

- clear hierarchy

- natural one-handed interaction where practical

### Human centered

Flare exists for people, not for system state.

Do not expose internal concepts merely because they are available in the implementation.

Translate system behavior into language and actions that are meaningful to the user.

### The interface should fade into the background

Users should focus on the support Flare provides, not on navigation, configuration mechanics, or application state.

When an interaction makes the user stop and think about how the software works, first consider whether the interaction can be simplified.

## Interaction principles

### Readiness communicates progress

Readiness should help the user understand whether Flare is prepared.

It should not behave like an administrative control panel.

Readiness information should be:

- secondary

- collapsible where appropriate

- easy to scan

- consistent with the actual configuration model

### Configure is where changes happen

Configuration belongs on the Configure screen.

Readiness items may navigate to Configure, but they should not create separate configuration models or competing detail experiences.

For V0, tapping any readiness item should take the user to the Configure screen.

### Home is where Flare is used

The operational Flare screen should prioritize the current primary action.

Product explanation and account education should not permanently occupy the main operational surface when they can be handled through first-use orientation.

### Response minimizes thinking

During an active Flare, the interface should:

- present one immediate action

- avoid unnecessary metadata

- avoid repeated information

- keep recovery content personal and direct

- progressively reveal later actions

- preserve a clear path forward

### Navigation should feel obvious

Large visible surfaces that appear actionable should be actionable.

Avoid relying on small icons or hidden affordances.

Use consistent navigation patterns and preserve accessible focus behavior.

## Signed-out and signed-in communication

Flare should clearly explain the distinction between local use and signed-in use.

The product should answer:

- What can I do without signing in?

- Where is my setup stored?

- What does signing in enable?

- Will my setup be available on another device?

- Can I restore it if this device is lost or replaced?

Signing in should not be framed as required unless it is actually required for the selected capability.

When local use is supported, describe it plainly.

When a feature requires authentication or backend persistence, describe that limitation specifically rather than implying that all of Flare is unavailable.

Account state is not a configuration item and should not be mixed into readiness counts for user-configurable setup.

## Copy principles

Flare copy should be:

- calm

- direct

- concise

- supportive

- honest

- specific

- free of unnecessary technical language

Prefer:

- “Continue setup”

- “Ready to set up”

- “Saved on this device”

- “Sign in to use your setup across devices”

Avoid:

- implementation terminology

- ambiguous labels such as “optional” when the practical limitation is more specific

- diagnostic language that requires interpretation

- long explanations on operational screens

- pressure-based account messaging

## Consistency rules

The product should reinforce a stable mental model:

- Welcome explains Flare.

- Configure prepares Flare.

- Readiness communicates preparation.

- Home is where Flare is used.

- Response guides the immediate moment.

- History supports reflection.

Avoid introducing several different places to perform the same task unless there is a clear user need.

## Decision filter

Before adding or changing an element, ask:

1. Does this reduce cognitive load?

2. Does it make the next action clearer?

3. Does this information belong on this screen?

4. Can it be progressively disclosed?

5. Is there one obvious primary action?

6. Does this feel like guidance or like a dashboard?

7. Is the language honest about current behavior?

8. Does it work naturally on a phone?

9. Does it preserve a consistent mental model?

10. Does it help the interface fade into the background?

When the answer is unclear, prefer the simpler experience