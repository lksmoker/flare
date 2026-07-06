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

## Product Contract

External Support Channel V0 has one product promise:

> When enabled, pressing Send Flare posts the user's predefined support message to their configured external support group and accurately reports whether delivery succeeded.

The product contract is:

- The user may configure one active external support channel.
- The user may customize the flare message during setup.
- The user may not customize the message at send time.
- The user may send a test flare during setup or from the support-channel settings.
- Test flares are posted to the real configured group.
- Test flares must be clearly marked as tests.
- Real flares must not be labeled as tests.
- Delivery status must reflect the actual provider delivery result.
- Failed external delivery must not be shown as successful.
- The local Flare action and the external delivery attempt are related but distinct.
- External delivery failure should not erase or hide the local Flare event.

V0 intentionally avoids supporter workflows. The external group is treated as an existing conversation owned by the provider, not as a Flare-managed support network.

## Provider Contract

The internal support-channel interface should remain provider-agnostic.

A provider adapter is responsible for:

- Validating that the user's provider configuration can send messages.
- Listing available external groups or destinations when supported.
- Sending a test flare message.
- Sending a real flare message.
- Returning a normalized delivery result.
- Returning safe, user-displayable error information.
- Hiding provider-specific secrets from the mobile app.

Conceptual provider adapter shape:

```text
SupportChannelProvider
- provider_key
- connect(...)
- list_destinations(...)
- validate_destination(...)
- send_message(...)
- disconnect(...)
```

Conceptual normalized send request:

```text
support_channel_send_request
- user_id
- support_channel_id
- provider
- destination_id
- message
- send_kind: test | real
- flare_event_id
```

Conceptual normalized send result:

```text
support_channel_send_result
- ok
- provider
- provider_message_id
- status
- attempted_at
- delivered_at
- error_code
- error_message_safe
- raw_provider_status_ref
```

The application should not depend on GroupMe-specific concepts outside the GroupMe adapter and provider-specific persistence boundary.

For V0, only the GroupMe adapter must exist.

## Security and Safeguards

External Support Channel V0 must treat external messaging as sensitive because it can notify real people.

Security requirements:

- Provider secrets and tokens are stored backend-only.
- The mobile app must never receive raw provider tokens, bot tokens, refresh tokens, or long-lived secrets.
- Backend logs must not print provider secrets.
- API responses must not include provider secrets.
- User-owned support channel configuration must only be readable or mutable by that user.
- Delivery records must be scoped to the owning user.
- Disconnecting a provider should prevent future sends through that support channel.
- Reconnect should require an explicit user action.

Accidental-send safeguards:

- Test flare and real flare paths must be visually and technically distinct.
- Test flare copy must include a clear test marker.
- The setup flow should require the user to intentionally save or enable the channel.
- Send Flare should use the saved setup-time message, not an editable send-time draft.
- If the support channel is missing, disabled, expired, or invalid, the backend should block external delivery and return a clear failure state.
- Failed provider delivery must be recorded and shown accurately.
- Retry should not create a misleading duplicate success state.

Safe error display:

- User-facing errors should explain the next action, such as retry, reconnect, or check GroupMe setup.
- User-facing errors should not expose tokens, provider raw payloads, stack traces, or internal IDs unless explicitly safe.

## Message Rules

V0 supports one saved support message per user support channel.

Default real flare message:

> Luke sent a Flare and may need support. Please check in when you can.

Default test flare message:

> TEST FLARE: Luke is testing Flare support notifications. No action is needed.

Message rules:

- The user may edit the real flare message during setup.
- The user may edit the saved message later from settings.
- The user may not edit the message at the moment they press Send Flare.
- The saved message must be non-empty.
- The saved message should have a maximum length appropriate for provider limits.
- The test flare message must always include a clear test marker.
- The real flare message must not include the test marker.
- V0 does not support multiple templates.
- V0 does not support per-send custom text.