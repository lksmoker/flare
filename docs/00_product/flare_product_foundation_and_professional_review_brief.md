# Flare Product Foundation and Professional Review Brief

Status: working foundation; professional review requested  
Doc Type: product foundation  
Role: define Flare's purpose, audience, premise, approach, boundaries, and directional questions  
Last Updated: 2026-07-23

## 1. Why This Document Exists

This document is the big-picture reference for Flare. It is intended to guide product strategy, experience design, safety decisions, private testing, public language, and future feature work.

It is also written to support review by therapists, counselors, recovery professionals, peer-support practitioners, researchers, and other people with relevant professional or lived experience. Reviewers do not need technical knowledge of the app.

This document distinguishes among:

- the current product direction;
- the first use case Flare is trying to validate;
- adjacent uses that appear to share the same mechanism but are not yet validated;
- explicit product and safety boundaries; and
- questions where professional guidance should influence the direction.

Where older product documents conflict with the working product framing in this document, this document should guide new product decisions. Existing implementation contracts remain authoritative for current software behavior until they are deliberately updated.

## 2. Flare in One Paragraph

Flare is a prepared support and self-guidance tool for recurring difficult moments. It is for a person who can often identify, while thinking clearly, what they want to remember, what actions may help, and whom they may want to contact—but who may have trouble accessing or acting on that knowledge in the moment. The person prepares a short response plan and an optional support message ahead of time. When the difficult moment occurs, they can send a Flare, signal trusted people, and follow the steps they chose while clear-minded.

Flare is not therapy, diagnosis, treatment, crisis response, emergency monitoring, or a guarantee that another person will see or answer a message.

## 3. The Human Problem

Some difficult moments create a gap between what a person intends and what they are able to do.

Outside the moment, a person may know:

- that they do not want to continue a particular behavior or pattern;
- why changing course matters to them;
- which actions tend to help;
- what they want their future self to remember; and
- who they would want to contact.

During the moment, an urge, compulsion, spiral, or state of overwhelm may reduce clarity, self-direction, working memory, or the ability to explain what is happening. A person may know that support is available and still find composing a message, choosing an action, or remembering a plan too difficult.

Flare exists to reduce that moment-of-need friction. It does not try to supply all of the insight, treatment, or human support a person may need. It tries to reconnect the person with support and decisions they prepared in advance.

## 4. Product Premise

Flare is built on the following working hypotheses. These are product hypotheses to be evaluated, not claims of clinical effectiveness.

1. Some difficult moments are recurring or recognizable enough that useful preparation can happen beforehand.
2. A plan made while clear-minded may be easier to follow than one invented during a high-friction moment.
3. A predefined support signal may make reaching out possible when composing or explaining feels too difficult.
4. A short, low-cognitive-load sequence may help a person take the next helpful action without requiring them to navigate a complex interface.
5. The person's own language, reasons, choices, and established support practices should take priority over generic advice from the app.
6. Brief reflection afterward may help the person improve their plan without turning recovery or emotional well-being into performance tracking.

The central product promise is:

> Flare helps people reconnect with two things that can be hardest to reach in a difficult moment: their support and their clarity.

## 5. Product Identity

The current working category is:

> **A prepared-response support tool**

This identity emphasizes that:

- preparation occurs before the difficult moment;
- the user remains the author of the plan;
- Flare activates support rather than becoming the support relationship;
- the app helps with a moment, not an entire course of care or recovery; and
- the response is self-directed and consent-based.

Other phrases such as "moment-of-need support activator" may be useful internally, but public language should be tested for clarity and for any unintended suggestion of emergency response.

## 6. Intended Audience

### Initial validation audience

Flare's first application is for adults experiencing a recurring compulsive urge, relapse-risk moment, or unwanted behavior pattern who:

- can recognize a recurring kind of difficult moment;
- want to interrupt or respond differently to that pattern;
- can prepare a short response plan in advance;
- can use the app voluntarily and understand its limitations;
- have another way to obtain urgent or professional help when needed; and
- may benefit from reducing the effort required to remember a plan or ask trusted people for support.

Examples may include a craving, an unwanted repetitive behavior, a relapse-risk sequence, an avoidance loop, or another recurring behavior that the person wants to interrupt.

These examples are intentionally broad. "Compulsive behavior" is not one clinically uniform category. The suitability of Flare may differ substantially among substance-use recovery, obsessive-compulsive patterns, eating-related behaviors, self-harm-related urges, behavioral addictions, habitual avoidance, and non-clinical unwanted habits. Flare should not imply that one response model is appropriate for all of them.

### Adjacent audience hypothesis

The same prepared-response model may also help adults during recurring, non-emergency overwhelm or emotional-distress situations—for example, when a person becomes too overwhelmed to communicate clearly, initiate a stabilizing routine, reduce immediate demands, or remember what usually helps.

This is not currently a validated public claim. It is a closely related product lane to investigate with professional review and careful testing.

### Who Flare is not currently designed to serve

The current product should not be relied on:

- during an emergency or situation requiring an immediate guaranteed response;
- as a person's only route to urgent help;
- as monitoring for a person whose safety depends on another party being alerted;
- as a substitute for therapy, medical care, a recovery program, or a safety plan developed with a qualified professional; or
- by a supporter as a tool for supervising, diagnosing, or controlling another person.

Further inclusion and exclusion criteria are an explicit topic for professional review.

## 7. One Product Model, Two Use-Case Lanes

The current direction is to integrate the shared mechanism while differentiating the language, plans, risks, and evidence for each use case.

| Shared prepared-response model | Compulsive or unwanted-behavior lane | Overwhelm or emotional-distress lane |
|---|---|---|
| Prepare while clear-minded | Identify an urge, relapse-risk sequence, or unwanted behavior pattern | Identify a recurring non-emergency state in which communication or self-direction becomes difficult |
| Send a low-friction support signal | Ask for help interrupting or getting through the urge or sequence | Communicate that support, reduced demands, presence, or a check-in may help |
| Follow a short, user-authored plan | Delay, change context, contact established support, or follow an existing recovery strategy | Ground, reduce immediate demands, communicate a need, or follow an established stabilizing routine |
| Reconnect with clear-minded reminders | Recall reasons, values, consequences, and prior commitments | Recall what is true, what usually helps, and what the person wants others to understand |
| Reflect and revise | Did the plan help interrupt or change the behavior sequence? | Did the plan help the person regain enough clarity or direction for the next step? |

This table describes a product structure, not a claim that the two lanes are clinically equivalent. Different situations may require different language, plan guidance, supporter expectations, contraindications, safety boundaries, and outcome measures.

## 8. The Flare Approach

### Prepare before the moment

The user identifies one recurring behavior or situation and prepares:

- a plain-language name for the pattern;
- a personal reminder or Anchor Note;
- a short Flare Plan containing concrete actions; and
- optionally, a predefined message and trusted external support group.

Preparation should encourage specificity without requiring unnecessary sensitive detail.

### Recognize and signal

When the moment begins, the user opens Flare and presses **Send Flare**. The action should require very little thought.

Sending a Flare:

- records that the moment occurred;
- opens the prepared response experience; and
- when enabled, attempts to send the user's predefined message to the external support destination they chose.

The local Flare event and external message delivery are related but distinct. A failed external delivery must not be shown as successful or erase the local response flow.

### Follow the prepared plan

The response experience presents one useful step at a time. It should avoid dense text, excessive choices, configuration work, or generic coaching.

The app's role is to surface the person's prior choices. It should not improvise clinical advice or present itself as the authority on what the person should do.

### Reflect without judgment

Afterward, the user may record a lightweight reflection and review prior Flare events. Reflection should support learning and plan adjustment without using streaks, shame, scores, or other mechanics that turn difficult moments into performance.

## 9. Current Product Experience

The current private-test product includes:

- signed-out orientation and a local fallback Flare experience;
- signed-in persistence for personal configuration and history;
- one primary behavior or situation for the initial test;
- an Anchor Note containing the user's own reminder content;
- a short, user-configured Flare Plan;
- a low-friction **Send Flare** action;
- a response flow that presents the plan step by step;
- optional delivery of one predefined support message to one selected GroupMe group;
- visible external-delivery success or failure;
- lightweight reflection; and
- history of saved Flare events.

The initial private test is intentionally small and is meant to evaluate whether this experience is understandable, usable, trustworthy, and directionally helpful. It is not designed to establish clinical efficacy.

## 10. Role of Trusted Supporters

Flare may help a user contact people who already have a consensual support relationship with them. Flare does not create, manage, or validate that relationship.

For the current product:

- the user chooses the destination and message in advance;
- the external messaging provider owns the conversation;
- Flare does not read replies or track acknowledgements;
- delivery success does not mean that anyone saw, understood, or will answer the message;
- supporters are not expected to act as therapists, monitors, or emergency responders; and
- the app should not encourage responsibility that a supporter has not knowingly accepted.

Professional review should help define healthy supporter guidance, including what kinds of responses are useful, what may unintentionally reinforce a harmful cycle, and how both parties can establish realistic expectations and boundaries.

## 11. Experience and Ethical Principles

Flare should be:

- calm without minimizing the person's experience;
- direct without being alarmist;
- non-shaming and non-punitive;
- low in cognitive load during the difficult moment;
- guided by one clear next action at a time;
- personal and user-authored;
- voluntary, consent-based, and transparent;
- honest about delivery, limitations, and uncertainty;
- useful without requiring an external support channel; and
- designed to preserve the person's agency.

Flare should avoid:

- diagnostic or treatment language;
- claims that it prevents relapse, harm, or crisis;
- implying that help is guaranteed;
- generic advice presented as clinically appropriate;
- mechanics that reward, shame, or pressure the user;
- covert monitoring or supporter surveillance;
- encouraging reassurance or supporter behavior without considering whether it may reinforce a harmful pattern; and
- broadening to new use cases solely because the software can technically accommodate them.

## 12. Safety and Product Boundaries

Flare is not:

- an emergency service or crisis hotline;
- a monitored safety system;
- a diagnostic or screening tool;
- therapy, counseling, medical care, or a recovery program;
- a medical device;
- a replacement for professional treatment;
- a guarantee of behavior change, symptom improvement, or human response; or
- an autonomous coach making treatment decisions.

The product does not currently detect danger, assess severity, contact emergency services, confirm that a supporter is available, or know whether a prepared action is appropriate for a particular person or condition.

Public language, onboarding, and private-test materials should communicate these limits without making the app feel frightening or unusable. Where a use case requires crisis-aware behavior, clinical decision-making, or guaranteed escalation, that should be treated as a different and substantially higher-safety product scope.

## 13. What Success Would Mean

At this stage, success means learning whether the product mechanism is useful and responsibly framed—not proving treatment efficacy.

Key questions include:

- Can an intended user quickly recognize that Flare may be for them?
- Can they prepare a plan that feels personal, realistic, and easy to follow?
- During a realistic non-emergency moment, can they access the app and take the next prepared action?
- Does the predefined signal reduce the effort required to ask for support?
- Do the response experience and language preserve agency and reduce shame?
- Are delivery states and supporter expectations understood accurately?
- Does reflection help improve the plan without feeling burdensome or judgmental?
- Do users try to use Flare in situations for which it is not designed?
- Are there meaningful differences between the compulsive-behavior and overwhelm/distress lanes?
- Does any part of the experience create false reassurance, unhealthy reliance, or unintended harm?

Private-test evidence should be separated into at least two lanes:

1. **Functional evidence:** Does the app work reliably and communicate what happened?
2. **Experience and usefulness evidence:** Is the approach understandable, usable, appropriately bounded, and helpful enough to continue investigating?

Usage and retention may help indicate whether the product has found an audience, but they are not substitutes for safety, usefulness, or appropriate professional interpretation.

## 14. Questions for Professional Review

We would especially value a reviewer's perspective on the following:

### Product model

1. Is the underlying "prepare while clear, activate during the moment" model psychologically and practically coherent?
2. Is it reasonable to treat compulsive/unwanted behavior and non-emergency overwhelm/distress as two lanes within one product?
3. What important distinctions does the current model overlook?

### Audience and scope

4. Which populations or situations appear most appropriate for an early private test?
5. Which should be excluded or approached only with specialized design and oversight?
6. Is "compulsive or unwanted recurring behavior" too broad to be a responsible initial audience?
7. Would a different initial framing be clearer, safer, or more useful?

### Plans and content

8. What makes a prepared action suitable or unsuitable for this kind of tool?
9. Could particular reminders, delay strategies, reassurance, or supporter responses reinforce a harmful cycle?
10. Should the product provide templates, rely only on user-authored plans, or encourage plans created with a therapist or recovery professional?
11. What language would preserve agency without implying that willpower alone should resolve the problem?

### Support relationships

12. What should a trusted supporter understand before agreeing to receive Flare messages?
13. What response guidance would be helpful without turning supporters into clinicians or monitors?
14. What consent, expectation-setting, or boundary-setting is missing?

### Safety and claims

15. Are the current non-emergency and non-clinical boundaries sufficient and understandable?
16. What foreseeable misuse, overreliance, or adverse effect should the product address?
17. What claims would be inappropriate without stronger evidence?
18. What evidence or review should be required before broadening the public audience?

### Evaluation

19. What questions should private testers be asked to distinguish usability from meaningful benefit?
20. What outcomes are reasonable to observe without presenting the test as clinical research?
21. What warning signs should cause the team to narrow, pause, or redesign a use-case lane?

## 15. Current Direction and Decision Rule

The current direction is:

- maintain one shared prepared-response product model;
- validate compulsive urges, relapse-risk moments, and unwanted recurring behavior as the first application;
- investigate recurring non-emergency overwhelm or emotional distress as an adjacent lane;
- differentiate plan content, language, risks, supporter guidance, and outcome measures where the lanes differ;
- keep crisis response and clinical treatment outside the current product scope; and
- revise the direction when professional review or user evidence shows that the model is unsafe, unclear, ineffective, or too broad.

The guiding decision rule is:

> Integrate what is genuinely shared; differentiate what affects safety, meaning, or effectiveness.

## 16. Decisions This Foundation Should Guide

This foundation should inform:

- Welcome and onboarding language;
- App Store and website positioning;
- private-tester selection and consent;
- behavior/situation setup;
- plan templates and examples;
- Anchor Note prompts;
- supporter onboarding and message expectations;
- feedback and outcome questions;
- safety language and escalation boundaries;
- feature prioritization;
- use-case expansion; and
- future free, paid, or professionally supported product tiers.

Major changes to audience, clinical posture, supporter responsibility, crisis handling, or product claims should be treated as product-level decisions and reviewed explicitly rather than emerging indirectly through copy or feature implementation.

## 17. Related Product Documents

- [Flare Experience Principles](../10_design/flare_experience_principles.md)
- [Flare External Support Channel V0](./flare_external_support_channel_v0.md)
- [Depression / Anxiety Expansion Checkpoint](./checkpoints/flare_depression_anxiety_expansion_checkpoint.md)
- [Private Tester Onboarding V0](../40_delivery/private_testing/flare_private_tester_onboarding_v0.md)

