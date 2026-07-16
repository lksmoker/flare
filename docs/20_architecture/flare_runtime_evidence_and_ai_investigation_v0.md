# Flare Runtime Evidence & AI Investigation V0

## Purpose

Flare’s operational model is intentionally AI-native.

Rather than relying on a traditional operations dashboard, the AI operator synthesizes runtime evidence, participant signals, structured operational records, and human observations into an operational understanding that can be queried at any time.

This document describes the evidence available during private testing, how investigations are performed, and the principles guiding future observability work.

## Scope and Status

This is a V0 architecture reference for the private-testing operating model.

The evidence inventory below is provisional until each runtime source is verified through the Runtime Evidence Audit. It describes the evidence Flare is expected to make available, not a guarantee that every source is currently complete, queryable, or retained for investigation.

The document should be updated when the audit confirms evidence availability, identifies gaps, or produces a Trace V0 decision.

## Design Principles

### Evidence over dashboards

Operational truth comes from evidence.

Dashboards are merely one possible presentation of that evidence and are intentionally deferred during private testing.

### Signals first

Every investigation begins with a signal that requires interpretation.

Signals may originate from:

- conversation
- Google Form
- operator observation
- runtime anomaly

The signal determines what evidence should be collected.

### AI maintains operational state

The AI operator is responsible for:

- interpreting incoming signals
- correlating evidence
- updating Operations Records
- identifying likely causes
- producing operational snapshots
- recommending follow-up actions

The AI is not considered the source of truth.

Instead, it continuously synthesizes authoritative evidence into an up-to-date operational understanding.

## Evidence Sources

### Runtime Evidence

Examples include:

- Flare events
- authentication state
- support-provider configuration
- delivery attempts
- delivery results
- Flare Plan runs
- action completion
- checkpoint completion
- server logs, where available and verified
- application errors, where available and verified

### Operational Evidence

Maintained within Google Workspace.

Examples include:

- participant roster
- operations records
- release notes
- operator observations
- investigation notes

### Participant Evidence

Includes:

- Signals
- optional Forms
- direct conversations
- qualitative feedback

### Durable Product Evidence

Maintained within GitHub.

Includes:

- contracts
- architecture
- checkpoints
- operational decisions
- synthesized learning
- release documentation

## AI Investigation Workflow

```text
Participant Signal
        │
        ▼
Evidence Collection
        │
        ▼
Evidence Correlation
        │
        ▼
Operational Assessment
        │
        ▼
Operations Records Updated
        │
        ▼
Snapshot Generated (on demand)
        │
        ▼
Durable Learning (if appropriate)
```

## Investigation Scenarios

Each investigation begins with a participant question rather than a technical subsystem.

Examples include:

- “Nothing happened.”
- “My support person never received the message.”
- “The plan wasn’t helpful.”
- “The app crashed.”
- “The support message arrived late.”

For each scenario, the operator identifies available evidence, develops an evidence-backed assessment, records uncertainty where the evidence is incomplete, and captures any learning that should influence future product decisions.

## Current Evidence Inventory

| Lifecycle Stage | Evidence | Current Source |
|---|---|---|
| Flare initiated | Flare event | Runtime |
| Authentication | Backend authentication state | Runtime |
| Support provider selection | Provider configuration | Runtime |
| Support delivery | Delivery attempt and provider response | Runtime |
| Flare Plan generation | Flare Plan run | Runtime |
| Plan execution | Action completion records | Runtime |
| Reflection | Checkpoint completion | Runtime |
| Participant feedback | Signal or optional Form | Google Workspace |
| Operator assessment | Operations Records workbook | Google Workspace |
| Durable product learning | Contracts, checkpoints, architecture, and decisions | GitHub |

## Observability Philosophy

Flare intentionally distinguishes between runtime evidence and observability tooling.

The first private cohort prioritizes collecting sufficient evidence to answer participant questions rather than maximizing telemetry.

Additional instrumentation should only be introduced when existing evidence proves insufficient.

## Trace V0 Decision

This section intentionally remains open until completion of the Runtime Evidence Audit.

Possible outcomes:

- Existing evidence is sufficient.
- Minimal Trace V0 recommended.
- Full Trace deferred.

## Open Questions

The Runtime Evidence Audit should resolve the following questions:

- Which listed runtime evidence sources exist today and are queryable during an investigation?
- What identifiers allow participant signals to be correlated with runtime records?
- What evidence is retained, for how long, and under what privacy constraints?
- Which participant-reported scenarios cannot be investigated with current evidence?
- What is the smallest additional instrumentation needed before the first private cohort?
- Does the resulting gap justify a minimal Trace V0, or should Trace remain deferred?
