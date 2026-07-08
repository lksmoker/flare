# Flare Plan V0 Contract

## Status

Implementation-ready product and domain contract for Flare Plan V0.

Exact HTTP routes, request payloads, response payloads, and error codes must be defined in an API contract before API implementation begins.

## Purpose

Flare Plan V0 gives a user an optional, short, user-defined sequence of actions to follow immediately after initiating a Flare.

The feature turns the Flare response screen from a static summary into a guided walkthrough. The user may begin the plan, move through one action at a time, mark each action done or skipped, end the plan early, and complete an optional checkpoint.

Flare Plan supports the immediate Flare Event. It is not a general recovery-management, treatment, coaching, habit-tracking, or long-term behavior-management system.

## Product Boundary

Flare exists to help a user:

1. Interrupt an unwanted pattern.
2. Notify an existing support network.
3. Follow a short, predetermined response sequence.
4. Record a lightweight account of what happened during that Flare Event.

Flare Plan V0 does not include:

- Daily recovery tracking.
- Sobriety or abstinence counters.
- Streaks, scores, badges, or gamification.
- Treatment plans.
- Clinician or sponsor management.
- Journaling programs.
- Habit coaching.
- Personalized behavioral recommendations.
- Broad analytics dashboards.
- Automated claims about which actions caused improvement.
- Branching or adaptive plans.
- Timed exercises.
- Recurring reminders outside an active Flare Event.

A proposed capability is in scope only when it directly supports preparation for, execution of, or lightweight reflection on a Flare Event.

A useful boundary test is:

> Does this capability help the user prepare for, move through, or briefly reflect on a Flare Event, or does it attempt to manage the user's broader recovery?

Capabilities in the second category are outside Flare Plan V0.

## Core Concepts

### Flare Event

A Flare Event represents the overall user-initiated interruption and support-signaling event.

A Flare Event may include:

- The Flare trigger.
- External support-message delivery attempts and results.
- An offered Flare Plan.
- The user's progress through that plan.
- An optional final checkpoint.

The Flare Event remains valid even when external support-message delivery fails.

### Flare Plan

A Flare Plan is the user's saved, ordered collection of actions intended for use immediately after initiating a Flare.

Flare Plan V0 supports one active Flare Plan per user.

An empty plan is permitted but is considered not configured.

### Flare Plan Action

A Flare Plan Action is one independently saved step in the user's plan.

Each saved action has:

- A stable identity.
- A required title.
- An optional short description.
- An explicit position.
- An active or archived state.
- Creation and update timestamps.

Only active actions are included in new Flare Plan Runs.

Actions are presented one at a time during an active run.

### Flare Plan Run

A Flare Plan Run represents the offer, decline, partial use, or completed use of a Flare Plan during one Flare Event.

A Flare Event may have at most one Flare Plan Run in V0.

The run preserves the exact plan actions presented for that event.

### Event-Time Action

An Event-Time Action is the snapshotted representation of one saved Flare Plan Action within a particular Flare Plan Run.

It preserves:

- The source saved-action identity, when one exists.
- The title shown during the event.
- The description shown during the event.
- The action's position in the run.
- The action outcome.
- Relevant timestamps.

Later edits to the saved plan must not modify historical Event-Time Actions.

### Checkpoint

A checkpoint is an optional, lightweight assessment offered at the end of a completed or intentionally ended Flare Plan Run.

It records how the user reports feeling and may record one simple next choice.

The checkpoint is not a clinical assessment, treatment recommendation, or measure of recovery success.

## Configuration Contract

The Configure screen must provide a Flare Plan section.

The user must be able to:

- View their active ordered actions.
- Add an action.
- Edit an action.
- Archive an action.
- Reorder active actions.
- Save the ordered plan.
- See whether the Flare Plan is configured.

For V0:

- Each action requires a title.
- Each action may include one optional short description.
- Action order must be explicit and durable.
- An empty plan is permitted.
- A plan is configured when it contains at least one valid active action.
- Configuration changes apply only to future Flare Plan Runs.
- Archived actions are not shown in the default active-plan editor.
- Historical Event-Time Actions are never deleted when a saved action is archived.

The existing single free-text next-step representation must not remain the authoritative plan model after individual plan actions are introduced.

### Content Constraints

V0 must enforce the following structural limits:

- Maximum active actions per plan: 10.
- Action title length: 1 to 120 characters after trimming.
- Optional action description length: 0 to 300 characters after trimming.
- Whitespace-only titles are invalid.

These limits are implementation constraints, not guidance about how many actions are personally appropriate for a user.

### Readiness Meaning

Flare Plan readiness is a structural configuration signal only.

Configured means:

- At least one valid active action exists.

Not configured means:

- No valid active action exists.

Readiness does not assess whether the plan is clinically appropriate, personally effective, or likely to improve an outcome.

The absence of a configured Flare Plan must not prevent the user from initiating a Flare or attempting to send an external support message.

## Action Ordering Contract

Active actions must have a unique, contiguous order within the active plan.

The first action is position 1.

Reordering must be submitted as the complete ordered list of active action identities and applied atomically.

The backend must reject reorder requests that contain:

- Duplicate action identities.
- Missing active action identities.
- Archived action identities.
- Actions belonging to another plan.
- Actions owned by another user.

A failed reorder must leave the existing order unchanged.

## Flare Plan Run Creation Contract

After a Flare Event is successfully created, the backend must check for an active configured Flare Plan.

When a configured plan exists, the backend must create exactly one Flare Plan Run in the `offered` state and create an ordered snapshot of its active actions.

Run creation and action snapshot creation must occur in one transaction or through an equivalent idempotent operation that cannot leave a partial run.

The snapshot is created when the plan is offered, not when:

- The response screen loads.
- The user taps Begin Flare Plan.
- The first action is displayed.
- The first action outcome is recorded.

This preserves the plan that was available for that Flare Event.

When no configured plan exists:

- No Flare Plan Run is required.
- The response screen must not present an unusable Begin Flare Plan action.
- The Flare Event and external support signaling continue normally.

## External Support Delivery Independence

Flare Plan availability is independent of external support-message delivery.

When the Flare Event exists but message delivery fails:

- The response screen must accurately report the delivery failure.
- The configured Flare Plan may still be offered.
- The user may still begin and complete the Flare Plan.
- Plan progress must not imply that support-message delivery succeeded.

The response screen must not display "Flare sent" when the external support message did not successfully send.

Appropriate state-specific language should distinguish:

- Flare created and message sent.
- Flare created but message delivery failed.
- Flare created while message delivery result is still pending, when applicable.

## Flare Response Entry Contract

When a configured Flare Plan Run exists in the `offered` state, the response screen must offer:

> Would you like to begin your Flare Plan?

The available choices are:

- **Begin Flare Plan**
- **Not right now**

Choosing **Begin Flare Plan** changes the run to `in_progress` and presents the first unresolved action.

Choosing **Not right now** changes the run to `declined`.

Declining the plan does not:

- Cancel the Flare Event.
- Reverse an external support-message attempt.
- Mark the overall Flare as unsuccessful.
- Prevent the user from viewing the anchor note or delivery result.

A declined run is not resumable in V0.

## Guided Action Contract

When the user begins the Flare Plan:

- Only one action is presented as the primary focus at a time.
- The current position and total action count are shown.
- The user may mark the current action **Done**.
- The user may mark the current action **Skip**.
- Either choice records the outcome and advances to the next unresolved action.
- The user may intentionally end the plan early.
- The user is not required to complete every action.

Skipping an action is a valid outcome, not an error state.

The frontend must not determine the authoritative next action from local state alone.

The backend is authoritative for:

- Current run state.
- Current unresolved action.
- Action order.
- Valid state transitions.
- Persisted outcomes.
- Progress counts.

## Action Outcome Contract

Each Event-Time Action has one of these states:

- `pending`
- `done`
- `skipped`
- `not_reached`

Definitions:

### `pending`

The action is included in the run snapshot but has not received a terminal outcome.

### `done`

The user explicitly marked the action Done.

### `skipped`

The user explicitly marked the action Skip.

### `not_reached`

The plan ended or was declined before the action received a Done or Skip outcome.

The system must not infer `done` or `skipped` from:

- Navigation.
- App closure.
- Timeout.
- Network loss.
- Missing input.
- The user viewing another screen.

## Flare Plan Run State Contract

A Flare Plan Run has one of these states:

- `offered`
- `declined`
- `in_progress`
- `completed`
- `ended_early`

Definitions:

### `offered`

The plan snapshot exists and has been made available, but the user has not begun or declined it.

All Event-Time Actions are initially `pending`.

### `declined`

The user selected Not right now.

When a run becomes declined:

- All unresolved Event-Time Actions become `not_reached`.
- No action is recorded as skipped.
- The run cannot be resumed in V0.

### `in_progress`

The user began the plan and at least one Event-Time Action remains `pending`.

### `completed`

Every Event-Time Action has an explicit terminal outcome of either `done` or `skipped`.

A completed run may include skipped actions.

Completed does not mean every action was done.

### `ended_early`

The user intentionally ended the plan before all actions received Done or Skip outcomes.

When a run becomes ended early:

- Every unresolved `pending` action becomes `not_reached`.
- Already completed `done` and `skipped` outcomes remain unchanged.

## Valid Run Transitions

The valid V0 transitions are:

- `offered` to `declined`
- `offered` to `in_progress`
- `in_progress` to `completed`
- `in_progress` to `ended_early`

No other transition is valid unless introduced by a later contract revision.

Terminal run states are:

- `declined`
- `completed`
- `ended_early`

Terminal run states must not be reopened or changed through ordinary V0 APIs.

## Resume and Interruption Contract

An `in_progress` Flare Plan Run is resumable.

When the user returns to an active Flare Event with an `in_progress` run:

- The backend returns the first unresolved `pending` action as the current action.
- Previously recorded outcomes remain unchanged.
- The user continues from that action.

App closure, navigation away, network loss, or process interruption must not automatically:

- End the run.
- Decline the run.
- Mark an action skipped.
- Mark pending actions not reached.

V0 does not automatically expire an in-progress run.

Any future expiration or abandonment policy requires a separate contract decision.

## Action Progression and Idempotency Contract

Only the current unresolved action may receive a Done or Skip outcome.

Recording the action outcome and advancing run progress must occur atomically.

The following invariants must be enforced:

- A Flare Event has at most one Flare Plan Run.
- A run has at most one Event-Time Action snapshot for each source action.
- An Event-Time Action receives at most one terminal outcome.
- Done and Skip cannot both succeed for the same Event-Time Action.
- The same idempotent retry must not advance the plan twice.
- A stale client cannot answer a non-current action.
- A failed action update must not partially advance the run.
- The run becomes completed only after every action is either done or skipped.

Repeated identical requests should return the already-recorded result when safely identifiable as the same operation.

Conflicting repeated requests must return a conflict response and preserve the first valid terminal outcome.

## Event Snapshot Contract

Each Flare Plan Run must preserve an event-specific snapshot containing:

- Source plan identity.
- Source saved-action identity for each action, when available.
- Action title snapshot.
- Action description snapshot.
- Action position snapshot.
- Action outcome.
- Outcome timestamp, when applicable.

Later edits, reordering, or archival of saved actions must not change:

- Historical action wording.
- Historical ordering.
- Historical outcomes.
- Historical completion summaries.

The source action reference exists to support future lightweight plan review. The snapshot remains authoritative for what the user saw during the event.

## Legacy Next-Step Migration Contract

When migrating from the existing single free-text next-step field:

- Each non-empty legacy next-step value becomes one active Flare Plan Action.
- The migrated action is assigned position 1.
- Leading and trailing whitespace is removed.
- Empty or whitespace-only legacy values create no action.
- Existing legacy content must not be silently discarded.
- Migration must be idempotent and must not create duplicate actions when rerun.

After successful migration and application cutover, the individual Flare Plan Actions become authoritative.

The legacy field may remain temporarily for rollback or verification but must not continue driving the active Flare experience.

## Action Archival Contract

V0 uses archival rather than destructive deletion for saved Flare Plan Actions.

When a user removes an action from the active plan:

- The action becomes archived or inactive.
- It is removed from active ordering.
- Remaining active actions are reordered contiguously.
- It is excluded from future Flare Plan Run snapshots.
- Existing Event-Time Action snapshots remain unchanged.

Archived actions are not displayed in the default active-plan editor.

Restoring archived actions is outside V0 unless explicitly included in the implementation slice.

## Checkpoint Contract

A checkpoint may be offered after:

- A run becomes `completed`.
- A run becomes `ended_early`.

A checkpoint is not automatically offered after a run is `declined` in V0.

Checkpoint lifecycle must be represented separately from Flare Plan Run status.

Checkpoint status supports:

- `not_offered`
- `pending`
- `completed`
- `skipped`

Definitions:

### `not_offered`

The run has not reached a state where the checkpoint is available, or the product does not offer one for that run state.

### `pending`

The checkpoint has been offered and has not yet been completed or skipped.

### `completed`

The user submitted a checkpoint response.

### `skipped`

The user explicitly skipped the checkpoint.

A Flare Plan Run may become `completed` or `ended_early` before the checkpoint is resolved.

Checkpoint responses may include:

- `better`
- `about_the_same`
- `worse`
- `not_sure`

The checkpoint may also record one optional next-choice value, such as:

- `continue_on_my_own`
- `contact_someone`
- `send_another_support_signal`
- `end_flare_event`

Checkpoint choices must not be presented as medical guidance or treatment recommendations.

## Completion Summary Contract

After a run reaches `completed` or `ended_early`, the response screen should show a concise persisted summary.

The summary may include:

- Number of actions done.
- Number of actions skipped.
- Number of actions not reached.
- External support-message delivery status.
- Checkpoint response, when submitted.

The summary must remain descriptive and nonjudgmental.

Acceptable examples include:

- "3 actions done, 1 skipped."
- "You ended the plan after step 2."
- "2 actions were not reached."
- "Checkpoint: About the same."

Avoid language such as:

- "You failed one step."
- "Your recovery score decreased."
- "You should have completed more actions."
- "This action improved your recovery."

## Persistence Contract

The authoritative persisted model must support the following.

### Saved Plan Data

- One active plan per user.
- Individually stored actions.
- Stable action identities.
- Durable atomic ordering.
- Active or archived action state.
- User ownership.
- Creation and update timestamps.

### Event-Time Data

- At most one Flare Plan Run per Flare Event.
- Source-plan reference.
- Snapshotted action content and order.
- Action-level outcomes.
- Action response timestamps.
- Overall run status.
- Run lifecycle timestamps.
- Independent checkpoint status.
- Optional checkpoint response and next choice.

All plan, action, run, and checkpoint reads and mutations must enforce user ownership and isolation.

Database constraints should enforce key invariants where practical rather than relying only on application logic.

## API Capability Contract

The backend must provide operations sufficient to support the following capabilities.

### Configure the Plan

- Read the active Flare Plan.
- Create an action.
- Update an action.
- Archive an action.
- Atomically reorder all active actions.
- Return current Flare Plan readiness.

### Run the Plan

- Create or return the single offered run for a Flare Event.
- Begin the run.
- Decline the run.
- Read current run state.
- Read the authoritative current action.
- Mark the current action done.
- Skip the current action.
- End the run early.
- Resume an in-progress run.
- Submit the checkpoint.
- Skip the checkpoint.
- Read the final persisted summary.

The backend must remain authoritative for action order, current progress, state transitions, outcomes, and summary counts.

The canonical run response should contain enough information for the frontend to render without independently reconstructing state, including:

- Flare Event identity.
- Run status.
- Current action, when applicable.
- Current position.
- Total action count.
- Done count.
- Skipped count.
- Not-reached count.
- Ordered action outcomes where required.
- Checkpoint status.
- Checkpoint response, when available.
- External support-message delivery status.

## API Contract Follow-Up

Before backend implementation begins, a dedicated API contract must define:

- Concrete route paths.
- HTTP methods.
- Authentication requirements.
- Request payloads.
- Response payloads.
- Idempotency mechanism.
- Conflict behavior.
- Validation errors.
- Ownership errors.
- Not-found behavior.
- State-transition errors.
- Canonical error codes.

The product and domain rules in this document remain authoritative when designing those routes.

## Configure Screen Contract

The Configure screen must replace the single next-step input with an ordered Flare Plan editor.

The editor must support:

- Displaying all active actions in order.
- Adding an action.
- Editing action title and description.
- Archiving an action.
- Reordering actions.
- Saving changes.
- Reporting validation failures.
- Displaying current readiness status.

The editor should communicate that the plan is intended to be:

- Short.
- Personal.
- Predetermined.
- Used immediately after a Flare.

The editor must not imply that Flare evaluates whether the plan is therapeutically effective.

## Flare Response Screen Contract

The Flare response screen must support distinct states for:

- External support-message result.
- No configured Flare Plan.
- Flare Plan offered.
- Flare Plan declined.
- Flare Plan in progress.
- Flare Plan completed.
- Flare Plan ended early.
- Checkpoint pending.
- Checkpoint completed or skipped.
- Final summary.

The response screen must preserve access to relevant event information, including:

- Support-message delivery status.
- Anchor note, when configured.
- Flare Plan state.
- Completion summary, when available.

The anchor note may be secondary or collapsible during the guided sequence so the current action remains the primary focus.

## Future Review Boundary

Persisted action outcomes may later support lightweight plan-maintenance prompts.

Example:

> You skipped "Take a short walk" in four recent Flare Plans. Would you like to keep it, rewrite it, move it, or remove it?

Future review must:

- Remain optional.
- Use neutral language.
- Avoid treating skips as failures.
- Preserve user control over plan changes.
- Distinguish correlation from causation.
- Focus on improving the Flare Plan.
- Avoid expanding into comprehensive recovery management.

Future review may support actions such as:

- Keep the action unchanged.
- Rewrite the action.
- Move the action earlier or later.
- Replace the action.
- Archive the action.

A full recovery analytics, treatment-management, coaching, or behavior-management product is outside this contract.

## Implementation Slices

Implementation should be divided into dependent slices rather than delivered as one combined change.

### Slice 1: Domain, Database, and Migration

Includes:

- Persisted plan and action model.
- Run and Event-Time Action model.
- Checkpoint persistence.
- Constraints and ownership.
- State-machine rules.
- Legacy next-step migration.
- Transaction and idempotency design.

### Slice 2: Configuration API

Includes:

- Read active plan.
- Create action.
- Edit action.
- Archive action.
- Atomic reorder.
- Readiness calculation.
- Ownership and validation tests.

### Slice 3: Configuration Screen

Includes:

- Ordered action editor.
- Add, edit, archive, and reorder interactions.
- Readiness integration.
- Reload persistence.
- Validation and error states.

### Slice 4: Run API

Includes:

- Offer and snapshot creation.
- Begin and decline.
- Current action.
- Done and Skip progression.
- Resume.
- End early.
- Checkpoint.
- Final summary.
- Idempotency and concurrency tests.

### Slice 5: Flare Response Screen

Includes:

- Delivery-result presentation.
- Begin or decline choice.
- One-action-at-a-time walkthrough.
- Resume behavior.
- End-early behavior.
- Checkpoint.
- Completion summary.
- Integration and UI tests.

## V0 Acceptance Criteria

Flare Plan V0 is complete when:

1. A user can configure multiple individually persisted actions.
2. Each action has a stable identity.
3. The configured action order survives reloads.
4. Reordering is atomic and cannot leave duplicate or partial positions.
5. The Configure screen accurately reports whether the plan is configured.
6. Existing non-empty legacy next-step content is migrated into one position-1 action without duplication.
7. Creating a Flare Event with a configured plan creates exactly one offered run.
8. The offered run contains an immutable ordered snapshot of the active saved actions.
9. A failed support-message delivery does not prevent the Flare Plan from being offered.
10. The response screen accurately distinguishes message-delivery success, failure, and pending states.
11. The response screen offers Begin Flare Plan and Not right now when a configured offered run exists.
12. Declining the plan marks unresolved actions not reached without marking them skipped.
13. Beginning the plan presents one action at a time.
14. Done and Skip persist distinct outcomes.
15. Done or Skip advances the plan exactly once.
16. Only the authoritative current action may be answered.
17. Repeated or competing requests cannot produce duplicate advancement or conflicting outcomes.
18. An interrupted in-progress run resumes at the first unresolved action.
19. App closure or network loss does not automatically skip, decline, or end the plan.
20. Ending early leaves remaining actions not reached rather than skipped.
21. A completed run has no pending or not-reached actions.
22. A completed run may contain skipped actions.
23. Editing or archiving the saved plan does not alter historical Event-Time Action snapshots.
24. The user may complete or skip a checkpoint after a completed or ended-early run.
25. Checkpoint status remains separate from Flare Plan Run status.
26. The final summary accurately reflects persisted action outcomes, checkpoint data, and delivery status.
27. Users cannot read or mutate another user's plan, actions, runs, Event-Time Actions, or checkpoint data.
28. A missing or empty Flare Plan does not prevent the user from initiating a Flare.
29. Automated tests cover ownership, ordering, snapshots, migration, state transitions, resume behavior, interruption behavior, failed delivery, idempotency, concurrency conflicts, checkpoint behavior, and both response-screen entry paths.

## Starter Action Library Contract

### Purpose

Flare Plan V0 must provide a curated starter-action library so users can build a useful Flare Plan without having to begin from a blank state.

The starter library is intended to reduce setup friction, provide concrete examples of suitable Flare Plan actions, and help users create a short, realistic sequence for use during an active Flare Event.

Starter actions are suggestions only. They are not treatment recommendations, clinical guidance, or claims of effectiveness.

### Starter Action Template

A Starter Action Template is a Flare-managed reusable suggestion that may be selected when configuring a Flare Plan.

Each template must have:

- A stable template key.
- A required title.
- An optional short description.
- A category.
- A display position within that category.
- An active or inactive state.
- Creation and update timestamps.

A template may also include internal metadata used for administration or future presentation, but such metadata must not change the meaning of an already-created user action.

Starter Action Templates are not themselves part of a user's active Flare Plan.

### Starter Library Presentation

The Configure screen must present the active starter templates as a selectable list.

The starter library may be grouped into clear categories such as:

- Change the situation.
- Reset your body.
- Interrupt the pattern.
- Reach toward support.

The final category names and template copy must be defined in product content and may evolve without changing the underlying user-plan model.

The interface must allow the user to:

- Review available starter templates.
- Select one or more templates.
- See which templates are already represented in their active plan.
- Add custom actions alongside selected starter actions.
- Review and reorder the resulting active plan before or after saving.

The starter library must not require the user to select any particular action.

No template should be preselected by default in V0.

### Template Selection Contract

Selecting a Starter Action Template must create a normal user-owned Flare Plan Action.

The new saved action must copy the template's current:

- Template key.
- Title.
- Description.
- Suggested position information, when applicable.

After creation, the user-owned action becomes authoritative for that user's plan.

The selected action must behave the same as a custom action. The user may:

- Edit its title.
- Edit its description.
- Reorder it.
- Archive it.
- Use it during future Flare Plan Runs.

The saved action may retain its source template key for traceability and future aggregate analysis.

The source template reference must not prevent the user from changing the copied action.

### Template Independence Contract

Changes to a Starter Action Template must not silently modify existing user-owned Flare Plan Actions.

This includes later changes to:

- Title.
- Description.
- Category.
- Display order.
- Active state.

Template updates apply only to future selections.

Existing user-owned actions remain unchanged unless the user explicitly edits them.

Archiving or removing a template from the starter library must not archive, delete, or alter actions previously copied into user plans.

### Duplicate Selection Contract

V0 must prevent accidental duplicate selection of the same active starter template within one Flare Plan.

A starter template is considered already selected when the active plan contains an active action with the same source template key.

When a template is already represented in the active plan:

- The Configure screen must indicate that it has already been added.
- The normal selection action must be disabled or treated as idempotent.
- Repeated requests must not create duplicate active actions.

This rule prevents accidental duplication but does not prohibit the user from creating a separate custom action with similar wording.

If a starter-derived action is archived, the same template may be selected again unless a later API contract specifies restoration instead.

### Custom Action Coexistence

Custom actions and starter-derived actions must use the same authoritative saved-action model.

After creation, both types must support the same:

- Validation rules.
- Ordering behavior.
- Editing behavior.
- Archival behavior.
- Readiness contribution.
- Event-time snapshot behavior.
- Done, Skip, and not-reached outcomes.

The Flare Plan Run must not treat a starter-derived action differently from a custom action.

### Starter Content Guidelines

Starter actions should be:

- Concrete.
- Immediately understandable.
- Possible to begin during an active Flare Event.
- Short enough to present as a single step.
- Nonjudgmental.
- Broadly applicable.
- Easy to personalize after selection.

Starter actions should avoid:

- Vague motivational language.
- Claims of guaranteed benefit.
- Clinical or diagnostic language.
- Instructions that assume access to a specific paid service or external app.
- Actions that require substantial setup during the Flare Event.
- Language that treats completion as a measure of recovery success.
- Emergency or crisis guidance presented as ordinary plan content.

The initial library should include a strong but bounded set of options rather than an exhaustive catalog.

### Starter Library Administration

Starter Action Templates are managed by Flare, not by individual users.

V0 may store the library in the database or in another authoritative application-managed source, provided that:

- Template keys are stable.
- Active and inactive status is supported.
- Ordering is deterministic.
- Template reads are available to the Configure experience.
- Existing user actions remain independent from future template edits.

The implementation must not require a general-purpose admin interface for starter-template management in V0.

### Starter Library API Capabilities

The backend must provide operations sufficient to:

- Read all active starter templates in deterministic order.
- Identify which templates are already represented in the user's active plan.
- Create a user-owned action from a selected template.
- Prevent duplicate active selection of the same template.
- Return the newly created action in the canonical active-plan representation.

The exact routes, payloads, response shapes, and error codes must be defined in the Flare Plan API contract.

### Readiness Interaction

A starter template does not contribute to Flare Plan readiness until it has been selected and copied into the user's active plan.

Readiness continues to depend only on the user's valid active Flare Plan Actions.

Browsing templates without selecting one must not mark the plan configured.

### Analytics and Privacy Boundary

V0 does not require popularity rankings, usage analytics, or personalized template recommendations.

The source template key may be retained on user-owned actions so future aggregate analysis is possible.

Any future aggregate analysis must:

- Use privacy-preserving aggregated data.
- Avoid exposing individual user behavior.
- Avoid presenting popularity as effectiveness.
- Avoid presenting commonly selected actions as treatment recommendations.

### Future Popular Choice Boundary

A later version may mark a limited number of starter templates as **Popular choice** using aggregated selection data.

For such a feature:

- Popularity must be based on how often a starter template is selected into a plan, not on whether users mark it Done.
- Only starter templates may be ranked; custom action content must not be included.
- Exact counts need not be shown.
- A minimum sample threshold must be met before any ranking is displayed.
- Rankings should be recalculated periodically rather than requiring real-time updates.
- The label must mean commonly selected, not best, recommended, or proven effective.
- Popularity must not affect the user's saved action order.
- The feature remains outside Flare Plan V0 implementation scope.

### Starter Library Acceptance Criteria

The starter-action library portion of Flare Plan V0 is complete when:

1. The Configure screen displays a curated set of active starter templates.
2. Templates appear in deterministic category and display order.
3. No starter template is preselected by default.
4. A user can select a starter template and create a user-owned Flare Plan Action from it.
5. The created action retains the source template key.
6. The created action copies the template title and description at selection time.
7. The user can edit, reorder, and archive the copied action.
8. Later template changes do not modify the copied action.
9. Archiving a template does not alter existing user plans.
10. Selecting the same active template repeatedly does not create duplicate active actions.
11. Custom and starter-derived actions behave identically after creation.
12. Template selection contributes to readiness only after the user-owned action exists.
13. Users cannot create or modify global starter templates through ordinary user APIs.
14. Automated tests cover selection, duplication prevention, template independence, ownership, ordering, and coexistence with custom actions.
15. Popular Choice ranking is not implemented as part of V0.

## Final Product Statement

Flare Plan V0 is a short, optional, event-bound action walkthrough.

It helps the user move through the immediate period after initiating a Flare, records a lightweight account of what occurred, and may later support limited plan-maintenance reflection.

It is not the beginning of a comprehensive recovery-management platform.