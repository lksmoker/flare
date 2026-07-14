# Flare Private Cohort Operator Workspace V0 Checkpoint

Date: 2026-07-14
Status: Accepted for operator review

## Decision

Flare will use Google Workspace as the live operator layer for the first invited private cohort of approximately three to five participants.

This checkpoint records completion of the initial Flare Private Cohort Operator Workspace V0 and confirms that the workspace is ready for operator review before participant onboarding begins.

## Workspace Created

The Google Drive workspace includes:

- A top-level `Flare Private Cohort V0` folder.
- An Operator Home document.
- A Cohort Operations workbook.
- A Form Build Specifications document.
- Supporting folders for participant operations, feedback and reviews, investigations and learning, release readiness, and cohort closeout.

The Cohort Operations workbook includes dedicated tabs for:

- Participants.
- Onboarding.
- Feedback.
- Investigations.
- Learning Log.
- Release Readiness.
- Lists & Configuration.

## Operating Boundary

The current system boundary is:

- **Flare** remains authoritative for application behavior and account-owned application data.
- **GitHub documentation** remains authoritative for contracts, durable operating procedures, checkpoints, and synthesized findings.
- **Google Workspace** holds active cohort operations, structured feedback, investigation notes, learning, and readiness state.
- **Toolbox** holds validated actionable work, sprint planning, and prioritization.
- **Exoskeleton** remains the future governed execution environment for approved work.

The first cohort does not require an in-app operator dashboard.

## Validation Model

Participant testing will use staged but human-centered validation:

1. First impression and orientation.
2. Setup and onboarding.
3. Guided simulated Flare.
4. Independent use.
5. Closeout reflection.

The workspace distinguishes:

- Product validation: whether Flare functions as represented.
- Experience validation: whether Flare is understandable, supportive, trustworthy, and meaningfully helpful in the situations for which it is intended.
- Operations validation: whether one operator can responsibly launch, support, investigate, learn from, pause, resume, and close the cohort.

Professional review remains advisory product and experience evaluation. It is not clinical validation or proof of therapeutic effectiveness.

## Forms Limitation

The Google Drive connector can create and edit the supporting folders, Docs, and Sheets, but it does not currently create Google Forms.

The Form Build Specifications document defines the intended participant and professional-review Forms. The Forms themselves remain a manual operator setup step, after which their links should be added to the Operator Home and related workflow materials.

## Observability and Trace

Trace V0 remains deferred pending the current-observability audit and real investigation evidence.

The first cohort should use existing Flare event records, plan-run records, GroupMe delivery-attempt records, health information, and logs before introducing new telemetry.

A lightweight Trace V0 should be considered only if recurring support investigations demonstrate slow, ambiguous, or error-prone manual correlation across those existing records.

## Next Step

The operator should review the Google Workspace structure and content for usability, then:

1. Create the specified Google Forms.
2. Add Form links to the Operator Home.
3. Confirm permissions and privacy settings.
4. Run a complete operator dry run using a fictional participant.
5. Complete the current-observability audit before inviting the first participant.

## Governing Reference

This checkpoint is governed by:

`docs/00_product/contracts/flare_private_testing_v0_contract.md`
