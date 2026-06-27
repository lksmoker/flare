# Flare Stack Decision

> Canonical stack decision record.
> Source notes: `docs/00_product/flare_stack_decision_checkpoint.md`.

Status: draft
Doc Type: architecture decision
Role: Record the initial stack decision and why it fits the project.

## Decision

Flare should be built as a mobile-first full-stack product with an Expo / React Native client and a separated backend/data layer that can grow into auth, persistence, and future integrations.

Initial direction:

- Frontend: Expo + React Native + TypeScript
- Routing: Expo Router
- Backend: Supabase-first backend for auth, Postgres, RLS, and edge functions
- Deployment: simple Expo-compatible app delivery for V0, with backend configuration managed separately
- Future integration: Telegram support in V1

The exact implementation can still be refined, but the repo should be structured as a real product rather than a throwaway prototype.

## Context

Flare is intended to sit alongside the user’s other portfolio projects.

That means the stack should:

- demonstrate modern full-stack product development
- support a subscription-service direction
- allow future integrations
- keep V0 buildable by one person
- avoid unnecessary infrastructure complexity
- make it easy to iterate on product behavior

Flare has a relatively simple V0 data model, but the product may later require:

- secure user accounts
- private user data
- recurring billing
- external messaging integrations
- background jobs
- survey/checkpoint data
- analytics and progress views
- multi-user or group features

## Product Requirements That Affect the Stack

The stack should support:

- fast mobile-first UI
- simple login/account management
- persistent user configuration
- Anchor Note storage
- Flare Event history
- checkpoints/reflections
- future Telegram connection
- future subscription billing
- future support-group features
- safe handling of sensitive personal content

## Architecture Shape

A reasonable starting architecture:

```text
mobile client
  -> app API / backend services
    -> auth/session layer
    -> database
    -> future integration adapters
Core app areas:

frontend/
  Expo app routes, screens, and components

backend/ or server/
  API routes
  domain services
  integration adapters

docs/
  product, architecture, delivery, and research docs

db/
  schema, migrations, seed data if applicable

The exact folder structure can be adjusted once the framework is chosen.

Initial Domain Areas

The stack should be able to support these core concepts:

User
Flare Profile
Behavior Pattern
Anchor Note
Flare Event
Recovery Action
Checkpoint / Reflection
Support Channel, later
Support Contact / Group, later
Subscription, later
Subscription-Service Implications

If Flare becomes a subscription service, the architecture should eventually support:

free/trial vs paid accounts
billing provider integration
account settings
user data export/delete
privacy policy and terms
durable event history
production monitoring
secure environment configuration

These do not need to be built in V0, but the architecture should not block them.

Rationale

The stack should optimize for:

speed of iteration
clear portfolio value
low operational burden
strong frontend experience
practical backend capabilities
future integrations
easy deployment

Because Flare’s core value is product experience, not infrastructure novelty, the stack should avoid overengineering.

Risks / Tradeoffs

Potential risks:

too much architecture before validating the core product loop
overbuilding support-group features before the solo flow works
storing sensitive user reflections without a clear privacy posture
making onboarding too heavy
making the urgent flare moment too complex
prematurely optimizing for subscriptions before proving usefulness
Deferred Decisions

The following can be decided later:

exact billing provider
exact Telegram integration shape
whether mobile app wrappers are needed
whether to support native push notifications
whether to add AI-generated support responses
whether to add community/group discovery
whether to support organization accounts
Current Working Assumption

Build V0 as a focused solo-user mobile-first app.

Make the core loop excellent before expanding into Telegram, community, web dashboard, or subscription complexity.

