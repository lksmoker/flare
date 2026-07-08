Flare Pre-Launch Readiness

Purpose

This is a living readiness document for Flare.

It records the current state of pre-launch thinking across product readiness, infrastructure, operations, support, safety, legal preparation, monetization, and launch controls.

This document is intentionally flexible and should be revisited as Flare develops, real usage evidence becomes available, and launch assumptions change.

It is not:

* An implementation contract
* A fixed launch checklist
* A frozen product decision
* A substitute for detailed architecture, security, legal, or delivery documentation

When a topic becomes sufficiently settled, it should graduate into the appropriate authoritative document.

Examples:

* Product decisions belong in docs/00_product
* Implementation-ready behavior belongs in docs/00_product/contracts
* Technical architecture belongs in docs/20_architecture
* Launch procedures and validation guidance belong in docs/40_delivery
* Completed or superseded evidence belongs in docs/90_archive

This document remains the front door for ongoing Flare pre-launch readiness discussions.

⸻

Current Readiness Posture

Flare is still in active product and implementation development.

The core product direction is becoming clearer:

* A user creates a Flare Plan containing actions that may help interrupt compulsive behavior.
* The user may connect an external support group, beginning with GroupMe.
* During a difficult moment, the user can execute plan actions and send a predefined support signal.
* Flare owns the trigger, configuration, delivery attempt, delivery result, and user-facing status.
* The external messaging provider owns the group conversation and supporter response.
* Flare is not intended to become a general recovery-management platform, crisis-monitoring system, or chat application.

Before a broad public release, Flare will need more than a functioning consumer experience. It will also need enough operational, support, safety, and administrative capability to manage real users responsibly.

⸻

Working Assumptions

The following assumptions are current working beliefs rather than final conclusions.

User lifecycle

Flare may have a relatively short active-user lifecycle.

A user may actively rely on Flare for several weeks or months and then stop using it because:

* Their compulsive behavior has improved
* Their interruption habits have strengthened
* They no longer need active external support
* Their circumstances have changed
* They have moved on from the product
* The product did not provide enough value

Reduced usage is therefore not automatically a negative outcome.

Flare should eventually distinguish between:

* Healthy graduation
* Temporary inactivity
* Continued standby use
* Product abandonment
* Failed activation

Traditional engagement metrics such as indefinite retention, streaks, and daily active usage may not accurately represent Flare’s value.

Active-user population

Infrastructure planning should focus more heavily on active users than cumulative registrations.

A useful initial model is:

Active users approximately equal new activated users per month multiplied by average active lifetime in months.

For example, if users remain active for approximately three months:

New activated users per month    Approximate active users
100    300
1,000    3,000
5,000    15,000
10,000    30,000
50,000    150,000

This suggests Flare could accumulate a substantial total user base while maintaining a much smaller active operational population.

User populations to track

Flare should distinguish between:

* Registered users
* Users who completed onboarding
* Users with a configured Flare Plan
* Users with a configured external support channel
* Monthly active users
* Users executing plan actions
* Users sending flares
* Concurrent users
* Inactive or graduated users

These groups have different product, infrastructure, support, and cost implications.

⸻

Infrastructure Readiness

Initial scale target

A reasonable initial production posture is to support approximately:

* 10,000 to 50,000 registered users
* 1,000 to 10,000 monthly active users
* Low hundreds of simultaneous requests
* Short bursts several times above normal traffic
* Far fewer actual flare sends than application opens

The current architecture should not be prematurely expanded into distributed microservices solely in anticipation of hypothetical scale.

A well-indexed Postgres-backed system and modest API deployment should be sufficient for early public usage if provider integrations and send flows are designed carefully.

Primary scaling risks

The first meaningful limits may be operational rather than raw database capacity.

Likely scaling and reliability risks include:

* External provider API limits
* Provider outages or degraded performance
* Authentication failures
* Duplicate send prevention
* Retry behavior
* Delivery-state ambiguity
* Abuse and automated misuse
* Observability gaps
* Support burden during incidents
* Long-term storage of inactive-user data

Reliability priority

Flare should optimize for reliability during emotionally difficult moments rather than for continuous high-volume engagement.

The app should make it clear:

* Whether a flare was requested
* Whether it is still sending
* Whether the provider accepted it
* Whether delivery could be confirmed
* Whether it failed
* Whether retrying is safe
* Whether duplicate protection prevented another send

Graceful degradation

Flare should continue providing value when an external provider is unavailable.

Where possible:

* Saved plans should remain readable
* Personal plan actions should remain usable
* Authentication should remain available
* Provider-specific failures should not disable the entire application
* The affected feature should show a clear status and explanation
* The user should not be presented with a send action that cannot succeed

A full application shutdown should remain a last resort.

⸻

Support Model

Support philosophy

Human support should not be part of the live Flare response loop.

A user should not need to contact Flare support in order to determine:

* Whether their plan saved
* Whether their support channel is configured
* Whether their flare was sent
* Whether it is safe to retry
* Which group received the message
* What happened when delivery failed

The product itself must provide immediate and understandable status.

Human support should primarily investigate unusual problems after the fact.

Likely support categories

Setup and configuration

Expected questions may include:

* Why will GroupMe not connect?
* Why does Flare say configuration is incomplete?
* Which support group is connected?
* Why did a test flare not arrive?
* How can the user change their support group?
* Why does the configuration screen disagree with the readiness screen?

Delivery

Expected questions may include:

* Did the flare send?
* Why does it show failed?
* Why did the message arrive twice?
* Why did the app report failure even though the message arrived?
* Did the flare go to the wrong group?
* Is GroupMe currently unavailable?

Account and billing

If Flare introduces subscriptions, expected questions may include:

* Password reset
* Account lockout
* New device access
* Subscription restoration
* Cancellation
* Refund requests
* Incorrect entitlement state
* Account deletion
* Data export

Safety-boundary contacts

Some users may contact Flare support during highly distressed moments.

Flare support must not be represented as:

* Crisis counseling
* A monitored emergency service
* Clinical care
* A guaranteed response channel
* A substitute for the user’s selected support network
* A service that can guarantee provider delivery or supporter response

Support procedures and product wording must clearly maintain this boundary.

Initial support channel

A lean early support model may include:

* A dedicated support email address
* An in-app help area
* A structured report-a-problem form
* Automatically attached diagnostic metadata
* Documented response templates and escalation procedures
* Basic admin tooling
* Error monitoring and outage alerts

Live chat and phone support are not currently assumed to be required.

Support response expectations

Flare should avoid promising immediate human response.

A possible public support expectation is:

Support requests are reviewed during normal business operations. Flare support is not monitored for emergencies.

The exact wording should be reviewed as part of safety, legal, and support readiness.

⸻

Admin and Support Operations

Need for an admin tool

A secure admin tool is considered a pre-public-release requirement.

Direct database inspection may be acceptable during development and very small private testing, but it is not an appropriate primary operating model for a public product.

The admin tool should help answer:

What happened, and what is safe for an administrator to do about it?

It should not become a general-purpose database editor or a mechanism for manually operating Flare on behalf of users.

Admin tool areas

The admin capability should likely be divided into:

1. User and support diagnostics
2. Operational controls
3. System health
4. Audit history

⸻

User and Support Diagnostics

User lookup

Administrators should be able to search using safe identifiers such as:

* Email
* User ID
* Send-attempt ID
* Support-channel identifier
* Provider-linked diagnostic identifier where appropriate

User status

A user view may include:

* Account status
* Account creation date
* Last activity date
* Onboarding status
* App version
* Subscription state, when applicable
* Data-deletion or suspension state

Configuration status

The admin view may include:

* Whether the Flare Plan is configured
* Number of saved plan actions
* Whether an external support channel is configured
* Provider name
* Selected group display name
* Connection status
* Last successful test send
* Last configuration change
* Whether the client and server configuration states agree

Delivery history

For each send attempt, the admin tool should show safe diagnostic data such as:

* Request time
* Provider
* Destination display name
* Send status
* Provider response category
* Retry count
* Duplicate-prevention outcome
* Final result
* Correlation or trace identifier
* Relevant application version
* Relevant error category

The admin tool should not expose raw provider tokens, secrets, or unnecessary message contents.

Safe admin actions

Possible V0 support actions include:

* Resend a verification or setup email
* Disable or reset a broken provider connection
* Copy a redacted diagnostic summary
* Mark a case for investigation
* Begin an account-deletion workflow
* Suspend an abusive account

Administrators should not casually be allowed to:

* Send a flare on a user’s behalf
* Change a user’s plan without explicit consent
* Read unnecessary private data
* View provider credentials
* Impersonate the user
* Silently alter delivery history

⸻

Operational Controls

Purpose

Operational controls should allow Flare to respond to incidents, provider failures, security concerns, unexpected growth, and release problems without requiring an emergency deployment for every situation.

These controls must be server-enforced.

Hiding a feature only in the frontend is not sufficient.

Provider controls

GroupMe and future providers should support more than a single enabled-or-disabled state.

Useful states may include:

Enabled

* New configuration allowed
* Existing configuration allowed
* Test sends allowed
* Flare sends allowed

Degraded

* Existing functionality remains available
* The app shows a warning or incident notice
* Delivery may be delayed or less reliable

Configuration disabled

* New connections are blocked
* Connection changes may be blocked
* Existing configured users may still send

Sending disabled

* Configuration may remain available
* Test or production sends are blocked
* Personal Flare Plan actions remain available

Fully disabled

* Configuration, testing, and sending are unavailable

This allows Flare to isolate the failing capability rather than disabling the entire app.

Signup controls

The admin operations surface should support controlled enrollment modes such as:

* Open signup
* Invite-only
* Allowlisted beta
* Waitlist
* Signup temporarily paused
* Capacity reached
* Closed enrollment

Pausing new signup should not automatically disable sign-in for existing users.

The user-facing experience should show a managed explanation rather than a generic failure.

Announcements

Flare should support in-app announcements and incident banners.

An announcement may include:

* Title
* Message
* Severity
* Audience
* Start time
* Expiration time
* Dismissible or persistent state
* Optional action
* Active or inactive state

Potential audiences include:

* All users
* Signed-in users
* Users with GroupMe configured
* Users affected by a specific provider
* Users on an affected app version
* Beta users
* Newly registered users

Example use cases include:

* GroupMe delivery delays
* GroupMe configuration outage
* Scheduled maintenance
* Security-related notices
* Required app updates
* New signup restrictions
* Known delivery-status issues

Provider incident state and provider announcements should be coordinated so that they cannot easily contradict each other.

Application version controls

Flare should eventually support:

* Recommended update
* Required update
* Minimum supported version
* Version-specific incident messaging
* Blocking versions with known safety or delivery defects

Maintenance controls

Potential future controls include:

* Read-only mode
* Pause outbound retries
* Pause selected background jobs
* Disable a specific feature
* Restrict access to beta allowlists
* Limit rollout by cohort
* Require a newer client version
* Full maintenance mode

A full maintenance mode should be reserved for severe cases.

High-impact control safeguards

Operational controls must include:

* Strong server-side authorization
* Multi-factor authentication
* A restricted administrator allowlist
* Required reason entry for significant changes
* Confirmation before high-impact actions
* Display of the expected impact
* Complete audit history
* Clear current-state indicators
* Automatic expiration where appropriate
* Protection against conflicting control states
* A recovery path if the admin UI is unavailable

An action such as disabling GroupMe sending should make the impact explicit before confirmation.

Example:

This action will block external flare delivery for all currently configured GroupMe users. Saved plans and personal plan actions will remain available.

⸻

System Health and Incident Visibility

The admin operations surface should provide a basic view of system health.

Useful initial indicators include:

* Flare sends attempted today
* Successful sends
* Failed sends
* Pending or ambiguous sends
* Success rate by provider
* Provider latency
* Authentication failures
* Retry queue status
* Duplicate-prevention events
* API error rate
* Current incidents
* Active operational controls
* Current announcements
* Signup mode
* Minimum supported app version

The goal is to quickly distinguish:

* A single-user configuration issue
* A provider-specific incident
* A release regression
* A system-wide outage
* Abuse or anomalous traffic

⸻

Admin Security and Privacy

The admin tool creates a highly sensitive access path.

At minimum, it should require:

* Separate admin authorization from ordinary user access
* Multi-factor authentication
* Server-side role validation
* Short-lived sessions
* Least-privilege access
* Complete audit logs
* No provider secrets returned to the browser
* Redaction of unnecessary private data
* Protection from access through the ordinary consumer interface
* Explicit production access controls

Audit events should record:

* Administrator identity
* User or system record accessed
* Action performed
* Time
* Reason
* Previous value
* New value
* Result

Even if there is initially only one administrator, the system should be designed for eventual role separation.

⸻

Safety and Trust Readiness

Product boundary

Flare helps users execute a personal interruption plan and notify a selected support group.

Flare does not guarantee:

* Message delivery
* Provider availability
* Supporter availability
* Supporter response
* A particular health outcome
* Emergency intervention
* Clinical support

Failure communication

Failure messaging should be direct without being alarming or misleading.

The app must distinguish between:

* Flare did not send the request
* Flare sent the request but the provider rejected it
* The provider accepted the request
* Final delivery cannot be confirmed
* The message may have arrived despite an ambiguous response
* A duplicate send was prevented

Support-group expectations

Before public release, Flare should define how users are informed that:

* Their support group should understand what a flare means
* Group members may not respond immediately
* The external provider may fail
* Flare does not monitor the group conversation
* The user should not rely on Flare as their only emergency option

Crisis and emergency boundary

The exact product copy, support procedures, and legal language for crisis or emergency situations remain open readiness work.

This should be treated as a dedicated pre-launch concern rather than handled informally.

⸻

Monetization Considerations

Current pricing idea

A possible future price is approximately $2 per month.

This price may communicate:

* Low commitment
* Accessibility
* Ongoing maintenance
* Availability of a dependable support tool

It may also create friction for:

* Users who are uncertain whether Flare will help
* Younger users
* Users with limited income
* Users in distress
* Users who only need Flare briefly

Short active lifetime

If a typical user subscribes for approximately three months:

* Gross lifetime revenue at $2 per month is approximately $6
* Net revenue after store fees, taxes, refunds, and operating costs will be lower

This would make Flare dependent on inexpensive acquisition channels such as:

* Organic recommendation
* Support-group exposure
* Therapists or coaches
* Community partnerships
* Nonprofit partnerships
* Earned media
* Content
* Referrals

It would not support expensive paid acquisition without materially different retention or pricing.

Subscription tension

A subscription creates an important ethical and product question:

What happens when a user no longer needs Flare regularly?

Flare should not manufacture engagement or guilt users into maintaining a subscription.

Possible lifecycle states include:

* Active
* Standby
* Paused
* Graduated
* Cancelled
* Reactivated

Post-cancellation access

An unresolved decision is what remains available after cancellation.

Possible principles include:

* The user can still view their saved plan
* Personal plan actions remain available
* Data export remains available
* Data deletion remains available
* External support sending may require reactivation
* A user should not encounter a confusing payment barrier during a high-distress moment

The exact entitlement model remains open.

Possible pricing structures

Options to evaluate later include:

* $2 monthly subscription
* Discounted annual subscription
* One-time purchase
* Free core plan with paid external delivery
* Free early-access period
* Sponsored access
* Gift subscriptions
* Therapist-funded access
* Nonprofit-funded access
* No-questions-asked accessibility program

Current monetization posture

Pricing should likely not be finalized until Flare has better evidence regarding:

* Activation rate
* Real flare usage
* Average active lifetime
* Support burden
* Provider cost
* Infrastructure cost
* Willingness to pay
* Cancellation reasons
* Graduation behavior
* Reactivation behavior

A free or highly controlled early release may provide better product evidence than immediately introducing billing.

⸻

Business and Legal Readiness

Entity formation

A legal business entity should likely be in place before:

* A broad public beta
* Subscription revenue
* Public app-store distribution
* Meaningful production data collection
* Vendor or contractor agreements
* External ownership contributions
* Business insurance
* Formal partnerships

Entity formation is one part of readiness, not a substitute for product safety, privacy, security, insurance, or correct public claims.

Additional business readiness

Potential pre-launch needs include:

* Business bank account
* Accounting process
* Tax handling
* Vendor agreements
* Contractor intellectual-property assignment
* Ownership of code, design, and brand assets
* Insurance review
* App-store account ownership
* Domain and email ownership
* Support email ownership
* Payment and subscription administration
* Refund process
* Incident ownership

Legal and policy readiness

Before public release, Flare will likely need:

* Terms of service
* Privacy policy
* Data retention policy
* Data deletion policy
* Support policy
* Safety and emergency disclaimers
* Acceptable-use policy
* Subscription and refund terms
* Provider integration disclosures
* Incident-response process
* Security contact process

Legal review should focus particularly on Flare’s behavioral-health-adjacent context, user expectations, external delivery dependency, and sensitive user data.

⸻

Data and Privacy Readiness

Open pre-launch topics include:

* What user-authored content is stored
* Whether flare messages are stored
* Whether support-group names are stored
* How long send history is retained
* How inactive accounts are handled
* Whether graduated users remain in the database
* How account deletion affects delivery logs and audit records
* How provider tokens are encrypted and rotated
* What data appears in logs
* What data administrators may view
* What data is exported
* Whether analytics data can be linked to identity
* Which vendors process sensitive information

The system should retain enough information to support reliability and incident investigation without collecting unnecessary content.

⸻

Public-Release Readiness Areas

The following areas are currently considered part of the public-release conversation.

Consumer product

* Complete onboarding
* Flare Plan setup
* Individual plan-action persistence
* Clear configuration status
* External support-channel connection
* Test send
* Send Flare
* Clear delivery state
* Safe retry behavior
* Graceful provider failure
* Useful error states
* Data deletion and account management

Infrastructure

* Production deployment
* Database backups
* Monitoring
* Error tracking
* Provider observability
* Rate limiting
* Abuse protection
* Retry controls
* Idempotency
* Incident logging
* Capacity validation
* Secret management
* Environment separation

Admin and operations

* User lookup
* Configuration diagnostics
* Delivery diagnostics
* Provider controls
* Signup controls
* Announcements
* App-version controls
* Audit history
* System-health view
* Account suspension
* Account deletion support
* Incident-response controls

Support

* Support email
* Help content
* Report-a-problem flow
* Diagnostic attachment
* Support playbook
* Safety-boundary responses
* Refund and billing procedures
* Incident communication
* Response-time expectations

Legal and business

* Entity formation
* Insurance review
* Terms
* Privacy policy
* Data policy
* App-store readiness
* Billing ownership
* Accounting
* Tax treatment
* Vendor agreements
* Intellectual-property ownership

Safety and trust

* Clear product boundary
* External provider disclosure
* Delivery limitations
* Support-response limitations
* Crisis and emergency language
* Support-group expectation setting
* Secure admin access
* Privacy protections
* Responsible claims

⸻

Current Pre-Launch Requirements

The following items currently appear likely to be required before broad public release:

1. A reliable complete user flow
2. Clear flare delivery-state handling
3. Graceful GroupMe degradation
4. Secure production authentication
5. A bounded admin and operations tool
6. Provider kill switches and degradation controls
7. Signup mode controls
8. In-app announcement capability
9. System-health and delivery observability
10. Admin audit logging
11. Account deletion capability
12. Support process and support boundary
13. Safety and emergency wording
14. Privacy and terms documentation
15. Legal entity formation
16. Insurance and legal review
17. Production incident procedure
18. Defined beta and public-launch criteria

This list should be revised as readiness work becomes more concrete.

⸻

Explicit Non-Goals

The current pre-launch direction does not require:

* A full recovery-management platform
* Continuous user monitoring
* Crisis-center operations
* Human review of every flare
* In-app support-group chat
* A general admin database editor
* Large-scale enterprise administration
* Complex multi-provider orchestration
* Elaborate microservice infrastructure
* Artificial engagement loops
* Indefinite retention as the main success metric
* A fully automated support organization
* Broad clinical functionality

⸻

Open Questions

User lifecycle

* What is the actual average active lifetime?
* What does healthy graduation look like?
* Should Flare offer a formal graduation state?
* Should users remain in standby indefinitely?
* What signals distinguish success from abandonment?
* How should reactivation work?

Scale

* What percentage of registered users complete configuration?
* What percentage send a real flare?
* How often do active users send flares?
* What concurrency and burst patterns occur?
* What are provider rate limits?
* What is the actual cost per active user?

Support

* What support contact rate should be expected?
* What response-time commitment is sustainable?
* What support requests require special safety handling?
* What diagnostic data can safely be attached to tickets?
* What support actions should administrators be allowed to perform?

Admin operations

* Which controls belong in Admin Operations V0?
* Which controls require elevated confirmation?
* Should provider state and announcement state be linked?
* What fallback exists if the admin tool is unavailable?
* What admin roles will eventually be needed?
* Which events require immutable audit records?

Monetization

* Should Flare launch free?
* When should pricing be introduced?
* Is $2 per month sustainable?
* Should annual pricing be offered?
* What remains available after cancellation?
* Should external sending be the paid boundary?
* Should sponsored access be supported?
* How should users in financial hardship be handled?

Business and legal

* When exactly should the legal entity be formed?
* What insurance is appropriate?
* What claims can Flare safely make?
* What policies require legal review?
* How should liability involving external provider failure be addressed?
* What data-retention period is appropriate?

Launch model

* Closed beta or public beta?
* Invite-only or open signup?
* How many early users can be supported well?
* What criteria move Flare from private test to closed beta?
* What criteria move Flare from closed beta to public release?
* What incident history is acceptable before broader release?

⸻

Deferred Decisions

The following should remain open until supported by evidence or deeper design work:

* Final subscription price
* Annual versus monthly billing
* Post-cancellation sending access
* Formal graduation behavior
* Exact support response commitment
* Exact admin roles
* Full provider-state model
* Exact announcement targeting
* Long-term retention policy
* Final infrastructure capacity target
* Final public-launch date
* Whether additional messaging providers are required before launch

⸻

Likely Follow-Up Documents

As decisions mature, this document may produce or update more authoritative documents such as:

Product

* Flare public-launch scope
* Flare user lifecycle and graduation decision
* Flare monetization decision
* Flare support and safety boundary

Contracts

* Admin Operations V0 contract
* Provider Operational Controls V0 contract
* Announcement and Incident Messaging V0 contract
* Signup Control V0 contract
* Account Lifecycle and Deletion contract
* Subscription Entitlement contract

Architecture

* Admin authorization architecture
* Operational-control persistence contract
* Provider-state architecture
* Send-attempt observability architecture
* Audit-log architecture
* Subscription architecture
* Data-retention architecture

Delivery

* Public-launch readiness checklist
* Closed-beta rollout plan
* Incident-response guide
* GroupMe outage runbook
* Security-response guide
* Production validation plan
* Support operations guide

Archive

* Closed-beta findings
* Load-test evidence
* Incident summaries
* Launch decision snapshots
* Completed readiness reviews

⸻

Readiness Update Practice

Future Flare conversations that affect public-launch readiness should revisit this document.

Updates should:

* Revise assumptions when evidence changes
* Add newly discovered readiness concerns
* Remove concerns that no longer apply
* Mark decisions that have graduated into authoritative documents
* Link to contracts, architecture documents, and delivery procedures
* Preserve open questions that still require discussion
* Avoid treating speculative ideas as settled requirements
* Avoid duplicating detail already owned by another authoritative document

This document should remain concise enough to navigate while broad enough to preserve the evolving pre-launch conversation.

⸻

Current Summary

Flare may serve users intensely for a relatively short period rather than becoming a permanent daily-use product.

That lifecycle may keep the active user population meaningfully smaller than cumulative registrations, but it does not reduce the importance of reliable delivery, provider resilience, operational controls, support readiness, privacy, and safe public expectations.

The highest-priority pre-launch operational needs currently appear to be:

* Reliable flare delivery state
* Graceful provider degradation
* User and delivery diagnostics
* GroupMe operational controls
* Signup controls
* In-app announcements
* App-version controls
* System-health visibility
* Secure admin access
* Audit logging
* Support and safety boundaries
* Legal, privacy, and business readiness

The purpose of this document is to keep that broader readiness conversation visible and updateable while Flare continues to evolve.