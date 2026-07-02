# Flare Support Signal V0 Checkpoint

Date: 2026-07-02

## Decision

Flare should support a lightweight external support broadcast, called **Support Signal**, rather than building a full in-app messaging service for V0.

The end goal is:

> Once Support Signal is enabled, tapping **Send Flare** automatically posts a predefined message to the user's configured support group.

This should happen without requiring the user to compose a message, choose recipients, leave the app, or make an additional decision during the flare moment.

## Product framing

Support Signal is not chat, messaging, social networking, or supporter account management.

It is a simple, pre-approved broadcast mechanism:

```text
User taps Send Flare
→ Flare records the flare event
→ Flare automatically posts a predefined support message to the configured group
→ Supporters react in their normal group chat
→ User continues in the Flare recovery flow
```

The goal is to “get the ball rolling” by letting trusted supporters know that the user could use support right now.

## Key requirement

Ease of setup and ease of use are primary requirements.

A stressed user should be able to trust that:

1. Support Signal was intentionally enabled.
2. The message has already been reviewed and approved.
3. The configured group has already been tested.
4. Sending a flare will notify the right people automatically.

## V0 behavior

During setup, the user configures:

- one external support group/channel
- one predefined support message
- whether automatic sending is enabled

After setup, the live flare flow is:

```text
Tap Send Flare
→ create Flare Event
→ if Support Signal is enabled and configured, post predefined message automatically
→ show the normal Flare recovery response
```

## Setup flow

Suggested setup sequence:

1. Choose provider/channel.
2. Connect or configure the support group.
3. Review or edit the predefined support message.
4. Send a test signal.
5. Confirm the group received it.
6. Enable automatic Support Signal on Send Flare.

Auto-posting should only be available after setup and successful test confirmation.

## Channel strategy

Flare should own the canonical support signal model. External tools should be treated as delivery adapters.

Potential adapters:

- GroupMe
- Telegram
- manual copy/share fallback
- SMS later
- email later
- in-app support later

GroupMe may be a strong first automated adapter because the desired behavior is group-native and lightweight: post a simple message into the group where supporters already are.

Telegram remains a strong future or parallel adapter if richer bot behavior becomes important.

## V0 non-goals

Support Signal V0 should not require:

- supporter Flare accounts
- in-app chat
- message threading
- reply ingestion
- read receipts
- supporter dashboards
- contact syncing
- moderation tools
- multiple configured groups
- dynamic message composition during flare mode

Supporters should not need to install Flare.

## Safety and consent rule

Automatic support posting should only happen after the user has:

1. configured the channel,
2. reviewed the message,
3. sent and confirmed a test signal,
4. explicitly enabled auto-send on Send Flare.

This prevents accidental disclosure or surprise notifications.

## Suggested domain model

```text
support_channels
- id
- user_id
- provider: groupme | telegram | manual
- display_name
- external_group_id
- status: connected | needs_reauth | disabled

support_signal_templates
- id
- user_id
- title
- body
- is_default

support_signal_settings
- user_id
- enabled
- auto_send_on_flare
- default_channel_id
- default_template_id
- require_confirmation: false for target V0 behavior

support_signal_sends
- id
- flare_event_id
- channel_id
- template_id
- rendered_body
- status: pending | sent | failed | skipped
- provider_message_id
- error_message
- created_at
- sent_at
```

## Core send logic

```text
create flare_event

if support_signal_settings.enabled
  and auto_send_on_flare
  and channel is connected
  and template exists:
    render predefined message
    post to configured group
    record support_signal_send status

return flare response to user
```

## Working product statement

Support Signal V0 gives the user a one-tap way to ask for help without composing a message in the moment.

Flare owns the event, settings, template, and send record. GroupMe, Telegram, or another external channel owns the supporter conversation.
