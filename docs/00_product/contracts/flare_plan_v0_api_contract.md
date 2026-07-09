# Flare Plan V0 API Contract

## Status

Implementation-ready API contract for Flare Plan V0.

This contract defines the authenticated HTTP interface for:

- Reading the starter-action library.
- Reading and modifying the user's active Flare Plan.
- Creating user-owned actions from starter templates.
- Creating custom actions.
- Editing, archiving, and reordering saved actions.
- Creating and reading event-time Flare Plan Runs.
- Beginning, declining, progressing, resuming, and ending a run.
- Recording an optional checkpoint.
- Reading the persisted completion summary.

The authoritative product and domain behavior is defined in:

- `docs/00_product/contracts/flare_plan_v0_contract.md`

If this API contract conflicts with the product contract, the product contract is authoritative unless the discrepancy is resolved by an explicit contract update.

## Scope

This contract covers Flare Plan V0 only.

It does not define:

- Popular Choice rankings.
- Recovery analytics.
- Treatment recommendations.
- Adaptive or branching plans.
- Timed actions.
- Automatic run expiration.
- General-purpose starter-template administration.
- Restoration of archived saved actions.
- Historical plan-review prompts.
- Full Flare Event history presentation.

## Conventions

### Base Path

All routes use the repository-wide shared API prefix:

```text
/api
```

### Authentication

All routes require an authenticated Flare user.

The backend derives the acting user from the authenticated request context.

Clients must not submit a `user_id` for ordinary user-scoped operations.

### Content Type

Requests and responses use:

```text
Content-Type: application/json
```

### Identifiers

All resource identifiers are opaque strings.

Clients must not infer ordering, ownership, or resource type from identifier format.

### Timestamps

Timestamps use ISO 8601 UTC values.

Example:

```json
"2026-07-08T14:22:31.120Z"
```

### Canonical Error Shape

All API errors use:

```json
{
  "error": {
    "code": "FLARE_PLAN_ERROR_CODE",
    "message": "Human-readable message.",
    "details": {}
  }
}
```

`details` may be empty.

Clients must branch on `code`, not on the human-readable message.

### Ownership Behavior

A resource owned by another user must not be disclosed.

For ordinary user-facing routes, an inaccessible foreign-owned resource should return the same not-found behavior used for a nonexistent resource unless an existing Flare security contract requires a different response.

## Canonical Resource Shapes

## Starter Action Template

```json
{
  "template_key": "move_to_different_room",
  "title": "Move to a different room",
  "description": "Create some distance from where the pattern was happening.",
  "category": "change_the_situation",
  "category_label": "Change the situation",
  "display_position": 1,
  "is_selected": false
}
```

Rules:

- `template_key` is stable.
- Only active templates are returned to ordinary users.
- `is_selected` means the active user plan contains an active action with the same source template key.
- Starter templates are suggestions, not user-owned plan actions.
- Selecting a template creates a normal user-owned action.

## Saved Flare Plan Action

```json
{
  "id": "action-id",
  "source_template_key": "move_to_different_room",
  "title": "Move to a different room",
  "description": "Create some distance from where the pattern was happening.",
  "position": 1,
  "is_active": true,
  "created_at": "2026-07-08T14:22:31.120Z",
  "updated_at": "2026-07-08T14:22:31.120Z"
}
```

Rules:

- `source_template_key` is null for a custom action.
- Starter-derived and custom actions otherwise behave identically.
- The copied title and description are authoritative after creation.
- Later starter-template edits do not mutate saved actions.
- Archived actions are excluded from the active-plan response.

## Active Flare Plan

```json
{
  "id": "plan-id",
  "is_configured": true,
  "active_action_count": 3,
  "maximum_active_actions": 10,
  "actions": [
    {
      "id": "action-1",
      "source_template_key": "move_to_different_room",
      "title": "Move to a different room",
      "description": "Create some distance from where the pattern was happening.",
      "position": 1,
      "is_active": true,
      "created_at": "2026-07-08T14:22:31.120Z",
      "updated_at": "2026-07-08T14:22:31.120Z"
    }
  ],
  "updated_at": "2026-07-08T14:22:31.120Z"
}
```

Rules:

- `actions` contains active actions only.
- Actions are returned in ascending contiguous position order.
- `is_configured` is true when at least one valid active action exists.
- Readiness is structural only.

## Event-Time Action

```json
{
  "id": "event-action-id",
  "source_action_id": "saved-action-id",
  "source_template_key": "move_to_different_room",
  "title": "Move to a different room",
  "description": "Create some distance from where the pattern was happening.",
  "position": 1,
  "outcome": "pending",
  "responded_at": null
}
```

Allowed outcomes:

```text
pending
done
skipped
not_reached
```

## Checkpoint

```json
{
  "status": "pending",
  "response": null,
  "next_choice": null,
  "responded_at": null
}
```

Allowed checkpoint statuses:

```text
not_offered
pending
completed
skipped
```

Allowed checkpoint responses:

```text
better
about_the_same
worse
not_sure
```

Allowed next choices:

```text
continue_on_my_own
contact_someone
send_another_support_signal
end_flare_event
```

`next_choice` is optional.

## Flare Plan Run

```json
{
  "id": "run-id",
  "flare_event_id": "flare-event-id",
  "source_plan_id": "plan-id",
  "status": "in_progress",
  "current_action": {
    "id": "event-action-2",
    "source_action_id": "saved-action-2",
    "source_template_key": null,
    "title": "Open my anchor note",
    "description": null,
    "position": 2,
    "outcome": "pending",
    "responded_at": null
  },
  "progress": {
    "current_position": 2,
    "total_count": 4,
    "done_count": 1,
    "skipped_count": 0,
    "not_reached_count": 0,
    "pending_count": 3
  },
  "actions": [
    {
      "id": "event-action-1",
      "source_action_id": "saved-action-1",
      "source_template_key": "move_to_different_room",
      "title": "Move to a different room",
      "description": null,
      "position": 1,
      "outcome": "done",
      "responded_at": "2026-07-08T14:25:00.000Z"
    }
  ],
  "checkpoint": {
    "status": "not_offered",
    "response": null,
    "next_choice": null,
    "responded_at": null
  },
  "support_delivery": {
    "status": "sent"
  },
  "offered_at": "2026-07-08T14:22:31.120Z",
  "started_at": "2026-07-08T14:23:00.000Z",
  "completed_at": null,
  "ended_at": null,
  "updated_at": "2026-07-08T14:25:00.000Z"
}
```

Allowed run statuses:

```text
offered
declined
in_progress
completed
ended_early
```

The `support_delivery.status` value must use the existing authoritative Flare Event and support-channel delivery model.

The Flare Plan API must not invent a second delivery-state model.

## Idempotency

Mutation routes that can create or advance durable state require:

```text
Idempotency-Key: opaque-client-generated-value
```

Required for:

- Creating an action from a template.
- Creating a custom action.
- Updating an action.
- Archiving an action.
- Reordering actions.
- Beginning a run.
- Declining a run.
- Recording Done.
- Recording Skip.
- Ending a run early.
- Submitting a checkpoint.
- Skipping a checkpoint.

Rules:

- The key is scoped to the authenticated user, route, and target resource.
- Retrying the same operation with the same key returns the original successful result.
- Reusing a key with materially different input returns `409 Conflict`.
- Idempotency must prevent duplicate action creation and duplicate run advancement.
- Idempotency does not replace database constraints or transactional state validation.

## Starter Template Routes

## List Starter Templates

```text
GET /api/flare-plan/templates
```

Returns active starter templates in deterministic category and display order.

### Success

```json
{
  "templates": [
    {
      "template_key": "move_to_different_room",
      "title": "Move to a different room",
      "description": "Create some distance from where the pattern was happening.",
      "category": "change_the_situation",
      "category_label": "Change the situation",
      "display_position": 1,
      "is_selected": false
    }
  ]
}
```

### Behavior

- No template is selected automatically.
- `is_selected` reflects the authenticated user's active plan.
- Inactive templates are excluded.
- Custom action content is never returned as part of the global template library.

## Configuration Routes

## Read Active Flare Plan

```text
GET /api/flare-plan
```

### Success

```json
{
  "plan": {
    "id": "plan-id",
    "is_configured": true,
    "active_action_count": 3,
    "maximum_active_actions": 10,
    "actions": [],
    "updated_at": "2026-07-08T14:22:31.120Z"
  }
}
```

### Empty Plan

A user without active actions still receives `200 OK`.

```json
{
  "plan": {
    "id": "plan-id",
    "is_configured": false,
    "active_action_count": 0,
    "maximum_active_actions": 10,
    "actions": [],
    "updated_at": "2026-07-08T14:22:31.120Z"
  }
}
```

The service may lazily create the user's plan container, provided repeated reads do not create duplicate plans.

## Create Action from Starter Template

```text
POST /api/flare-plan/actions/from-template
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{
  "template_key": "move_to_different_room"
}
```

### Success

```text
201 Created
```

```json
{
  "plan": {
    "id": "plan-id",
    "is_configured": true,
    "active_action_count": 1,
    "maximum_active_actions": 10,
    "actions": [
      {
        "id": "action-id",
        "source_template_key": "move_to_different_room",
        "title": "Move to a different room",
        "description": "Create some distance from where the pattern was happening.",
        "position": 1,
        "is_active": true,
        "created_at": "2026-07-08T14:22:31.120Z",
        "updated_at": "2026-07-08T14:22:31.120Z"
      }
    ],
    "updated_at": "2026-07-08T14:22:31.120Z"
  },
  "created_action_id": "action-id"
}
```

### Rules

- The backend copies the template's current title and description.
- The new action is appended to the active plan.
- The new action retains the source template key.
- The action is fully user-owned after creation.
- Selecting an already-represented active template is idempotent and must not create a duplicate active action.
- The active-action limit applies.

### Errors

- `404 FLARE_PLAN_TEMPLATE_NOT_FOUND`
- `409 FLARE_PLAN_TEMPLATE_ALREADY_SELECTED`
- `409 FLARE_PLAN_ACTIVE_ACTION_LIMIT_REACHED`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

An implementation may return the existing plan with `200 OK` instead of an already-selected conflict when the operation is safely idempotent. The chosen behavior must be consistent and tested.

## Create Custom Action

```text
POST /api/flare-plan/actions
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{
  "title": "Put my phone in another room",
  "description": "Leave it there for at least ten minutes."
}
```

### Success

```text
201 Created
```

```json
{
  "plan": {
    "id": "plan-id",
    "is_configured": true,
    "active_action_count": 2,
    "maximum_active_actions": 10,
    "actions": []
  },
  "created_action_id": "action-id"
}
```

### Rules

- `title` is required.
- `title` is trimmed and must contain 1 to 120 characters.
- `description` is optional.
- `description` is trimmed and must contain no more than 300 characters.
- `source_template_key` is null.
- The action is appended to the active plan.
- The active-action limit applies.

### Errors

- `422 FLARE_PLAN_ACTION_TITLE_REQUIRED`
- `422 FLARE_PLAN_ACTION_TITLE_TOO_LONG`
- `422 FLARE_PLAN_ACTION_DESCRIPTION_TOO_LONG`
- `409 FLARE_PLAN_ACTIVE_ACTION_LIMIT_REACHED`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Update Saved Action

```text
PATCH /api/flare-plan/actions/{action_id}
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{
  "title": "Move to the kitchen",
  "description": "Create distance from the trigger."
}
```

### Success

```text
200 OK
```

```json
{
  "plan": {
    "id": "plan-id",
    "is_configured": true,
    "active_action_count": 3,
    "maximum_active_actions": 10,
    "actions": []
  },
  "updated_action_id": "action-id"
}
```

### Rules

- Only active user-owned actions may be edited through this route.
- Editing a starter-derived action does not modify its source template.
- Omitted fields remain unchanged.
- The same title and description validation rules apply.

### Errors

- `404 FLARE_PLAN_ACTION_NOT_FOUND`
- `422 FLARE_PLAN_ACTION_TITLE_REQUIRED`
- `422 FLARE_PLAN_ACTION_TITLE_TOO_LONG`
- `422 FLARE_PLAN_ACTION_DESCRIPTION_TOO_LONG`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Archive Saved Action

```text
DELETE /api/flare-plan/actions/{action_id}
```

Headers:

```text
Idempotency-Key: required
```

### Success

```text
200 OK
```

```json
{
  "plan": {
    "id": "plan-id",
    "is_configured": false,
    "active_action_count": 0,
    "maximum_active_actions": 10,
    "actions": []
  },
  "archived_action_id": "action-id"
}
```

### Rules

- The route performs archival, not destructive deletion.
- Remaining active actions are reordered contiguously.
- Historical Event-Time Actions remain unchanged.
- Retrying the same archival request must not fail merely because the action is already archived.

### Errors

- `404 FLARE_PLAN_ACTION_NOT_FOUND`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Reorder Active Actions

```text
PUT /api/flare-plan/actions/order
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{
  "action_ids": [
    "action-3",
    "action-1",
    "action-2"
  ]
}
```

### Success

```text
200 OK
```

```json
{
  "plan": {
    "id": "plan-id",
    "is_configured": true,
    "active_action_count": 3,
    "maximum_active_actions": 10,
    "actions": []
  }
}
```

### Rules

- The request must contain every active action exactly once.
- Reordering is applied atomically.
- The resulting positions begin at 1 and remain contiguous.
- A failed reorder leaves the previous order unchanged.

### Errors

- `422 FLARE_PLAN_REORDER_DUPLICATE_ACTION`
- `422 FLARE_PLAN_REORDER_MISSING_ACTION`
- `422 FLARE_PLAN_REORDER_UNKNOWN_ACTION`
- `422 FLARE_PLAN_REORDER_ARCHIVED_ACTION`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Flare Plan Run Creation

The preferred lifecycle is for Flare Event creation to create or return the eligible offered Flare Plan Run in the same orchestration flow.

The Flare Event response may embed the run or provide its identifier.

A separate idempotent read-or-create route is also supported for recovery from partial client flows.

## Implemented V0 Response Slice Note

The currently implemented vertical slice in this repository covers:

- `POST /api/flare-events`
- `GET /api/flare-events/{flare_event_id}/response`
- `POST /api/flare-events/{flare_event_id}/flare-plan-run`
- `GET /api/flare-events/{flare_event_id}/flare-plan-run`
- begin / decline / done / skip / end-early run mutations

Checkpoint routes remain documented below for later work but are not implemented in this slice.

## Create Flare Event and Initial Response

```text
POST /api/flare-events
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{
  "anchor_note_id": "anchor-id-or-null",
  "anchor_note_version": 4,
  "behavior_description_snapshot": "Optional description",
  "behavior_label_snapshot": "Late-night scrolling",
  "behavior_pattern_id": "pattern-id-or-null",
  "response_mode": "configured",
  "support_action_shown": "Leave the room and drink water."
}
```

### Success

```json
{
  "flare_event": {},
  "run": {}
}
```

### Rules

- The backend creates the Flare Event and any offered run in one backend-governed mutation.
- Existing active Flare Events for the user may be closed as part of preserving current Send Flare behavior.
- `run` is `null` when no configured active Flare Plan exists.

## Read Flare Response State

```text
GET /api/flare-events/{flare_event_id}/response
```

### Success

```json
{
  "response": {
    "flare_event": {},
    "support_delivery": null,
    "run": null
  }
}
```

### Rules

- The response read model is canonical for the response sheet.
- The backend returns the owned Flare Event, latest persisted support-delivery state for that event when present, and the current run.
- The client must not reconstruct current action, counts, or terminal state locally.

## Create or Return Run for Flare Event

```text
POST /api/flare-events/{flare_event_id}/flare-plan-run
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{}
```

### Success with Configured Plan

```text
200 OK
```

```json
{
  "run": {
    "id": "run-id",
    "flare_event_id": "flare-event-id",
    "source_plan_id": "plan-id",
    "status": "offered",
    "current_action": null,
    "progress": {
      "current_position": null,
      "total_count": 3,
      "done_count": 0,
      "skipped_count": 0,
      "not_reached_count": 0,
      "pending_count": 3
    },
    "actions": [],
    "checkpoint": {
      "status": "not_offered",
      "response": null,
      "next_choice": null,
      "responded_at": null
    },
    "support_delivery": {
      "status": "sent"
    },
    "offered_at": "2026-07-08T14:22:31.120Z",
    "started_at": null,
    "completed_at": null,
    "ended_at": null,
    "updated_at": "2026-07-08T14:22:31.120Z"
  }
}
```

### Success with No Configured Plan

```text
200 OK
```

```json
{
  "run": null,
  "reason": "flare_plan_not_configured"
}
```

### Rules

- At most one run may exist for a Flare Event.
- If a run already exists, return it.
- Run creation and action snapshot creation are atomic.
- The snapshot is based on the active action order at offer time.
- Later plan edits do not alter the run.
- A support-message delivery failure does not prevent run creation.
- The Flare Event must belong to the authenticated user.

### Errors

- `404 FLARE_EVENT_NOT_FOUND`
- `409 FLARE_PLAN_RUN_CREATION_CONFLICT`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Run Read Route

## Read Run by Flare Event

```text
GET /api/flare-events/{flare_event_id}/flare-plan-run
```

### Success

```text
200 OK
```

```json
{
  "run": {}
}
```

When no run exists:

```json
{
  "run": null
}
```

### Behavior

- An `in_progress` run returns the first unresolved pending action as `current_action`.
- A terminal run returns `current_action: null`.
- Progress counts are computed from persisted Event-Time Actions.
- The client must not reconstruct authoritative run state locally.

## Begin Run

```text
POST /api/flare-plan-runs/{run_id}/begin
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{}
```

### Success

```text
200 OK
```

Returns the canonical Flare Plan Run with:

- `status: in_progress`
- `started_at` populated
- the first unresolved action in `current_action`

### Valid Transition

```text
offered -> in_progress
```

### Errors

- `404 FLARE_PLAN_RUN_NOT_FOUND`
- `409 FLARE_PLAN_RUN_ALREADY_DECLINED`
- `409 FLARE_PLAN_RUN_ALREADY_TERMINAL`
- `409 FLARE_PLAN_INVALID_RUN_TRANSITION`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Decline Run

```text
POST /api/flare-plan-runs/{run_id}/decline
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{}
```

### Success

```text
200 OK
```

Returns the canonical run with:

- `status: declined`
- all unresolved actions changed to `not_reached`
- `current_action: null`
- checkpoint status `not_offered`

### Valid Transition

```text
offered -> declined
```

### Errors

- `404 FLARE_PLAN_RUN_NOT_FOUND`
- `409 FLARE_PLAN_RUN_ALREADY_STARTED`
- `409 FLARE_PLAN_RUN_ALREADY_TERMINAL`
- `409 FLARE_PLAN_INVALID_RUN_TRANSITION`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Mark Current Action Done

```text
POST /api/flare-plan-runs/{run_id}/actions/{event_action_id}/done
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{}
```

### Success

```text
200 OK
```

Returns the updated canonical run.

### Rules

- The run must be `in_progress`.
- The target must be the authoritative current unresolved action.
- Recording the outcome and advancing the run are atomic.
- If the action is the final pending action, the run becomes `completed`.
- When the run becomes completed, checkpoint status becomes `pending`.

### Errors

- `404 FLARE_PLAN_RUN_NOT_FOUND`
- `404 FLARE_PLAN_EVENT_ACTION_NOT_FOUND`
- `409 FLARE_PLAN_RUN_NOT_IN_PROGRESS`
- `409 FLARE_PLAN_ACTION_NOT_CURRENT`
- `409 FLARE_PLAN_ACTION_ALREADY_RESOLVED`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Skip Current Action

```text
POST /api/flare-plan-runs/{run_id}/actions/{event_action_id}/skip
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{}
```

### Success

```text
200 OK
```

Returns the updated canonical run.

### Rules

- The run must be `in_progress`.
- The target must be the authoritative current unresolved action.
- The outcome becomes `skipped`.
- Skipping is valid and nonjudgmental.
- If the action is the final pending action, the run becomes `completed`.
- When the run becomes completed, checkpoint status becomes `pending`.

### Errors

The same progression errors apply as for Done.

## End Run Early

```text
POST /api/flare-plan-runs/{run_id}/end-early
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{}
```

### Success

```text
200 OK
```

Returns the canonical run with:

- `status: ended_early`
- all remaining pending actions changed to `not_reached`
- `current_action: null`
- checkpoint status `pending`

### Valid Transition

```text
in_progress -> ended_early
```

### Errors

- `404 FLARE_PLAN_RUN_NOT_FOUND`
- `409 FLARE_PLAN_RUN_NOT_IN_PROGRESS`
- `409 FLARE_PLAN_RUN_ALREADY_TERMINAL`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Resume Behavior

No separate mutation route is required to resume a run.

Reading an `in_progress` run through:

```text
GET /api/flare-events/{flare_event_id}/flare-plan-run
```

must return the first unresolved action as `current_action`.

App closure, navigation, network loss, or process interruption does not change run or action state.

## Checkpoint Routes

## Submit Checkpoint

```text
POST /api/flare-plan-runs/{run_id}/checkpoint
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{
  "response": "about_the_same",
  "next_choice": "continue_on_my_own"
}
```

### Success

```text
200 OK
```

Returns the canonical run with:

- checkpoint status `completed`
- response persisted
- optional next choice persisted
- `responded_at` populated

### Rules

- The run must be `completed` or `ended_early`.
- Checkpoint status must be `pending`.
- `next_choice` is optional.
- Checkpoint completion does not change the terminal run status.

### Errors

- `404 FLARE_PLAN_RUN_NOT_FOUND`
- `409 FLARE_PLAN_CHECKPOINT_NOT_AVAILABLE`
- `409 FLARE_PLAN_CHECKPOINT_ALREADY_RESOLVED`
- `422 FLARE_PLAN_CHECKPOINT_RESPONSE_INVALID`
- `422 FLARE_PLAN_CHECKPOINT_NEXT_CHOICE_INVALID`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Skip Checkpoint

```text
POST /api/flare-plan-runs/{run_id}/checkpoint/skip
```

Headers:

```text
Idempotency-Key: required
```

Request:

```json
{}
```

### Success

```text
200 OK
```

Returns the canonical run with checkpoint status `skipped`.

### Rules

- The run must be `completed` or `ended_early`.
- Checkpoint status must be `pending`.
- No response or next choice is stored.

### Errors

- `404 FLARE_PLAN_RUN_NOT_FOUND`
- `409 FLARE_PLAN_CHECKPOINT_NOT_AVAILABLE`
- `409 FLARE_PLAN_CHECKPOINT_ALREADY_RESOLVED`
- `409 FLARE_PLAN_IDEMPOTENCY_KEY_REUSED`

## Completion Summary

The canonical run response must provide enough persisted information for the client to render a completion summary without recomputing domain state.

A terminal run must include:

```json
{
  "summary": {
    "done_count": 3,
    "skipped_count": 1,
    "not_reached_count": 0,
    "checkpoint_status": "completed",
    "checkpoint_response": "about_the_same",
    "support_delivery_status": "sent"
  }
}
```

The backend is authoritative for these counts.

The frontend may transform them into nonjudgmental display copy.

## State Transition Matrix

| Current state | Operation | Result |
|---|---|---|
| offered | begin | in_progress |
| offered | decline | declined |
| in_progress | done current action | in_progress or completed |
| in_progress | skip current action | in_progress or completed |
| in_progress | end early | ended_early |
| completed | submit checkpoint | completed |
| completed | skip checkpoint | completed |
| ended_early | submit checkpoint | ended_early |
| ended_early | skip checkpoint | ended_early |

All other run transitions are invalid in V0.

Terminal run states are:

- `declined`
- `completed`
- `ended_early`

Ordinary V0 APIs must not reopen terminal runs.

## Concurrency Rules

The backend must enforce:

- At most one active Flare Plan per user.
- At most one Flare Plan Run per Flare Event.
- At most one Event-Time Action snapshot per source action per run.
- At most one terminal outcome per Event-Time Action.
- Only the current unresolved action may be answered.
- Competing Done and Skip requests cannot both succeed.
- Action outcome persistence and run advancement are atomic.
- Reordering is atomic.
- Failed mutations do not leave partial state.

A stale client attempting to answer a non-current action receives:

```text
409 FLARE_PLAN_ACTION_NOT_CURRENT
```

## Validation and Error Codes

The implementation must support, at minimum:

```text
FLARE_PLAN_NOT_FOUND
FLARE_PLAN_ACTION_NOT_FOUND
FLARE_PLAN_TEMPLATE_NOT_FOUND
FLARE_PLAN_TEMPLATE_ALREADY_SELECTED
FLARE_PLAN_ACTIVE_ACTION_LIMIT_REACHED
FLARE_PLAN_ACTION_TITLE_REQUIRED
FLARE_PLAN_ACTION_TITLE_TOO_LONG
FLARE_PLAN_ACTION_DESCRIPTION_TOO_LONG
FLARE_PLAN_REORDER_DUPLICATE_ACTION
FLARE_PLAN_REORDER_MISSING_ACTION
FLARE_PLAN_REORDER_UNKNOWN_ACTION
FLARE_PLAN_REORDER_ARCHIVED_ACTION
FLARE_PLAN_RUN_NOT_FOUND
FLARE_PLAN_RUN_CREATION_CONFLICT
FLARE_PLAN_RUN_ALREADY_DECLINED
FLARE_PLAN_RUN_ALREADY_STARTED
FLARE_PLAN_RUN_ALREADY_TERMINAL
FLARE_PLAN_RUN_NOT_IN_PROGRESS
FLARE_PLAN_INVALID_RUN_TRANSITION
FLARE_PLAN_EVENT_ACTION_NOT_FOUND
FLARE_PLAN_ACTION_NOT_CURRENT
FLARE_PLAN_ACTION_ALREADY_RESOLVED
FLARE_PLAN_CHECKPOINT_NOT_AVAILABLE
FLARE_PLAN_CHECKPOINT_ALREADY_RESOLVED
FLARE_PLAN_CHECKPOINT_RESPONSE_INVALID
FLARE_PLAN_CHECKPOINT_NEXT_CHOICE_INVALID
FLARE_PLAN_IDEMPOTENCY_KEY_REQUIRED
FLARE_PLAN_IDEMPOTENCY_KEY_REUSED
```

Validation errors use `422 Unprocessable Entity`.

State and concurrency conflicts use `409 Conflict`.

Missing or inaccessible resources use `404 Not Found`.

Authentication failures use the existing application-wide authentication response contract.

## Transaction Boundaries

The following operations must be transactional:

- Plan creation when lazily initialized.
- Starter-template selection and user-action creation.
- Custom action creation and position assignment.
- Action archival and contiguous reordering.
- Full action reorder.
- Run creation and event-action snapshot creation.
- Begin transition.
- Decline transition and unresolved-action updates.
- Done or Skip outcome and run advancement.
- End-early transition and unresolved-action updates.
- Checkpoint submission or skipping.
- Idempotency record creation with the corresponding mutation.

Rollback must leave the prior authoritative state unchanged.

## Security and Isolation

Every route must enforce:

- Authenticated-user ownership.
- Plan ownership.
- Saved-action ownership.
- Flare Event ownership.
- Flare Plan Run ownership through its Flare Event.
- Event-Time Action ownership through its run.

Clients must not be able to:

- Read another user's plan.
- Select templates into another user's plan.
- Modify another user's saved action.
- Reorder another user's actions.
- Create or advance a run for another user's Flare Event.
- Answer another user's Event-Time Action.
- Submit another user's checkpoint.
- Modify global starter templates through ordinary user APIs.

## Logging and Observability

Mutation logging should include:

- Authenticated user identifier.
- Route and operation.
- Target resource identifier.
- Idempotency key hash or safe reference.
- Prior state.
- Resulting state.
- Conflict or validation code.
- Request correlation identifier.

Logs must not include:

- Custom action text when avoidable.
- Anchor-note content.
- Sensitive support-message content.
- Authentication credentials or tokens.

## Compatibility and Migration

The API must read from the new individual-action model after migration.

The legacy single next-step field must not remain authoritative.

Migration behavior is defined by the product contract:

- Non-empty legacy next-step text becomes one active action at position 1.
- Empty legacy values create no action.
- Migration is idempotent.
- Existing content is not silently discarded.

During a bounded rollout period, legacy fields may remain available for verification or rollback, but new API writes must target the Flare Plan model.

## API Acceptance Criteria

The API contract is satisfied when:

1. Authenticated users can read active starter templates.
2. Template responses indicate whether each template is already selected.
3. Users can create a user-owned action from a starter template.
4. Duplicate active template selection does not create duplicate actions.
5. Users can create custom actions.
6. Users can edit starter-derived and custom actions.
7. Users can archive actions without deleting historical event data.
8. Users can atomically reorder all active actions.
9. Active-plan reads return canonical contiguous ordering.
10. Empty plans return `200 OK` and `is_configured: false`.
11. A configured Flare Event can create exactly one offered run.
12. Run creation atomically snapshots active actions.
13. Failed support-message delivery does not block run creation.
14. Users can begin or decline an offered run.
15. Declining marks unresolved actions not reached.
16. Users can mark only the current action Done or Skip.
17. Done or Skip advances exactly once.
18. The final resolved action completes the run.
19. Users can intentionally end a run early.
20. Ending early marks unresolved actions not reached.
21. Reading an in-progress run resumes at the first unresolved action.
22. App interruption does not mutate run state.
23. Completed and ended-early runs offer an optional checkpoint.
24. Checkpoint completion and skipping are idempotent.
25. Run status and checkpoint status remain independent.
26. Terminal summaries use persisted authoritative counts.
27. Ownership and isolation are enforced for every resource.
28. Validation errors use stable error codes.
29. State conflicts use stable conflict codes.
30. Required mutations support idempotent retries.
31. Competing requests cannot produce duplicate advancement or conflicting outcomes.
32. Automated tests cover success, validation, ownership, idempotency, concurrency, and invalid transition paths.

## Final API Statement

The Flare Plan V0 API provides a small, explicit, state-safe interface for configuring and executing a user-defined action sequence during a Flare Event.

The backend remains authoritative for ordering, snapshots, progression, outcomes, checkpoint state, ownership, and summary counts.

The API does not provide recovery treatment, coaching, analytics, or effectiveness claims.
