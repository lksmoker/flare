# Flare Private Testing Support Guide V0

**Operator preflight:** replace `[BUILD IDENTIFIER]`, `[SUPPORT EMAIL OR CHANNEL]`, and `[EXPECTED RESPONSE WINDOW]` before sending.

## Support Channel

Authoritative support channel: `[SUPPORT EMAIL OR CHANNEL]`

Expected response window: `[EXPECTED RESPONSE WINDOW]`

## Support Posture

- Support is best-effort.
- Support is not monitored continuously.
- Support is not an emergency contact.
- If you may be in immediate danger or need urgent help, contact local emergency services or another appropriate source of immediate assistance directly. Do not wait for a Flare or GroupMe response.

## What To Report

Please report:

- sign-in or access problems
- confusing onboarding or setup behavior
- wrong destination selection or wrong-group concerns
- duplicate sends
- false success or false failure
- missing history or lost configuration
- access by another user
- suspected credential exposure or unsafe account behavior
- privacy concerns
- anything that makes the emergency boundary feel misleading

## Minimum Useful Defect-Report Fields

Include as many of these as you can:

- approximate date and time
- device and browser
- whether you were signed in or signed out
- the action you attempted
- the result you expected
- the result that actually happened
- any error message shown
- whether GroupMe received a message
- whether retrying changed the result
- build identifier: `[BUILD IDENTIFIER]`

## Screenshot Guidance

- Screenshots are useful when wording or visual state matters.
- Redact unrelated personal information before sending.
- Do not include another person's confidential information unless it is necessary to explain the problem.

## Secrets You Must Never Send

Do not send:

- passwords
- magic-link URLs or tokens
- provider tokens
- access tokens
- session secrets

## How To Report Specific High-Risk Problems

### Wrong Destination

- Stop using GroupMe sends in Flare.
- If possible, disable the support group connection.
- Contact `[SUPPORT EMAIL OR CHANNEL]` immediately.

### Duplicate Send

- Report how many messages appeared and in which group.
- Say whether you tapped once or retried.
- Include timestamps if possible.

### False Success

- Report that Flare claimed success but the message did not appear where expected.
- Say whether a local Flare event still appeared in the app.

### Access By Another User

- Stop using the affected account.
- Contact support immediately.
- Describe what data looked exposed.

### Lost Configuration

- Report which setup disappeared and whether you were signed in.
- Say whether a reload or re-sign-in changed anything.

### Suspected Credential Exposure

- Stop sending screenshots or logs that might contain the secret.
- Contact support immediately and describe what may have been exposed.

## What To Do If Flare Is Unavailable

- Do not wait for the app to recover if you need immediate help.
- Use another appropriate support or emergency path directly.
- When safe, report the outage through `[SUPPORT EMAIL OR CHANNEL]`.

## Leaving The Test

You can also use `[SUPPORT EMAIL OR CHANNEL]` to request access removal or help with private-test data. See [flare_private_testing_exit_guide_v0.md](/C:/dev/Flare/docs/40_delivery/private_testing/flare_private_testing_exit_guide_v0.md).

## Copyable Defect Template

```text
Flare private-test report

Build: [BUILD IDENTIFIER]
Date/time:
Device/browser:
Signed in or signed out:
What I tried to do:
What I expected:
What actually happened:
Error message:
Did GroupMe receive a message?:
Did retrying change anything?:
Privacy or safety concern?:
Screenshot attached?:
```
