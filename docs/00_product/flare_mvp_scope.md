# Flare MVP Scope

Status: draft
Doc Type: product scope
Role: Keep V0 focused and prevent premature scope expansion.

## Purpose

This document defines the initial MVP scope for Flare.

The goal is to build the smallest version that can prove the core loop:

> notice risk moment ? Send Flare ? interrupt behavior ? receive recovery support ? optionally checkpoint what happened

## V0 Scope

V0 is a solo-user product.

### Included in V0

#### Account and Profile

- User can create an account and log in.
- User has a basic profile.
- User data is private to that user.

#### Behavior Pattern Setup

User can define at least one behavior or pattern they want to interrupt.

Examples:

- “YouTube spiral”
- “news feed scrolling”
- “late-night relapse risk”
- “avoidance loop”
- “anxiety checking loop”

The setup should allow plain-language naming. It does not need a complex taxonomy in V0.

#### Send Flare

User has a primary action:

> Send Flare

This action should be available from the main screen with minimal friction.

When pressed, it creates a Flare Event and moves the user into an immediate support flow.

#### Flare Response

After sending a flare, the app should immediately show a flare response.

The response may include:

- one clear next action
- a brief grounding prompt
- a reminder from Anchor Note
- a disruptive action such as standing up, leaving the room, breathing, drinking water, texting someone manually, or opening a saved emergency plan

The user should not be presented with a dense screen or too many choices.

#### Anchor Note

User can create and edit Anchor Note content.

Anchor Note should include prompts such as:

- Why do I want to stop or reduce this?
- What does this behavior cost me?
- What do I want my future self to remember?
- What helps me interrupt the loop?
- What should I do in the first two minutes?

Anchor Note setup is optional but strongly encouraged.

#### Flare History

User can see a lightweight history of flare events.

Each event may include:

- timestamp
- behavior/pattern
- selected recovery action
- optional note
- optional result/outcome

#### Checkpoints

User can optionally reflect after a flare.

V0 checkpointing should be lightweight. It should not feel like homework.

Possible questions:

- Did the flare help?
- What action did you take?
- Did the urge pass, reduce, or continue?
- Anything to remember for next time?

## V1 Scope

V1 introduces outside support.

### Telegram Support

User can connect Telegram and configure a support contact or group.

Possible V1 flow:

1. User clicks “Connect Telegram.”
2. User follows Telegram setup instructions.
3. User chooses a support group or contact.
4. User configures when Flare should send a support message.
5. User reviews and confirms message templates.

### Support Message Templates

User can configure what gets sent.

Examples:

- “I’m having a hard moment and could use support.”
- “Please check in with me.”
- “I sent a flare for [pattern]. I’m trying to interrupt the loop.”

Templates should be user-editable.

### Escalation Options

V1 may allow different levels of support:

- do not notify anyone; solo flare only
- show a prompt to manually reach out
- send a Telegram message immediately
- send only if the user does not dismiss the flare after a period of time

## Later Scope

These are intentionally deferred.

- community groups
- recovery-group support
- sponsor/peer workflows
- depression/anxiety-specific versions
- advanced analytics
- AI-generated recovery coaching
- wearable/device integrations
- emergency contact escalation
- clinical-provider integrations
- paid subscription tiers
- organization/group subscriptions

## Explicit Non-Goals for V0

V0 should not attempt to be:

- a full therapy app
- a crisis-response service
- a medical device
- a social network
- a replacement for professional care
- a complete recovery program
- a complex analytics dashboard
- a habit tracker with heavy daily maintenance

## MVP Success Criteria

V0 is successful if:

- a user can configure a behavior pattern
- a user can press Send Flare during a real moment of risk
- the response is fast and emotionally usable
- Anchor Note feels meaningful when surfaced
- the user can see a basic record of what happened
- the product feels worth returning to after the first use

## Open Questions

- Should V0 support multiple behavior patterns or start with one primary pattern?
- Should Anchor Note be required before the first flare, or introduced after?
- What is the default flare response if the user has not configured anything?
- Should flare history be private by default with no sharing until V1?
- What is the minimum subscription-worthy feature set?

