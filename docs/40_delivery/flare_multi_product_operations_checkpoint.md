Flare Multi-Product Operations Checkpoint

Status

Checkpointed direction for pre-launch planning.

This document captures the current decision regarding Flare administration, Exoskeleton support tooling, incident response, and the broader company structure around future software products.

Decision Summary

Flare should not be treated as the sole or defining product of the future business entity.

The intended business model is a software-product company that can create, own, operate, and support multiple applications over time. Flare is the first customer-facing product within that portfolio.

The same principle should guide the design of internal operational tooling.

The planned Flare admin capability should not become a standalone, Flare-specific administration system unless product constraints eventually require one. Instead, it should be explored as the first product integration into a reusable Exoskeleton product-operations and support capability.

Business Direction

The future LLC should be structured and named broadly enough to support the development and operation of multiple software products.

The company would:

* own product intellectual property
* publish and operate applications
* manage vendor and platform relationships
* receive product revenue
* fund shared infrastructure and operating costs
* manage privacy, security, support, and compliance obligations
* support future products without requiring a new legal identity for each application

Flare would retain its own product identity, branding, policies, pricing, and customer experience while remaining one product owned and operated by the broader company.

The business entity should therefore not be conceptually or legally limited to Flare alone.

Exoskeleton Direction

Exoskeleton should be treated as the company’s reusable internal system for building, operating, supporting, and improving software products.

Its role may eventually include:

* product and project planning
* implementation lifecycle management
* incident intake and triage
* operational controls
* customer-support workflows
* governed repair proposals
* execution approval
* automated validation
* deployment and rollback coordination
* audit history and evidence preservation

Flare would be the first real product to exercise these capabilities, but the shared model should remain product-neutral.

Product Operations Model

The shared Exoskeleton operations model should organize incidents and support activity around a generic product record rather than around Flare-specific concepts.

A reusable incident could include:

* product
* environment
* affected capability
* severity
* detection source
* customer or user impact
* occurrence count
* current operational status
* available mitigation
* linked support cases
* proposed repair
* validation evidence
* communication status
* final resolution

The shared operational lifecycle is:

Detect → Triage → Mitigate → Repair → Validate → Communicate → Resolve

This lifecycle belongs to Exoskeleton.

Each product supplies its own product-specific context, controls, severity rules, and user-impact interpretation.

Flare as the First Product Integration

Flare would provide the first implementation of the product-operations contract.

Flare-specific operational information may include:

* failed support-signal delivery
* failed Send Flare attempts
* GroupMe integration health
* support-group configuration failures
* sign-up availability
* provider disablement controls
* user fallback behavior
* affected-user follow-up
* in-app announcements

These capabilities may be presented through a Flare-specific operations workspace or adapter within Exoskeleton while relying on shared incident, execution, validation, and audit infrastructure underneath.

Product-Specific and Shared Boundaries

Shared Exoskeleton responsibilities

* incident creation
* incident status and severity
* evidence collection
* investigation workflow
* repair proposal generation
* work-intent creation
* mutation safety classification
* human approval
* governed execution
* validation
* review
* resolution history
* audit evidence

Product-specific responsibilities

* product health signals
* product terminology
* customer-impact interpretation
* severity escalation rules
* operational controls
* fallback behavior
* customer communication content
* provider-specific diagnostics
* product-specific repair and rollback actions

Incident and Repair Direction

The longer-term vision may build on the earlier Automated Incident Response System concept.

When an application failure occurs, the system may eventually:

1. create a durable incident
2. show the user an appropriate acknowledgement
3. collect relevant logs and execution context
4. group related failures
5. propose likely causes
6. suggest mitigation or rollback
7. prepare a governed repair proposal
8. require human approval before mutation
9. execute the approved repair
10. validate the result
11. support communication with affected users
12. require an explicit resolution decision

Detection, evidence gathering, and investigation may become highly automated.

Production repair should remain human-gated unless a future policy explicitly defines a narrow class of preapproved, reversible actions.

Flare Safety Consideration

Flare failures may interrupt a user’s immediate support path.

The system must distinguish between ordinary application failures and failures affecting an active attempt to send a support signal.

A failed Send Flare action may require:

* elevated incident severity
* immediate fallback instructions
* alternate support actions
* clear disclosure that the signal may not have been delivered
* affected-user follow-up
* provider mitigation or disablement

This product-specific safety behavior belongs in the Flare integration while the surrounding incident lifecycle remains reusable.

Initial Pre-Launch Scope

The initial pre-launch capability does not require a complete automated incident-repair platform.

A practical first operations surface may include:

* incident visibility
* failed operation counts
* affected capability
* affected users where appropriate
* sanitized technical evidence
* integration health
* disable-integration controls
* disable-sign-up controls
* announcement publishing
* incident status management
* mitigation notes
* resolution notes
* user follow-up tracking

Repair proposal generation, governed execution, deployment automation, and automated validation may follow in later phases.

Design Principle

Build from Flare, generalize at the boundary.

Flare should provide the first concrete operational requirements.

Shared Exoskeleton models should be named and structured around products, incidents, support activity, operations, and governed repair rather than around Flare-specific concepts.

The goal is not to prematurely create a generalized platform. The goal is to avoid embedding assumptions that would make the first shared capabilities unusable for a second product.

Architectural Direction

The current conceptual structure is:

Company layer

Owns products, infrastructure, operating policies, vendor relationships, and shared business obligations.

Exoskeleton layer

Provides reusable development, support, operations, incident, repair, validation, and audit capabilities.

Product integration layer

Defines each application’s:

* health signals
* incident types
* severity rules
* product-specific evidence
* available operational controls
* customer-impact information
* safe mitigations
* repair actions
* rollback actions
* communication behavior

Product layer

Provides the customer-facing experience, branding, policies, and product-specific runtime behavior.

Current Decision

Flare’s pre-launch admin capability should be explored as the first product-specific operations extension within Exoskeleton.

The underlying support and incident capabilities should be designed to support future products owned by the same company.

Flare is the first product use case, not the permanent boundary of either the business entity or the operational tooling.

Deferred Questions

The following remain intentionally unresolved:

* final LLC name
* whether Exoskeleton remains exclusively internal
* whether product operations becomes a dedicated Exoskeleton lifecycle surface
* exact product integration contract
* incident persistence model
* deployment and rollback integration
* customer-support case model
* notification and escalation channels
* degree of automated diagnosis
* classes of actions eligible for preapproval
* whether any Flare administration must remain inside the Flare repository or runtime

These questions should be resolved through later product, architecture, and delivery work rather than expanded inside this checkpoint.