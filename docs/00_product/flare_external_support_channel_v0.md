# Flare External Support Channel V0

## Purpose

External Support Channel V0 allows a Flare user to connect one external messaging group, starting with GroupMe, so that pressing Send Flare posts one predefined support message to that group.

The feature exists to notify an existing support network without requiring supporters to install Flare or participate in an in-app messaging system.

## Product Thesis

Flare owns the trigger, configuration, message, delivery attempt, and delivery result.

The external messaging provider owns the group conversation.

For V0, Flare does not try to become a chat app. It only sends a clear, predefined support signal into a group the user has already chosen.

## V0 Scope

External Support Channel V0 includes:

- A provider-agnostic support channel model.
- GroupMe as the first implemented provider.
- Connecting a GroupMe account.
- Selecting one GroupMe group as the support destination.
- Confirming or storing one predefined flare message.
- Sending a test flare.
- Sending the configured message when the user presses Send Flare.
- Recording delivery success or failure.
- Showing the user whether the flare was sent successfully.
- Allowing the user to disconnect or reconnect the GroupMe integration.

## V0 Non-Goals

External Support Channel V0 does not include:

- In-app messaging.
- Supporter accounts.
- Reading GroupMe replies.
- Tracking supporter responses.
- Acknowledgement buttons.
- Presence or availability tracking.
- Group member management.
- Multiple simultaneous support groups.
- Escalation trees.
- Crisis escalation logic.
- Custom per-send message composition.
- Scheduling or automated flare sending.
- Syncing external chat history into Flare.

## Primary Provider

GroupMe is the primary V0 provider.

The implementation should treat GroupMe as the first adapter behind a provider-agnostic support channel interface, not as the permanent product concept.

Provider examples:

- `groupme`
- `telegram`
- future external messaging providers

Only `groupme` is required for V0.

## Core User Flow

1. User opens Flare settings.
2. User chooses to connect an external support channel.
3. User selects GroupMe.
4. User authorizes or connects GroupMe.
5. User selects one GroupMe group.
6. User confirms the default flare message.
7. User sends a test flare.
8. User enables the support channel.
9. Later, user presses Send Flare.
10. Flare posts the predefined message to the configured GroupMe group.
11. Flare shows delivery success or failure.

## Send Flare Behavior

When the support channel is enabled:

1. The user presses Send Flare.
2. Flare creates or begins the local flare action.
3. The backend loads the user's active support channel configuration.
4. The backend sends the predefined message through the configured provider adapter.
5. The backend records the delivery attempt and result.
6. The mobile app shows a clear success or failure state.

Expected success message:

> Flare sent to [Group Name].

Expected failure behavior:

- Tell the user the flare was not delivered.
- Preserve the local flare action if applicable.
- Offer a retry or reconnect path where appropriate.
- Do not silently fail.

## Provider-Agnostic Concepts

The support channel model should be able to represent:

- User/account owner.
- Provider name.
- Provider connection status.
- Selected external group/channel.
- Human-readable group/channel name.
- Provider-specific identifiers.
- Default flare message.
- Enabled/disabled state.
- Last delivery status.
- Last delivery timestamp.
- Error/reconnect state.

Possible conceptual shape:

```text
support_channel
- id
- user_id
- provider
- status
- external_group_id
- external_group_name
- provider_config_ref
- default_message
- enabled
- last_delivery_status
- last_delivery_at
- created_at
- updated_at
```

Provider secrets and tokens should be stored securely on the backend, not in the mobile app.

## Multi-User Group Behavior

Multiple Flare users may configure the same external GroupMe group as their support channel.

Each user's support channel configuration remains user-owned. Sending a flare uses that user's configured provider connection, predefined message, and enabled state.

V0 does not model the GroupMe group as a shared Flare-owned support network. The external provider remains the source of truth for group membership and conversation.
  
## GroupMe-Specific Notes

For GroupMe V0, the likely provider flow is:

1. OAuth/connect GroupMe.
2. Fetch available groups.
3. Let the user select one group.
4. Create or configure a bot/sender for that group if required.
5. Store the group and bot/provider identifiers.
6. Use the GroupMe provider adapter to post the predefined flare message.

The exact API details should be confirmed during implementation, but the product contract should remain narrow: post one predefined message to one configured group.

## Acceptance Criteria

External Support Channel V0 is complete when:

- A user can connect GroupMe.
- A user can choose one GroupMe group as their support channel.
- A user can confirm the predefined flare message.
- A user can send a test flare to the selected group.
- Pressing Send Flare posts the predefined message to the configured GroupMe group.
- The app displays whether delivery succeeded or failed.
- Failed delivery does not appear successful.
- The user can disconnect or reconnect the GroupMe integration.
- The internal model is provider-agnostic even though only GroupMe is implemented.
- The implementation does not add in-app messaging, reply tracking, supporter management, or escalation workflows.

## Boundary Statement

V0 is only configuration plus reliable delivery.

The full intention of this feature is:

> When enabled, pressing Send Flare reliably posts a predefined support message to the configured GroupMe group.

## Implementation Decisions

- V0 supports one active support channel per user.
- Each user owns their own support channel configuration.
- Multiple users may configure the same external GroupMe group.
- GroupMe is the only implemented V0 provider.
- The internal model should remain provider-agnostic.
- Users may edit their default flare message during setup.
- Users do not compose or edit the message at send time.
- Test flare posts to the real configured GroupMe group and is clearly marked as a test.
- Provider secrets and tokens are stored on the backend only.
- The mobile app never stores provider secrets.
- Delivery success and failure must be recorded.
- Failed external delivery must not be displayed as successful.
- V0 does not read replies, track acknowledgements, manage supporters, or sync chat history.