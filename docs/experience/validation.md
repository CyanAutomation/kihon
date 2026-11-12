# Platform validation matrix and native-feel rubric

Phase 5A establishes a strategy. It does not claim that the reference screens have been tested on physical Apple devices or that Chromium results establish Safari behavior.

## Validation matrix

| Target or condition | Automate with Playwright where practical | Manual or physical-device check |
| --- | --- | --- |
| Desktop Chromium | Layouts, URLs, button/link behavior, theme, focus, reduced motion, loading/error states, no-script basics | Keyboard, zoom and assistive-tech smoke test |
| Desktop WebKit | Run a WebKit project in CI/local tooling for standards-level CSS/DOM regressions when a suitable browser binary is available | Safari version, macOS conventions, VoiceOver and actual window resize |
| macOS Safari | Limited external automation if SafariDriver or a controlled Mac runner is available | Safari, standalone Dock app, keyboard/trackpad, VoiceOver, menus, reopen behavior |
| iPhone Safari | Emulated viewport and touch events are useful for basic reflow only | Physical Safari, dynamic browser chrome, keyboard, safe-area, touch, rotation, VoiceOver |
| Installed iPhone web app | Cannot establish installation or OS lifecycle in ordinary desktop Playwright | Add to Home Screen, launch, relaunch, status/safe areas, keyboard, suspend/resume, offline recovery |
| iPad Safari | Emulated width tests are useful for grid transitions | Physical split view/window resize, touch plus pointer/keyboard, software keyboard, orientation, VoiceOver |
| Installed iPad web app | Ordinary browser emulation is insufficient | Install, keyboard show/dismiss, fixed bars, focus/scroll restoration, suspend/resume |
| Installed macOS web app | Browser viewport test is not an install test | Add to Dock, launch context, title/window behavior, links opening in browser/app, keyboard and persistence |
| Light/dark, reduced motion, forced colors | Emulate color scheme and reduced motion; inspect computed styles | Check actual OS appearance and increased contrast/transparency settings where supported |
| Enlarged text and zoom | Set root text size and viewport; check overflow and focus reachability | Real browser 200% text resizing and 400% zoom, including software keyboard |

Playwright WebKit exercises a WebKit browser build under automation. It is valuable for CSS, HTML, focus, and history regressions, but it is not equivalent to Safari on a supported iOS/iPadOS/macOS version, and cannot verify Home Screen installation, Apple system UI, VoiceOver integration, virtual-keyboard behavior, or lifecycle behavior on real hardware.

For each manual run, record date, device model, OS version, browser version, installed or browser context, appearance, input methods, steps, expected result, actual result, and issue link. A blank/unrecorded cell means untested.

## Native-feel evaluation rubric

Score each criterion independently: **0 = fails or no evidence; 1 = partially works with a documented gap; 2 = all pass evidence is observed.** The score is a diagnostic sum, not a subjective badge. A release candidate should have no zero on a supported core workflow; any one is a blocker for that workflow. Record the evidence and the follow-up owner.

| Criterion | Evidence required for 2 |
| --- | --- |
| Navigation predictability | Direct URL, in-app Back, browser Back/Forward, and reload reach the expected page/selection without dead ends |
| Interaction responsiveness | Every action gives immediate feedback; delayed work has progress, duplicate-submit protection, and success/error recovery |
| Platform convention alignment | Navigation, selection, and action density fit the tested profile; no copied system chrome or hidden required actions |
| Content hierarchy | A first-time reviewer can identify current location, main task, selected item, and primary action from headings and semantics |
| Control density | Frequent touch targets are at least 44 by 44 CSS px; desktop compact controls remain separated, labeled, and keyboard-operable |
| State preservation | Returning from detail restores useful list scroll/focus; interrupted drafts and sync failures follow the documented recovery policy |
| Keyboard and touch usability | One core workflow completes with keyboard and touch/pointer; gestures are optional; focus stays visible |
| Accessibility | Names, relationships, selection, validation, focus, contrast, text resizing, reduced motion, and screen-reader output were checked |
| Visual consistency | Light/dark states use the product token system; hierarchy does not depend on blur, shadow, or color alone |
| Installed-app behavior | The installed flow was physically checked on the supported platform; launch, keyboard, safe area, suspension, and offline states were recorded |

The score must cite concrete behavior, not a reviewer impression. Record the tested profile and device alongside every score.

## Phase 5A recorded status

- Repository unit, token, parser, generated-output, and Chromium suites were already part of the project at baseline.
- This phase adds Chromium checks for the three style-guide references and HTML/CSS validation for those screens.
- No physical iPhone, iPad, macOS Safari, installed web app, VoiceOver, or native app test is claimed by the reference implementation. Those checks remain manual follow-up.
