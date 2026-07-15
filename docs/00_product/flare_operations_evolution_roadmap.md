# Flare Operations Evolution Roadmap

## Status

- **Document type:** Product roadmap and design authority
- **Current maturity:** Stage 0 — Private Operations Prototype
- **Initial implementation surface:** Google Workspace
- **Primary operating program:** Flare Private Cohort V0

## Purpose

Flare Operations is the operating system through which humans understand, support, improve, and govern the evolving Flare product.

It is not merely an administrative interface for the Flare application. It is a distinct operational product concerned with the state of Flare in use: user support, product health, investigations, communications, learning, release readiness, incidents, and governed operational decisions.

The first private cohort is the first customer of Flare Operations, but it does not define the system's eventual scope. The same operating model should evolve from private testing into closed-beta support and, ultimately, public app operations.

## Product Vision

Flare Operations should provide a calm, coherent control room around the released product.

An operator should be able to understand:

- what is happening now;
- who or what needs attention;
- what has changed recently;
- which risks or failures are unresolved;
- what has been learned;
- whether a release or program is ready to proceed; and
- which action should happen next.

The mature system should reduce the burden of collecting and reconciling operational state while preserving explicit human authority for sensitive communications, safety concerns, release decisions, policy changes, and consequential actions.

## Guiding Principles

### Prototype the operating model before productizing the software

Use visible, low-cost tools to discover the real workflows, records, decisions, and operator needs before committing them to application architecture.

### Validate workflows before automating them

Automation should follow repeated, understood work. It should not encode an imagined process that has not yet been operated successfully by a human.

### Human-centered operations

Private participants and public users are people, not rows in an operations system. Direct relationships, context, dignity, and clear boundaries remain primary.

### AI-assisted, human-governed

AI may maintain briefs, organize signals, prepare investigations, identify patterns, and propose actions. Human authority remains explicit wherever judgment, safety, communication, release control, or policy is involved.

### One authoritative home for each fact

Operational views may summarize or link to authoritative records, but should not create parallel sources of truth.

### Lightweight until evidence demands more

Add structure, telemetry, automation, and dedicated software only when recurring operating needs justify the cost.

### Exception-oriented operation

The system should progressively reduce routine state collection and make meaningful exceptions, risks, decisions, and required actions easy to see.

## Operating Architecture

The current architecture separates runtime truth, live operations, durable knowledge, planning, and execution.

### Flare

Owns product runtime and application data, including user accounts, Flare events, plan activity, delivery attempts, integration state, and other runtime facts.

### Flare Operations

Owns the operational interpretation and human work around runtime facts: programs, support, actions, investigations, findings, readiness, communications, incidents, and decisions.

Flare Operations should reference runtime truth rather than become a shadow copy of the Flare application database.

### Google Workspace

Acts as the living operational workspace during the prototype and early-cohort stages. Google Docs, Sheets, and Forms provide a fast, inspectable way to validate workflows and abstractions.

Google Workspace is intentionally the first implementation, not the destination.

### GitHub

Owns durable contracts, roadmaps, checkpoints, process definitions, decision records, and implementation-ready product documentation.

### Toolbox

Owns planning and validated work: projects, sprints, work items, priorities, and lifecycle state.

### Exoskeleton

Will eventually provide governed execution for bounded operational and development workflows.

## Three-Layer Operating Model

### Records

Structured operational facts and work objects, including participants, observations, actions, investigations, findings, assessments, communications, releases, and incidents.

The Cohort Operations workbook is the initial implementation of this layer.

### Views

Purpose-built summaries derived from authoritative records, including current status, today's focus, open risks, recent activity, investigations, and release readiness.

The Flare Operations Center is the initial implementation of this layer.

### Governance

Durable definitions of how operations should run, including lifecycle definitions, ownership boundaries, safety constraints, escalation rules, pause criteria, readiness gates, and automation policies.

GitHub contracts, roadmaps, and decision records implement this layer.

## Durable Operational Abstractions

The initial Workspace should use concepts that can survive migration into a future application.

### Program

A bounded operational effort with a purpose, population, lifecycle, owner, readiness criteria, and closeout. Examples include a private cohort, closed beta, staged rollout, research study, or release-support window.

### Operational Subject

The person, account, integration, release, or system component about which operational work is being performed. During private testing, this is usually a participant.

### Lifecycle Stage

A named phase through which a program or subject progresses, with entry criteria, completion evidence, and possible next states.

### Observation

A structured signal about product behavior, user experience, usefulness, support, or operations. A form submission, conversation note, runtime anomaly, or operator observation may create one.

### Operator Action

A bounded piece of operational work with an owner, status, due context, and relationship to a program, subject, investigation, or finding.

### Support Case

A user- or operator-initiated need for help, follow-up, explanation, or resolution.

### Investigation

A structured inquiry into a problem, discrepancy, failure, or uncertain event. It connects signals, timelines, runtime evidence, affected subjects, actions, outcomes, and unresolved gaps.

### Finding

A synthesized conclusion supported by one or more observations or investigations. Findings may concern reliability, usability, usefulness, operations, support, or safety.

### Assessment

A structured evaluation against explicit criteria, such as onboarding readiness, cohort readiness, release readiness, or pause readiness.

### Decision

A governed choice with rationale, evidence, authority, implications, and follow-up actions.

### Communication

An operational message sent to a person or segment, including invitations, support replies, service notices, maintenance notices, announcements, reminders, and follow-ups.

### Release

A version or rollout unit whose readiness, deployment, known issues, monitoring, and outcome can be operated explicitly.

### Incident

A time-bounded degradation, outage, harmful failure mode, or operational disruption requiring coordinated response and resolution.

### Operations Brief

A current, opinionated view of operational state that identifies what matters now and recommends the next operator focus without becoming an additional database.

## Initial-to-Future Mapping

| Private-cohort implementation | Durable abstraction | Future public-operations use |
| --- | --- | --- |
| Private cohort | Program | Beta, release rollout, support campaign, research program |
| Participant | Operational subject | User, account, integration, release, service |
| Participant stage | Lifecycle stage | Onboarding, support, rollout, incident, or recovery stage |
| Form response | Observation | Support intake, telemetry-derived signal, survey response |
| Follow-up row | Operator action | Support task, investigation task, release action |
| Participant problem | Support case | Public user support queue |
| Session investigation | Investigation | Reliability, delivery, authentication, or integration inquiry |
| Learning log entry | Finding | Product insight, recurring issue, operational lesson |
| Launch checklist | Assessment | Release, rollout, service, or program readiness |
| Pause condition | Policy trigger | Pause rollout, disable integration, escalate incident |
| Cohort summary | Program review | Release review, operational retrospective |
| Operator Home | Operations brief | Integrated app operations dashboard |

## Operational Scope Over Time

The mature Flare Operations system may support the following connected areas.

### User Support

- support cases and conversations;
- ownership and follow-up;
- resolution state;
- recurring issue identification;
- contextual user history; and
- escalation boundaries.

### Product Health

- service and integration health;
- authentication and delivery failures;
- version and rollout state;
- degraded-feature visibility;
- meaningful anomalies; and
- health summaries.

### Investigations and Incidents

- signal intake;
- affected-user and affected-component correlation;
- timelines and evidence;
- mitigation and resolution;
- incident communications; and
- retrospectives.

### User Communications

- invitations and onboarding messages;
- in-app announcements;
- service notices;
- maintenance communications;
- targeted follow-ups;
- reminders and post-Flare check-ins; and
- communication history.

### Product Learning

- usability feedback;
- usefulness and experience findings;
- behavioral and operational patterns;
- feature requests;
- recurring friction;
- learning synthesis; and
- links to durable decisions and planned work.

### Release Operations

- release and rollout readiness;
- known issues;
- staged rollout state;
- monitoring windows;
- pause, rollback, and resume decisions; and
- post-release review.

### Safety and Escalation

- explicit non-emergency boundaries;
- sensitive-report handling;
- human-review requirements;
- escalation policies; and
- auditable consequential decisions.

## Maturity Roadmap

The stages describe increasing operational maturity, not fixed release dates. Progression should be evidence-driven.

### Stage 0 — Private Operations Prototype

**Implementation:** AI-maintained Google Workspace supervised by the product owner.

**Primary goal:** Prove the operating model during the first private cohort.

**Capabilities:**

- living operations brief;
- structured participant and program records;
- stage and follow-up tracking;
- feedback and observation intake;
- lightweight investigations;
- learning capture;
- readiness assessment; and
- program closeout.

**Exit evidence:**

- one complete operator dry run;
- one successfully operated private cohort or equivalent bounded program;
- clear identification of useful and unused records;
- documented recurring operator workflows;
- known investigation and observability gaps; and
- a closeout review with recommendations.

### Stage 1 — Repeatable Cohort Operations

**Primary goal:** Make the operating model reusable across multiple cohorts or programs.

**Capabilities:**

- reusable program creation and closeout;
- stable lifecycle definitions;
- standardized intake and triage;
- repeatable investigations;
- defined readiness and pause criteria;
- recurring operations briefs; and
- reliable links between findings, GitHub decisions, and Toolbox work.

**Migration signal:** Repeated programs can be operated without reconstructing the process each time.

### Stage 2 — Closed-Beta Operations

**Primary goal:** Support a larger population and recurring operational load with selective automation.

**Capabilities:**

- automated imports from Flare runtime data;
- overdue follow-up reminders;
- feedback categorization and triage;
- investigation correlation;
- support queues;
- operational health summaries;
- release communications; and
- exception-based alerts.

**Migration signal:** Manual reconciliation and state collection become material sources of delay or error.

### Stage 3 — Public App Operations

**Primary goal:** Reliably support a publicly released application.

**Capabilities:**

- durable support operations;
- production incident management;
- product and integration health visibility;
- announcement and notification operations;
- release and rollout controls;
- operational reporting;
- governed escalation; and
- public-support learning loops.

**Migration signal:** Google Workspace can no longer safely or efficiently serve as the primary live operations surface.

### Stage 4 — Integrated Operations Platform

**Primary goal:** Move validated abstractions and workflows into a dedicated Flare Operations application.

**Capabilities:**

- direct integration with Flare runtime facts;
- dedicated operational records and queues;
- role-appropriate operations views;
- event-driven updates;
- integrated release, support, learning, and incident workflows; and
- Workspace exports or supplemental collaboration rather than primary state.

**Migration signal:** Operational objects and workflows are stable enough to justify durable product architecture.

### Stage 5 — Governed Operations Execution

**Primary goal:** Allow Exoskeleton to execute bounded operational workflows under explicit policy and human authority.

**Candidate capabilities:**

- prepare onboarding and follow-up packets;
- compile feedback reviews;
- open or enrich investigations;
- correlate operational signals;
- draft decisions and communications;
- propose Toolbox work from validated findings;
- prepare release and program closeout reviews; and
- escalate anomalies for human judgment.

**Boundary:** Sensitive communication, safety handling, consequential user action, release control, and policy changes remain human-governed.

## Migration and Productization Criteria

A Workspace workflow becomes a candidate for dedicated software or automation when several of the following are true:

- the workflow repeats across programs or releases;
- the operational object and lifecycle are stable;
- manual updates create meaningful delay, inconsistency, or risk;
- the same information must be reconciled across several sources;
- investigations repeatedly require the same correlation steps;
- the operator needs timely alerts rather than periodic review;
- access control, auditability, or scale exceed Workspace capabilities;
- automation can reduce burden without obscuring human judgment; or
- the workflow has clear success, failure, and escalation states.

Productization should preserve the validated operating model rather than reproduce the visual structure of a spreadsheet or document.

## Current Implementation Direction

### Flare Operations Center

The current Operator Home should evolve into an AI-maintained operations brief. It should summarize, not duplicate, authoritative records.

Initial sections should include:

- current operating phase;
- today's focus;
- current programs;
- program and participant status;
- open operator actions;
- open support cases and investigations;
- current risks;
- learning highlights;
- release or program readiness;
- recent activity;
- operations-evolution status; and
- quick links to authoritative systems.

### Cohort Operations Workbook

The current workbook should evolve into the structured record layer for the prototype. Its organization should increasingly reflect durable operational objects rather than one-off documents.

Initial durable areas should include:

- programs;
- participants or operational subjects;
- actions;
- observations and feedback;
- support interactions;
- investigations;
- findings and learning;
- readiness assessments; and
- reference values.

### Forms and Intake

Forms should collect only information that answers a defined operator question, contributes to an operational record, or supports a decision. Every field should have a known destination and purpose.

### Narrative Templates

Google Docs should be used where narrative synthesis is valuable, including:

- participant or subject records when contextual notes are necessary;
- investigation reports;
- learning reviews;
- release reviews;
- program closeout reports; and
- decision drafts that may later move into GitHub.

## Explicit Current Non-Goals

Stage 0 does not attempt to:

- build the dedicated Flare Operations application;
- mirror all Flare runtime data into Workspace;
- create broad telemetry without demonstrated investigation need;
- automate sensitive participant communications;
- replace GitHub, Toolbox, or Exoskeleton responsibilities;
- support production-scale incident management;
- define every future operational object in advance; or
- optimize the first cohort workflow for hundreds of users.

## Near-Term Roadmap

1. Refactor the existing Operator Home into Flare Operations Center V0.
2. Reorganize the Cohort Operations workbook around durable operational records while preserving current useful content.
3. Audit Form Build Specifications so every field maps to an operator question and record destination.
4. Create the reusable narrative template library.
5. Operate a complete synthetic dry run from invitation through closeout.
6. Run the first private cohort.
7. Complete the observability audit and Trace V0 recommendation from demonstrated investigation needs.
8. Produce the first program closeout and update this roadmap with validated findings.

## Roadmap Governance

This document is the product-direction authority for Flare Operations.

Implementation-ready behavior belongs in focused contracts under `docs/00_product/contracts/`. Bounded decisions and state snapshots belong under `docs/00_product/checkpoints/`. User experience and copy decisions belong under `docs/10_design/`. Technical architecture belongs under `docs/20_architecture/`. Rollout and validation guidance belongs under `docs/40_delivery/`.

The roadmap should be updated when operating evidence changes the intended destination, maturity model, system boundaries, or durable abstractions. Routine cohort state should remain in the live operations workspace rather than being copied here.
