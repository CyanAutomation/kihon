# Adoption checklist for consuming applications

Use this checklist when an application adopts the Phase 5A direction. Kihon owns design and behavior guidance; the app owns routing, application state, domain rules, data, persistence, authentication, and deployment.

## Before implementation

- Identify the principal workflows, top-level destinations, detail depth, and shareable states.
- List supported browser and OS versions, install contexts, and input methods.
- Choose compact, adaptive, and desktop layouts from observed content needs. Record deliberate deviations from the [profiles](platform-profiles.md).
- Decide whether the current dark default is acceptable, whether to opt into system mode, or whether a later Kihon compatibility change is needed.
- Define data-loss, offline, authentication-expiry, and recovery behavior.

## Per workflow

- Use semantic anchors for navigable destinations and native buttons for actions.
- Ensure direct URLs, reload, Back, and Forward resolve to the same meaningful selection.
- Preserve list scroll and focus when returning from detail.
- Specify loading, empty, error, offline, success, and unsaved states with recovery actions.
- Choose a dialog, sheet-like surface, popover, menu, or inline disclosure by intent using the [presentation contract](presentation.md).
- Make each core task usable with keyboard, touch, pointer, VoiceOver, enlarged text, zoom, and reduced motion.
- Use platform capabilities as optional enhancements and record the fallback. Do not require an install state to access core functionality.
- Keep actions visible without hover, and provide an alternative to any gesture or drag.

## Review before release

- Run the automated checks that the consumer supports and record browser versions.
- Complete the manual checks in the [validation matrix](validation.md) for supported Apple devices and install contexts.
- Review theme contrast, keyboard order, focused-field visibility with the software keyboard, state restoration, and stale/offline data.
- Confirm that product identity is recognizable across all profiles and that no copied Apple asset or faux browser chrome has entered the UI.
- Record exceptions, known failures, and a recovery owner. Do not describe untested behavior as supported.

## Responsibility table

| Concern | Owner |
| --- | --- |
| Tokens, shared component contracts, accessibility baseline, presentation patterns | Kihon |
| Routes, URL/history, navigation state, page titles, deep links | Consuming application |
| Business logic, authentication, network/data operations | Consuming application |
| Draft persistence, sync conflict policy, offline cache and recovery | Consuming application |
| Native APIs, app-store distribution, push configuration, wrapper lifecycle | Consuming application |
| Shared reusable enhancement after demonstrated cross-app need | Proposed Kihon phase, with a small opt-in API |

Do not add a Kihon runtime helper until at least two consumers demonstrate the same stable behavior, a framework-free API is clear, and its accessibility and failure contracts can be tested independently.
