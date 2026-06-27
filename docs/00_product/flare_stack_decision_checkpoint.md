> Source checkpoint for the initial Flare stack discussion.
> Canonical decision record: `docs/20_architecture/flare_stack_decision.md`.
# Flare Stack Decision Checkpoint

Status: Tentatively Accepted  
Project: Flare  
Decision Date: 2026-06-26  
Decision Type: Product / Technical Stack Direction

---

## Decision

Flare will proceed with a mobile-first stack centered on:

- Expo / React Native
- TypeScript
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase Edge Functions
- Expo Notifications
- Telegram Bot API integration later

This decision is tentative but high-confidence for V0 direction.

---

## Rationale

Flare should sit alongside Exoskeleton as a distinct portfolio project rather than duplicating the same technical and product shape.

Exoskeleton demonstrates:

- AI/devtool workbench architecture
- planning/execution lifecycle systems
- agent orchestration
- governance and safety boundaries
- FastAPI, React, and Postgres-based internal tooling

Flare should demonstrate a different product lane:

- mobile-first consumer product design
- sensitive, trust-centered UX
- support-circle workflows
- notifications and escalation flows
- private user data modeling
- subscription-ready product architecture

The stack should support the product’s likely moment of use: a user reaching for their phone during a vulnerable moment when they need immediate interruption, grounding, accountability, or support activation.

---

## Portfolio Positioning

The portfolio story should become:

> Exoskeleton shows AI/devtool/system architecture.  
> Flare shows mobile consumer product, trust-sensitive UX, notifications, support-circle workflows, and subscription-ready product design.

This makes Flare meaningfully additive to the portfolio.

---

## Selected V0 Stack

### App

- Expo
- React Native
- TypeScript
- Expo Router

### Backend

- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase Edge Functions

### Notifications

- Expo Notifications

### Integrations

- Telegram Bot API later
- Integration should likely live in Supabase Edge Functions or a small backend service if complexity grows

### UI Layer

Current lean:

- Plain React Native components
- Small internal design system

Possible later additions:

- NativeWind, if Tailwind-style styling speed becomes useful
- Tamagui, only if a more ambitious cross-platform design system becomes worth the complexity

---

## V0 Product Scope Implications

The V0 stack should support:

- user account/auth
- onboarding
- personal recovery reason / motivation
- consequence reminder
- emergency action list
- send flare button
- immediate intervention response screen
- basic support-circle model
- notification foundation
- subscription-ready entitlement model, without billing at first

---

## Subscription Posture

Flare may eventually support a freemium subscription model.

The ethical boundary is:

> The urgent “I need help now” flow should not be hard-paywalled.

Suggested model:

### Free

- acute interruption flow
- basic safety/support response
- basic recovery reason and consequence reminders
- basic emergency actions
- limited support-circle capability

### Paid Later

- richer accountability
- history and progress summaries
- multiple support circles
- advanced escalation rules
- recurring check-ins
- deeper customization
- supporter coordination tools
- community/group features, if added later

---

## Deferred for V0

The following should not be part of the initial stack burden unless the product direction changes:

- full Telegram support
- community groups
- payment integration
- AI coaching
- complex analytics
- heavy custom backend
- multi-platform web dashboard

---

## Current Decision Status

Decision: Tentatively accepted  
Stack: Expo + Supabase  
Confidence: High  
Reason: Best fit for product, portfolio differentiation, mobile-first UX, and future subscription path  
Open Question: UI library choice  
Current UI Lean: Plain React Native first, possibly NativeWind later


