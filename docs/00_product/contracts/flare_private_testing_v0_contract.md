Flare Private Testing V0 Contract

Status

Implementation-ready product contract.

Purpose

Flare Private Testing V0 defines the conditions under which Flare may be made available to its first bounded cohort of approximately three to five invited participants.

The cohort is also the first practical exercise of Flare's Release Operations and Learning model. It must validate not only the application, but also the lightweight human workflows used to launch, support, investigate, learn from, and improve a live release.

This contract governs:

* What the private test includes.
* Who may participate.
* How participants receive access and configure Flare.
* What participants should expect from the application and from the developer.
* What safety, privacy, operational, and product boundaries apply.
* How product, experience, and operational evidence is gathered and interpreted.
* How validated findings become decisions, durable knowledge, and governed work.
* When the private test may begin, pause, resume, conclude, or expand.
* How the cohort should improve future Flare releases and reusable application-release practices.

This contract does not redefine the underlying Flare Plan, Flare response experience, authentication, or External Support Channel contracts. Those documents remain authoritative for their respective product areas.

The private-cohort operating tools are intentionally provisional. The operational concepts and responsibilities defined here should remain useful even if their implementation later moves from Google Workspace into Flare, Toolbox, Exoskeleton, or another governed system.

Terminology

This contract generally uses participant for a person invited into the cohort. Tester may still be used when referring specifically to software-testing activity, existing tester-facing document names, established private-testing procedures, or technical validation roles.

Product Intent

The private test exists to determine whether Flare’s current V0 experience is understandable, reliable, and useful in realistic but controlled use.

The test should validate whether a user can:

1. Understand what Flare is for.
2. Sign in and configure the application.
3. Create a short personal Flare Plan.
4. Optionally connect an existing GroupMe support group.
5. Send a test Flare without confusion.
6. Initiate a real Flare when needed.
7. Understand whether the external support message was delivered.
8. Use or decline the offered Flare Plan.
9. Return to the application later without losing important configuration or history.
10. Report problems and feedback through a known support path.

The first private cohort is not intended to prove broad market demand, clinical effectiveness, crisis-response effectiveness, or production-scale reliability.

The cohort may gather structured feedback from counselors, therapists, social workers, peer-support specialists, or other relevant professional reviewers. Such review is advisory product and experience evaluation. It is not clinical validation, research approval, treatment testing, or authorization to make health-outcome claims.

Release Operations and Learning Context

The Private Test Operator Package must be lightweight enough for one developer to operate with approximately three to five invited participants while being structured around concepts that can evolve into longer-term release and support operations.

The package is both:

* A practical operating environment for the first Flare cohort.
* A learning environment for improving Flare's product-development, release, support, investigation, and validation systems.

The objective is not to build public-scale operations in advance. The objective is to establish a clear operating model, exercise it with real participants, identify what is useful or missing, and preserve the lessons that should shape subsequent releases.

Guiding Principles

Human-Centered Operations

* The first cohort should be managed through direct, respectful relationships.
* Participants are people helping shape the product, not an anonymous source of telemetry.
* Conversations, observations, and professional judgment may provide more useful evidence than aggregate analytics at this scale.
* Operational structure must support human contact rather than replace it.

Lightweight but Structured

* Every operational artifact must have a defined purpose and owner.
* The package must avoid dashboards, analytics pipelines, enterprise observability, and automation that are unnecessary for the bounded cohort.
* A manual process is acceptable when it is clear, safe, repeatable, and realistically manageable by one operator.
* Information must not be collected merely because it might someday be interesting.

Design for Evolution

* Durable operational concepts should be separated from their temporary implementation.
* Participant, feedback, observation, investigation, decision, learning, work-item, and release-readiness concepts should remain understandable if the supporting tools change.
* The initial implementation may use Google Workspace without committing Flare to Google Workspace as its permanent operations platform.
* Temporary cohort procedures must be distinguishable from practices intended to survive into public release.

Evidence Before Tooling

* Existing Flare records must be evaluated before adding new telemetry.
* A new operational record or automation must answer a stated operator question or learning objective.
* Trace V0 must not be implemented solely because tracing is generally useful.
* New observability must be justified by demonstrated investigation ambiguity, delay, repeated manual correlation, or missing evidence.

Learning Is a Deliverable

* The cohort must improve both Flare and the system used to build and operate Flare.
* Significant observations must be interpreted rather than merely accumulated.
* Validated findings should become an explicit decision, contract update, operating change, release criterion, Toolbox work item, or documented decision not to act.
* Lessons applicable beyond Flare should be identified for future application-release processes.

Validation Tracks

The first cohort operates through three related but distinct validation tracks.

Product Validation

Product validation asks whether the software works as represented.

It includes:

* Authentication and account access.
* Configuration and persistence.
* Flare creation.
* Flare Plan behavior.
* GroupMe connection and delivery reporting.
* Reliability, defects, errors, and recovery.
* Interface comprehension and usability.

Experience Validation

Experience validation asks whether Flare is understandable, supportive, trustworthy, and meaningfully helpful in the situations for which it is intended.

It includes:

* Whether participants understand Flare's purpose.
* Whether the experience supports clarity rather than increasing confusion.
* Whether wording, pacing, and interaction demands feel appropriate.
* Whether any language creates unintended shame, pressure, alarm, or false reassurance.
* Whether participants hesitate, disengage, or lose trust at meaningful points.
* Whether the local plan and external-support concepts feel useful in realistic scenarios.
* Feedback from participants using Flare and advisory review from relevant professionals.

Experience validation must not be described as clinical testing or proof of therapeutic effectiveness.

Operations Validation

Operations validation asks whether one operator can responsibly launch, support, investigate, learn from, pause, resume, and close the cohort.

It includes:

* Participant onboarding and status tracking.
* Support intake and follow-up.
* Issue classification and prioritization.
* Correlation of user reports with existing Flare records.
* Incident communication.
* Release-readiness decisions.
* Operator burden and information needs.
* Movement of validated findings into durable documentation and Toolbox work.
* Identification of procedures that should be retained, changed, automated, or retired before the next release stage.

Operating-System Responsibilities

The first-cohort operating model assigns distinct responsibilities to existing systems.

GitHub Documentation

GitHub is the authoritative home for durable knowledge, including:

* Product contracts.
* Design and safety boundaries.
* Operator procedures and runbooks.
* Release and validation guidance.
* Decision checkpoints.
* Synthesized cohort findings.
* Reusable release-process lessons.

Raw day-to-day participant tracking and informal notes should not be copied into GitHub merely for preservation.

Google Workspace

Google Workspace is the live operator layer for the cohort.

It may contain:

* Participant roster and onboarding state.
* Setup and first-session checklists.
* Structured feedback intake.
* Professional-review intake.
* Issue and investigation tracking.
* Observation and learning logs.
* Release-readiness checklists.
* Active follow-up actions.

The Google Workspace implementation must avoid collecting unnecessary sensitive information and must remain manageable by one operator.

Flare Operational Data

Flare remains authoritative for application behavior and account-owned application state, including:

* Flare event records.
* Flare Plan and plan-run records.
* Action outcomes.
* External-support configuration.
* GroupMe delivery-attempt records.
* Health endpoint output.
* Existing operational logs.

The operator package must not duplicate application records manually when a reference, timestamp, identifier, or investigation note is sufficient.

Toolbox

Toolbox is the planning and work-intake layer.

Validated findings may become:

* Work items.
* Sprint candidates.
* Prioritized defects.
* Product or design follow-up.
* Operational-improvement work.
* Documentation work.

Raw feedback should not become a Toolbox work item before it has been interpreted sufficiently to define actionable work.

Exoskeleton

Exoskeleton is the future governed execution environment for approved work.

The private cohort does not require new Exoskeleton capability, but its findings should be structured so approved work can later enter governed execution without reconstructing the original evidence and decision.

Operator Learning Loop

The cohort must support the following loop:

1. Operate the current release.
2. Observe participant, product, and operational behavior.
3. Capture the minimum evidence needed to understand the observation.
4. Interpret whether the observation represents a defect, usability issue, experience concern, feature request, operational gap, or isolated preference.
5. Decide whether to act, investigate further, defer, accept, or explicitly decline.
6. Convert approved action into the appropriate durable artifact or Toolbox work item.
7. Validate the resulting change.
8. Review what the incident or feedback revealed about the operating process itself.

The active operator layer should maintain a lightweight Learning Log that distinguishes at least:

* Product learning.
* UX learning.
* Experience or emotional-safety learning.
* Technical learning.
* Support learning.
* Operations learning.
* Release-process learning.
* Research or feedback-method learning.

A learning record should state what was observed, how it was interpreted, what decision or experiment followed, and whether it applies only to the current cohort, to future Flare releases, or to reusable application-release practice.

Observability and Trace Decision

Before the first participant is invited, the operator package must document the operational information already available through Flare's current records, health endpoint, and logs.

The observability audit must identify:

* Which operator questions can already be answered.
* Which records or logs answer each question.
* Which investigations require correlation across multiple records.
* Which important questions cannot currently be answered.
* Which information would be useful but is not necessary for the first cohort.
* What privacy or access boundaries apply to operator investigation.

During the cohort, investigations should record when practical:

* The participant report or triggering observation.
* Approximate event time.
* Records consulted.
* Whether a definitive explanation was found.
* Information that was missing or ambiguous.
* Whether the investigation was materially delayed by manual correlation.

A lightweight Trace V0 is justified only when this evidence demonstrates a recurring need to reconstruct a Flare chronologically and existing records do not support that task clearly enough.

If justified, Trace V0 should provide the smallest useful chronological view of one Flare lifecycle by referencing or composing existing events. It must not introduce production-scale metrics, distributed tracing, analytics infrastructure, alerting platforms, or broad behavioral surveillance.

Cohort Boundary

The first private cohort should contain approximately three to five testers.

Participation is:

* Invitation-only.
* Individually approved by the developer.
* Revocable.
* Limited to the current private-testing period.
* Subject to the supported environments and limitations in this contract.

Access by one tester does not authorize that tester to distribute credentials, invitation links, internal instructions, screenshots containing another person’s information, or unpublished application details to others.

Supported Scope

The private test includes the following supported capabilities where present in the current build.

Application Orientation

* First-use Welcome experience.
* Explanation of Flare’s purpose.
* Access to the Flare, History, Customize, and About experiences currently included in the build.
* Reopening introductory product information after first use.

Authentication

* Creating or accessing an approved Flare account through the currently supported Supabase authentication flow.
* Email/password or magic-link authentication where enabled in the test environment.
* Remaining signed in across ordinary application sessions, subject to current session behavior.
* Signing out and signing back in.

Personal Flare Configuration

* Configuring the supported personal preparation content.
* Creating and ordering a Flare Plan.
* Adding starter actions.
* Adding custom actions.
* Editing, reordering, and archiving active plan actions.
* Viewing structural readiness indicators.

Flare Use

* Initiating a Flare.
* Creating a local Flare event.
* Receiving the existing response experience.
* Beginning, declining, completing, or ending a Flare Plan early.
* Completing supported reflection or checkpoint behavior where implemented.
* Viewing supported historical information.

External Support Channel

* Connecting one supported GroupMe account.
* Selecting one existing GroupMe group.
* Confirming the predefined message.
* Sending a clearly marked test Flare.
* Enabling, disabling, reconnecting, or replacing the configured channel where supported.
* Sending the predefined message to the configured group when a real Flare is initiated.
* Seeing whether the provider reported delivery success or failure.

Tester Feedback

* Reporting defects, confusing behavior, delivery failures, privacy concerns, and general feedback through the designated private-test support channel.
* Participating in reasonable follow-up questions about reported behavior.
* Receiving notices about material test interruptions, required updates, or test closure.

Explicit Non-Goals

Private Testing V0 does not include or promise:

* Public availability.
* App Store or general Play Store availability.
* Production service-level guarantees.
* Twenty-four-hour support.
* Guaranteed uptime.
* Guaranteed GroupMe delivery.
* Guaranteed supporter awareness or response.
* Emergency dispatch.
* Crisis intervention.
* Clinical assessment.
* Medical advice.
* Mental-health treatment.
* Diagnosis.
* Monitoring of tester safety.
* Monitoring of GroupMe replies.
* Supporter accounts.
* In-app group messaging.
* Group member management.
* Delivery escalation trees.
* Automated emergency contacts.
* Location tracking.
* Presence or availability tracking.
* Multiple simultaneous external support groups.
* Per-Flare custom message composition.
* Background detection of distress.
* Automatic initiation of a Flare.
* Payment, subscriptions, or billing.
* Large-scale analytics validation.
* Controlled experiments or clinical outcome claims.
* Availability to minors.
* Support for unapproved devices, browsers, providers, or operating environments.
* Permanent retention guarantees for private-test data.
* Migration guarantees from the private-test environment into a later production release.

A requested feature does not become supported merely because a tester expected it or found a partial interface for it.

Tester Eligibility

A tester is eligible for the first cohort only when all of the following are true:

* The tester is at least 18 years old.
* The tester has been directly invited and approved by the developer.
* The tester understands that Flare is unfinished private-test software.
* The tester understands that Flare is not an emergency or crisis-response service.
* The tester can use an approved device and supported browser or application environment.
* The tester has reliable access to the email address used for authentication.
* The tester can report defects and provide candid feedback.
* The tester agrees not to rely on Flare as their only means of obtaining urgent help.
* The tester agrees not to enter another person’s confidential information without that person’s permission.
* The tester accepts that access may be paused or withdrawn.
* The tester has a direct way to contact the developer outside Flare if the application is unavailable.

A GroupMe account is not required to explore signed-out orientation or the local planning concept, but it is required to test the GroupMe integration.

A tester evaluating GroupMe should already have:

* A GroupMe account.
* An existing group appropriate for receiving test and real Flare messages.
* Permission or reasonable agreement from group participants to use that group for the test.
* An understanding that messages sent to GroupMe become subject to GroupMe’s own systems, membership, notification settings, retention, and privacy practices.

Tester Exclusions

The first cohort must not include a person when:

* They are under 18.
* They expect Flare to function as emergency monitoring or emergency dispatch.
* They cannot understand or accept the private-test limitations.
* They would be materially endangered by a delayed, failed, duplicated, or misdirected message.
* They do not have another appropriate way to seek urgent assistance.
* They intend to use Flare to monitor or control another person.
* They intend to test using another person’s account or identity.
* They cannot protect their login access on the test device.
* The developer cannot provide a reliable onboarding or support channel for them.

Exclusion from this test is a product-risk decision, not a judgment about the person’s need for support.

Onboarding Contract

Each tester must receive a concise onboarding package before or at the time access is granted.

The package must include:

1. A statement that the build is private, unfinished, and invitation-only.
2. The supported access URL or installation instructions.
3. The tester’s approved sign-in email.
4. Instructions for creating or accessing the account.
5. A plain-language explanation of signed-out and signed-in behavior.
6. Instructions for configuring a short Flare Plan.
7. Optional GroupMe connection instructions.
8. Instructions to send a test Flare before relying on the integration.
9. A privacy summary.
10. The emergency boundary.
11. Known limitations.
12. The support and feedback channel.
13. Instructions for reporting a failed or unexpected real Flare.
14. Instructions for leaving the test and requesting deletion where supported.

The onboarding material must not require the tester to read the full internal product contract before using the application.

Required Onboarding Sequence

The recommended first-session sequence is:

1. Open Flare using the approved access method.
2. Read the Welcome content.
3. Sign in using the approved email account.
4. Review the Customize experience.
5. Configure at least one personally meaningful Flare Plan action.
6. Review the order of the plan actions.
7. Optionally connect GroupMe.
8. Select the intended GroupMe group.
9. Confirm the displayed predefined message.
10. Tell relevant group members that a clearly marked test message will be sent.
11. Send a test Flare.
12. Confirm that the message appeared in the intended group.
13. Return to Flare and verify that configuration remains present.
14. Review how to report a problem.
15. Review the emergency boundary before concluding onboarding.

The onboarding process should encourage a short, understandable plan rather than a large or elaborate configuration.

Access Instructions Contract

The exact private-test URL, build identifier, credentials, and environment-specific steps must live in the tester-facing onboarding material rather than in this durable product contract.

Access instructions must:

* Identify the supported device or browser environment.
* State whether the build is web-based, installable, or both.
* Use the current approved production-preview or private-test endpoint.
* Avoid exposing backend secrets, service-role keys, provider tokens, database credentials, or internal administrative interfaces.
* Explain any expected browser permission or redirect behavior.
* State how to recover from an expired magic link or failed sign-in.
* Tell the tester whom to contact when access fails.
* Be updated whenever the approved environment changes.

Each released private-test build or materially changed deployment should have a human-readable build or release identifier available to the tester or support operator.

Signed-Out Capability Contract

A signed-out person may:

* Open the supported Flare entry point.
* View the current Welcome or orientation experience.
* Understand the high-level purpose of Flare.
* Navigate through any intentionally public informational surfaces.
* Begin the supported sign-in or account-access flow.

A signed-out person must not be led to believe that persistent personal configuration, history, external support delivery, or an authenticated Flare event has been saved when it has not.

Private Testing V0 does not require signed-out persistence of:

* Flare Plans.
* Flare history.
* GroupMe configuration.
* External support delivery attempts.
* Account-owned customization.
* Cross-device state.

The signed-out experience should remain useful as orientation, but it is not the full private-test product.

Signed-In Capability Contract

A signed-in approved tester may use the currently implemented authenticated capabilities, including:

* Saving personal configuration.
* Configuring and editing a Flare Plan.
* Accessing account-owned data.
* Connecting the supported external support provider.
* Initiating authenticated Flare events.
* Receiving the authenticated response experience.
* Accessing supported history or persisted state.
* Returning on another supported session or device where the current authentication and persistence model permits.

Signing in does not guarantee that every optional capability is configured, reachable, or operational.

The interface must continue to distinguish:

* Signed in from signed out.
* Configured from not configured.
* Local Flare creation from external message delivery.
* Delivery success from delivery failure.
* Test messages from real Flare messages.

Flare Plan Expectations

The Flare Plan is a short, user-defined sequence of predetermined actions that may be offered after the user initiates a Flare.

For the private test:

* A plan may contain starter-derived and custom actions.
* The tester controls the wording and order of their actions.
* The plan may be changed between Flare events.
* Changes apply to future runs rather than rewriting historical runs.
* An empty plan is permitted.
* The absence of a plan must not falsely appear as a configured plan.
* Plan readiness means only that the structural configuration requirement is met.
* Plan completion, skipping, or early ending must not be described as success, failure, recovery, treatment, or clinical progress.
* Flare does not determine whether a tester’s plan is safe, appropriate, or effective.

Testers should be encouraged to avoid entering highly sensitive details when a shorter neutral action would work.

GroupMe Expectations

GroupMe is an optional external support channel for this cohort.

When enabled, Flare attempts to post the tester’s predefined support message to one configured GroupMe group.

The tester should expect that:

* The configured group is an existing GroupMe conversation.
* Group membership is controlled in GroupMe, not Flare.
* Group members do not need Flare accounts.
* A test Flare posts a real message into the selected group.
* Test messages must be visibly identified as tests.
* A real Flare uses the configured predefined message.
* The message is not composed separately for each send.
* Flare records and displays the delivery result available from the provider integration.
* Flare may create the local Flare event even if GroupMe delivery fails.
* A delivery-success result does not prove that any group member saw, understood, or responded to the message.
* GroupMe notifications may be disabled, delayed, filtered, or affected by the recipient’s device and account settings.
* GroupMe’s availability and behavior are outside Flare’s direct control.

Before enabling the channel, the tester should tell relevant group members:

* That Flare may post test and real support messages.
* What the message generally means.
* That Flare does not assign obligations or guarantee anyone’s availability.
* What response, if any, the tester personally hopes for.
* That urgent emergencies should not depend on the GroupMe message.

GroupMe Limitations

Private Testing V0 does not:

* Read GroupMe replies.
* Display the GroupMe conversation.
* Detect acknowledgements.
* Determine which members received or read a message.
* Confirm that anyone is available.
* Add or remove group members.
* Create a Flare-managed support network.
* Escalate to another person or group after failure.
* Retry indefinitely.
* Contact emergency services.
* Monitor the group after sending.
* Synchronize chat history into Flare.

A tester must not interpret silence inside Flare as evidence that no one replied in GroupMe, because Flare does not read those replies.

Privacy Summary

Flare Private Testing V0 uses account-owned information necessary to provide the current experience.

Depending on the tester’s use, this may include:

* Authentication identity such as email address and account identifier.
* Saved Flare configuration.
* Flare Plan actions and ordering.
* External support-channel configuration.
* GroupMe destination identifiers and display names.
* The predefined support message.
* Flare event and plan-run records.
* Action outcomes such as done, skipped, or not reached.
* Delivery-attempt status and timestamps.
* Supported checkpoint or reflection responses.
* Operational logs required to diagnose failures.

Provider credentials and tokens must remain backend-controlled and must not be intentionally exposed to the mobile or web client.

The tester should assume that information sent to GroupMe is also processed and retained according to GroupMe’s own systems and policies.

Private Testing V0 must not claim:

* End-to-end encryption unless it has been separately implemented and verified.
* Anonymous use for authenticated features.
* Zero data retention.
* Clinical-record protections.
* HIPAA compliance.
* Guaranteed deletion from external providers.
* Guaranteed permanent preservation of private-test data.

Data Minimization Expectations

The tester should be advised to:

* Use concise plan actions.
* Avoid including diagnoses, medication details, legal information, financial information, addresses, or other highly sensitive details unless essential to their own use.
* Avoid including confidential information about other people.
* Use a GroupMe group whose membership they understand.
* Review the predefined message before sending a test or enabling real use.
* Report suspected account access or misdirected messages promptly.

The product should collect only the data necessary for implemented private-test capabilities and operational diagnosis.

Account and Data Ownership

Each authenticated tester’s Flare configuration and history must remain isolated from other testers through the existing ownership and authorization model.

A tester must not be able to:

* Read another tester’s plan.
* Modify another tester’s plan.
* Read another tester’s Flare events.
* Use another tester’s support-channel configuration.
* Access another tester’s provider credentials or tokens.
* Trigger delivery through another tester’s connected account.

Administrative access used for support or diagnosis should be limited to what is operationally necessary.

Support Expectations

Private-test support is best-effort developer support, not an on-call service.

The onboarding package must identify one authoritative support channel, such as a dedicated email address or direct messaging channel.

Testers may use that channel for:

* Access problems.
* Sign-in problems.
* Incorrect or failed delivery behavior.
* Unexpected duplicate messages.
* Configuration loss.
* Privacy concerns.
* Confusing interface behavior.
* Defects.
* Requests to leave the test.
* Requests concerning their private-test data.

Support expectations must state:

* The developer may not respond immediately.
* Flare may be temporarily unavailable while a problem is investigated.
* A reported issue may require logs, screenshots, timestamps, device details, or reproduction steps.
* Testers should redact unrelated personal information from screenshots.
* The support channel must not be used as an emergency contact.
* The developer cannot monitor the tester’s wellbeing through Flare.
* Lack of a developer response does not imply that a Flare or GroupMe message was received by anyone else.

Defect Reporting Minimum

A useful tester defect report should include, where possible:

* Approximate date and time.
* Device and browser or application environment.
* Whether the tester was signed in.
* The action being attempted.
* What the tester expected.
* What actually occurred.
* Any visible error message.
* Whether GroupMe received a test or real message.
* Whether retrying changed the result.
* A screenshot with unrelated personal content removed.
* Whether the problem could create a privacy or safety concern.

Testers should not send passwords, magic-link tokens, provider tokens, or other secrets in a defect report.

Known Limitations

The initial private cohort must be informed of at least the following current limitations:

* The product is unfinished and may contain defects.
* Access may depend on a limited private deployment rather than a fully managed production environment.
* Availability and performance may change without a production service-level guarantee.
* Authentication links or sessions may expire.
* A supported browser or device may behave differently from another environment.
* GroupMe connection or callback flows may be affected by browser redirects or provider availability.
* GroupMe delivery can fail even when the local Flare event succeeds.
* A successful provider response does not confirm human receipt or response.
* Flare does not read GroupMe replies.
* Only one active external support channel is supported per tester.
* Only one GroupMe destination is supported at a time.
* Message customization occurs during configuration, not at send time.
* Flare Plan actions are intentionally bounded and are presented one at a time during an active run.
* The tester may use Flare without a configured GroupMe channel.
* The tester may have no configured Flare Plan.
* Some checkpoint or reflection behavior may remain incomplete or subject to change.
* History, deletion, export, account recovery, and cross-device behavior may not yet meet final production expectations.
* Operational fixes may require temporarily disabling access.
* Private-test data may need to be reset before a later release.
* Changes to the build may alter screens, wording, or behavior during the test.

The tester-facing limitation list must be kept synchronized with material changes discovered during cohort validation.

Emergency Boundary

Flare is not an emergency service.

Flare does not:

* Contact 911 or another emergency number.
* Dispatch emergency responders.
* Guarantee that a support message is delivered.
* Guarantee that anyone sees or responds to a message.
* Monitor the tester.
* Detect emergencies.
* Assess risk.
* Provide crisis counseling.
* Replace an emergency plan, healthcare provider, crisis line, trusted person, or local emergency service.

A tester must not rely on Flare as the sole method for obtaining urgent help.

The application and tester-facing onboarding must communicate, in plain language:

Flare is not an emergency service. If you may be in immediate danger or need urgent help, contact local emergency services or another appropriate source of immediate assistance directly. Do not wait for a Flare or GroupMe response.

This boundary should be visible during onboarding and available later from an informational or About surface.

It should not be presented in alarmist language during every ordinary interaction, but it must not be hidden solely inside internal documentation or legal text.

Entry Criteria for the First Cohort

The first private cohort may begin only when all mandatory criteria below are satisfied.

Product Criteria

* The approved private-test build is identifiable.
* Welcome and orientation content are present.
* Signed-out and signed-in states are understandable.
* Approved testers can sign in.
* A signed-in tester can save a Flare Plan.
* A signed-in tester can initiate a local Flare event.
* A configured plan can be offered and progressed.
* A tester with no configured plan receives a usable response rather than broken plan controls.
* Delivery success and failure are visibly distinct.
* A failed external delivery does not prevent use of the local plan experience.
* Test messages are clearly marked as tests.
* Real messages are not marked as tests.

GroupMe Criteria

* The approved GroupMe connection flow completes in the private-test environment.
* The tester can select one intended group.
* The tester can review the predefined message.
* A test Flare reaches the intended group in live validation.
* Disconnect or reconnect behavior has been reasonably validated.
* Tokens and provider secrets are not exposed to the client.
* An intentional or simulated delivery failure appears as failure rather than success.

Privacy and Ownership Criteria

* Authenticated reads and mutations enforce user ownership.
* One tester cannot access another tester’s plan, event, history, or support-channel data.
* The tester-facing privacy summary exists.
* The tester-facing emergency boundary exists.
* A known process exists for removing a tester’s access.
* A known process exists for addressing a tester data request, even if parts remain manual during V0.

Operational Criteria

* The approved frontend and backend endpoints are reachable.
* The health check succeeds.
* Required environment and CORS configuration are verified.
* The developer can identify a failed backend or frontend deployment.
* A rollback or access-disable procedure is documented.
* A tester support channel is active.
* The developer has a current tester roster and contact method outside Flare.
* Known severe defects have been reviewed and either fixed or accepted with an explicit rationale.
* A smoke-test checklist has passed against the actual private-test environment.

Onboarding Criteria

* The tester invitation and onboarding instructions are complete.
* The onboarding instructions use the current URLs and flows.
* The tester eligibility criteria are applied.
* Each tester acknowledges the unfinished nature of the software.
* Each tester receives the privacy summary, known limitations, support path, and emergency boundary.
* GroupMe testers understand that the test message will appear in the real selected group.

Entry requires all mandatory criteria, not merely a successful local development run.

Cohort Launch Procedure

The first cohort should be launched incrementally.

Recommended order:

1. Complete developer-operated smoke testing.
2. Onboard one tester.
3. Observe onboarding and first-session friction.
4. Resolve any blocking or high-risk issue.
5. Add the next tester.
6. Continue until the approved three-to-five-person cohort is active.

The full cohort should not be invited simultaneously when sequential onboarding could reveal a shared blocking defect first.

For each tester, record at minimum:

* Approved tester identifier.
* Invitation date.
* Access status.
* Onboarding completion status.
* GroupMe test status, when applicable.
* Current participation status.
* Material unresolved issue, when applicable.
* Exit or removal date.

The roster must not be exposed inside ordinary application interfaces.

Pause Criteria

New onboarding must pause, and active testers should be notified when appropriate, if any of the following occurs:

* A tester can access another tester’s private data.
* Provider tokens, authentication secrets, or administrative credentials are exposed.
* A real or test Flare is delivered to the wrong GroupMe destination.
* The application reports delivery success when the provider attempt clearly failed.
* A defect causes repeated or uncontrolled external messages.
* The application materially misrepresents the emergency boundary.
* Authentication is broadly unavailable.
* Persisted configuration is being lost or corrupted across testers.
* A deployment cannot reliably distinguish the approved frontend and backend environments.
* A known vulnerability creates material account or privacy risk.
* The developer cannot reach testers through the external tester contact channel.
* The operational environment is unstable enough that test results would be misleading.
* A tester reasonably believes Flare is providing emergency monitoring or guaranteed support and that misunderstanding cannot be corrected promptly.
* The current build no longer matches the onboarding or privacy information supplied to testers in a material way.

A minor cosmetic defect, isolated non-blocking layout issue, or clearly communicated temporary inconvenience does not automatically require a full cohort pause.

Rollback Criteria and Actions

Rollback means returning to the last known acceptable build, disabling a capability, or withdrawing access while preserving evidence needed to diagnose the issue.

Rollback should be used when:

* A newly deployed build introduces a pause-level defect.
* The current build cannot be repaired safely through a narrow forward fix.
* GroupMe behavior becomes unsafe, misleading, or uncontrolled.
* Authentication or ownership enforcement regresses.
* Data integrity cannot be trusted.
* The private deployment is accidentally exposed more broadly than intended.

Available rollback actions may include:

* Restore the previous approved frontend build.
* Restore the previous approved backend build.
* Disable or hide GroupMe connection.
* Disable external sends while preserving local Flare behavior.
* Disable new account onboarding.
* Revoke tester access.
* Rotate exposed credentials or provider tokens.
* Reset affected test configuration after preserving necessary diagnostic evidence.
* Notify affected testers of what happened and what action they should take.
* Require testers to repeat the GroupMe test before re-enabling real use.

Rollback must not silently leave testers believing that an unavailable capability remains operational.

Resume Criteria

A paused test may resume only when:

* The triggering problem has been understood sufficiently to act safely.
* The defect has been fixed, disabled, or bounded.
* Relevant secrets have been rotated when exposure was possible.
* Affected data has been inspected or repaired where applicable.
* Focused automated or manual regression checks pass.
* The actual private-test deployment passes a new smoke test.
* Tester-facing instructions and known limitations have been updated.
* Affected testers have been informed when their expectations or required actions changed.
* The developer explicitly records the decision to resume.

Private-Test Success Signals

The private test should collect evidence about:

* Whether testers understand Flare’s purpose.
* Whether signed-out versus signed-in behavior is clear.
* Whether account access is reliable enough for the cohort.
* Whether testers can create a meaningful short plan.
* Whether GroupMe setup is understandable.
* Whether testers understand that test messages enter the real group.
* Whether external delivery status is trusted and understandable.
* Whether plan offer, progression, decline, and early ending are understandable.
* Whether users can distinguish the local Flare experience from external support delivery.
* Whether the emergency boundary is understood.
* Whether support and defect reporting are workable.
* Which known limitations materially interfere with real use.
* Whether any privacy or ownership concern arises.
* Whether the product remains operationally manageable for the developer.
* Whether participants experience Flare as clear, supportive, and trustworthy.
* Whether wording or interaction creates unintended pressure, shame, confusion, alarm, or false reassurance.
* Whether professional reviewers identify experience, safety, framing, or boundary concerns.
* Whether existing operational records answer real support questions efficiently.
* Whether investigation friction justifies a lightweight Trace V0.
* Whether the Google Workspace operator layer captures useful evidence without creating unnecessary burden.
* Whether validated findings move cleanly from observation to decision to durable knowledge or Toolbox work.
* Which operating practices should survive into the next release stage.
* Which procedures were only appropriate for the first bounded cohort.
* Which lessons should inform future application-release practices.

Anecdotal positive feedback alone is not sufficient evidence to expand access. Aggregate counts alone are also insufficient at this cohort size; decisions should consider the underlying experiences, context, operational evidence, and unresolved risk.

Exit Criteria for Completing the First Cohort

The first-cohort phase may be considered complete when:

* Approximately three to five approved testers have been onboarded or a documented decision explains a smaller completed cohort.
* Each tester has completed the core onboarding flow or has a documented reason for stopping.
* GroupMe-capable testers have attempted the supported connection and test-message flow.
* The cohort has exercised both local Flare behavior and the authenticated plan experience.
* Material defects and confusion points have been recorded.
* All privacy, ownership, misdelivery, duplicate-send, and emergency-boundary concerns have been resolved or have a documented decision.
* The developer has reviewed support burden and operational stability.
* Known limitations have been updated to match observed behavior.
* There is a written Flare Private Cohort Findings report covering functionality, usability, experience, helpfulness, trust, professional-review findings, what changed, and what remains uncertain.
* There is a written Release Operations Learning Review covering operator needs, useful and missing information, investigation friction, support burden, effective and ineffective intake methods, practices to retain or retire, and changes required before the next release stage.
* The active Learning Log has been reviewed and durable findings have been transferred to the appropriate contract, checkpoint, delivery guidance, or Toolbox work item.
* Temporary cohort procedures have been distinguished from durable release-operation practices.
* An explicit decision has been made about whether Trace V0 is unnecessary, deferred, or justified by observed investigation evidence.
* The next decision is explicitly one of:
    * Continue the same cohort.
    * Run another bounded private cohort.
    * Pause for product changes.
    * Prepare for broader private testing.
    * Stop the test.

Exit Criteria for Expanding Beyond Private Testing

Flare must not expand beyond bounded private testing until all of the following are true:

Product Understanding

* Testers consistently understand Flare’s purpose without substantial developer explanation.
* Signed-out and signed-in capabilities are not materially misleading.
* The Flare Plan interaction is usable during realistic testing.
* GroupMe delivery status and limitations are understood.
* The emergency boundary is visible and consistently understood.

Reliability

* No unresolved severity-one privacy, ownership, authentication, misdelivery, duplicate-send, or data-corruption defect remains.
* Core flows have passed repeated validation in the actual deployed environment.
* Operational recovery procedures are documented and have been exercised.
* The release process can identify the deployed build and restore a previous acceptable build.
* Known provider failures degrade honestly rather than appearing successful.

Privacy and Account Control

* User isolation has been validated.
* Tester access can be granted and revoked intentionally.
* Data handling and deletion expectations are documented at the level required for the next release stage.
* Provider credentials remain backend-controlled.
* Tester-facing privacy and emergency information accurately reflect the implementation.

Support and Operations

* The developer can reasonably support the proposed larger cohort.
* There is a defined incident and tester-communication process.
* Monitoring is sufficient to detect major service failure without depending solely on tester reports.
* Feedback can be received, triaged, and associated with a build or environment.
* Expansion would not exceed the practical capacity of the current deployment.

Evidence

* The first cohort outcome is documented.
* Repeated feedback themes have been separated from isolated preferences.
* Blocking issues have been resolved.
* Remaining limitations are acceptable for the proposed next cohort and clearly communicated.
* The rationale for expansion identifies what has been learned and what the larger test is intended to learn next.

Expansion requires an explicit product decision. It must not occur automatically because the application appears stable for a few days.

Acceptance Criteria

This contract is implemented when:

* It is stored as the authoritative private-testing contract under docs/00_product/contracts/.
* Existing Flare Plan, response, authentication, and support-channel contracts remain authoritative and are referenced rather than duplicated.
* A tester-facing onboarding guide exists and conforms to this contract.
* A tester-facing privacy and emergency summary exists.
* A private-test known-limitations document or section exists and can be updated independently of this durable contract.
* A first-cohort entry checklist exists.
* A launch roster and onboarding status can be tracked outside the ordinary application UI.
* The Google Workspace operator package has defined structures for participants, feedback, issues or investigations, observations or learning, and release readiness.
* Participant and professional-review feedback can be distinguished without representing professional review as clinical approval.
* Existing operational data sources and their supported operator questions are documented.
* Investigation friction can be recorded before a Trace implementation decision is made.
* A validated finding has a defined path into a decision, durable documentation, or Toolbox work item.
* A pause, rollback, and resume checklist exists.
* A private-test smoke-test procedure validates the actual deployed environment.
* Each invited participant receives the required information before relying on Flare.
* The developer can make and record an explicit go, pause, rollback, resume, close, or expand decision.
* The cohort closeout requires both a Flare Private Cohort Findings report and a Release Operations Learning Review.
* The operator package remains usable by one operator without requiring an in-app administration dashboard or enterprise operations tooling.

Governing Principle

The first private test should be deliberately small, human-centered, honest, structured, and reversible.

Flare should enter the cohort only when it can clearly communicate what it does, accurately report what happened, protect each participant's account-owned information, and fail without pretending that support was delivered.

The operator package should support the immediate cohort while establishing durable operational concepts that can evolve into Flare's longer-term release and support model without prematurely building for public scale.

The private test is successful when it produces trustworthy product, experience, operational, and release-process learning; converts validated learning into clear decisions and governed work; and does not ask participants to assume capabilities, protections, or clinical authority Flare does not provide.

Flare is developed through an evolving system of contracts, workflows, tools, validation practices, and learning loops. This cohort should strengthen not only the application, but also the system by which Flare and future applications are designed, built, released, operated, and improved.
