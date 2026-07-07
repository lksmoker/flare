# Flare Checkpoint: Depression / Anxiety Expansion

Date: 2026-06-26
Status: Product direction checkpoint
Project: Flare

## Summary

Flare may be useful beyond addiction, urges, and compulsive behaviors. The underlying pattern is broader:

> "I am in a hard moment. Help me interrupt the spiral, reconnect with my clearer self, and reach a person or action that can stabilize me."

This pattern may apply to depression and anxiety, but the product should not immediately broaden its headline promise to "depression and anxiety support." That would move Flare closer to clinical mental-health territory and require stronger safety, language, and escalation design.

## Current Product Position

For V0, keep Flare focused on:

- Urges
- Compulsions
- Relapse prevention
- Craving interruption
- Moments where a user needs to reach out before acting against their values

The broader emotional pattern can still influence the architecture and language.

## Potential Later Expansion

A future version could support mood and anxiety spirals under a related but distinct framing.

Possible product lanes:

### Flare Core

Support for urges, compulsions, relapse prevention, and behavior-change moments.

Examples:

- "I am about to relapse."
- "I am about to do the thing I told myself I do not want to do."
- "I need help getting through this craving."

### Flare Mood

Support for depression/anxiety spiral interruption.

Examples:

- "I am spiraling."
- "I am isolating."
- "I am panicking."
- "I am catastrophizing."
- "I need help getting through the next 10 minutes."

### Flare Safety

Potential future crisis-aware safety layer.

This should only be added with careful design. It would need clear boundaries, crisis escalation, emergency resources, and strong disclaimers. Flare should not imply that friends, groups, or AI replace professional care.

## Important Product Boundary

Flare should not position itself as:

- A therapy app
- A replacement for professional treatment
- A crisis hotline
- A diagnostic tool
- A general-purpose mental health treatment product

A better framing:

> Flare is a moment-of-need support activator.

Or:

> Flare helps people reach support and remember their own reasons when they are at risk of acting against their values.

## Design Implication

The app should be designed around a general "hard moment" model, while keeping V0 messaging narrow.

A user should be able to define different flare reasons over time, such as:

- Craving
- Relapse risk
- Compulsion
- Panic
- Isolation
- Doomscroll spiral
- Hopelessness spiral
- Avoidance spiral

But V0 should prioritize the addiction / compulsion / recovery use case first.

## Anchor Note Implication

The existing Anchor Note concept remains valuable and may generalize well.

For depression/anxiety, a future version might include a similar "Clear-Minded Memory" or "Grounding Memory" that captures:

- What I know when I am clear-minded
- What helps me come back down
- Who I trust
- What I should not believe when I am spiraling
- What action I can take in the next 2 minutes
- What I want someone else to remind me

This should be optional, personal, and editable.

## Safety Notes

If Flare expands into depression/anxiety, safety design becomes more important.

Future requirements may include:

- Crisis-language detection
- Clear emergency disclaimers
- Local crisis resources
- "Call emergency contact" or "call emergency services" affordances
- Non-alarming but direct escalation language
- No claims of treatment efficacy
- Encouragement to involve professional care where appropriate

## Decision

Checkpoint decision:

- Keep V0 focused on relapse / compulsion / craving interruption.
- Preserve a broader architecture that can later support anxiety/depression spirals.
- Do not market V0 as a depression/anxiety app.
- Consider "moment-of-need support activator" as the broader long-term category.
- Treat mood/anxiety expansion as a later product lane, not the initial wedge.

