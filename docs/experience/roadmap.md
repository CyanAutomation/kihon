# Phases 5B–5F roadmap

Phase 5A defines the contract and examples. The later work below is intentionally deferred; it is not implemented by these documents or reference screens.

## Phase 5B — Adaptive navigation

- **Scope/outcome:** Optional compact top-level navigation, hierarchical header/back presentation, and adaptive list/detail shell guidance.
- **Dependencies:** Navigation and profile contracts; at least two consuming application workflows.
- **Approach:** Start with semantic markup/CSS. Add small TypeScript only for a demonstrated interaction that native links and CSS cannot supply.
- **Public API:** Propose CSS classes and optional helper separately. Preserve current shell/sidebar behavior and aliases.
- **Tests:** URL/back/forward/direct-link, focus and scroll restoration, responsive transitions, no-JavaScript navigation, keyboard and touch.
- **Acceptance:** Every selected destination can be loaded directly and revisited; width changes do not lose selection; no workflow requires a gesture.
- **Priority:** First, because all later patterns depend on a stable destination model. Split a tab bar and hierarchical navigator into independent proposals if consumers need different subsets.

## Phase 5C — Presentation and interaction

- **Scope/outcome:** Optional web sheet-like surfaces, contextual action menus, popovers, selection states, and carefully scoped transitions.
- **Dependencies:** Phase 5B semantics and existing dialog contract.
- **Approach:** Prefer native dialog/popover platform support where semantics and interoperability are verified; provide CSS/HTML fallback and no-API behavior.
- **Public API:** Add only patterns with explicit focus, dismissal, scroll, and viewport contracts. Do not create a universal overlay manager.
- **Tests:** Escape/cancel, focus return, viewport bounds, keyboard/virtual keyboard, selection, reduced motion, keyboard/pointer parity.
- **Acceptance:** No action is gesture-only; modal and nonmodal focus behavior is distinguishable; content remains reachable at narrow widths and zoom.
- **Split recommendation:** Deliver dialog-backed task sheets separately from optional popover/context-menu enhancements.

## Phase 5D — PWA integration

- **Scope/outcome:** Reusable documentation/examples for safe-area padding and standalone-mode testing, plus lifecycle and offline integration patterns.
- **Dependencies:** Consumer manifest and service-worker ownership; browser/OS support policy.
- **Approach:** Begin with documentation and CSS examples. Keep caching, persistence, sync, and push configuration in the application.
- **Public API:** Add safe-area utility only if multiple consumers need identical semantics and fallbacks.
- **Tests:** Manifest validation, physical iPhone/iPad install, keyboard, launch/reopen, offline retry, cache update and storage-denial scenarios.
- **Acceptance:** Core workflows recover from reload, offline state, permission denial, and process suspension without duplicate writes.
- **Split recommendation:** Safe-area layout and service-worker/offline policy should be separate deliverables; Kihon should not ship a service worker.

## Phase 5E — Visual refinement

- **Scope/outcome:** Review theme default, typography, surface hierarchy, navigation styling, and input-specific density against real consumer screens.
- **Dependencies:** 5B/5C examples and contrast evidence.
- **Approach:** Gather consumer feedback before proposing token or style changes. Prototype visual changes in style-guide first.
- **Public API:** Any token values, CSS classes, or defaults require a compatibility review; no broad token changes are authorized by Phase 5A.
- **Tests:** Visual comparison in themes, contrast, forced colors, reduced transparency/motion, zoom, and supported browsers.
- **Acceptance:** Changes preserve identity, documented aliases, contrast, responsive behavior, and consumer overrides.
- **Split recommendation:** Treat system-default theme policy as an explicit compatibility decision separate from decorative surface refinement.

## Phase 5F — Experience validation

- **Scope/outcome:** Cross-browser visual/interaction regression and repeatable manual device validation.
- **Dependencies:** Reference workflows and a declared supported OS/browser matrix.
- **Approach:** Automate Chromium and WebKit standards regressions where runners permit; keep installation, VoiceOver, and lifecycle checks on actual devices.
- **Public API:** None expected; test fixtures and CI jobs are repository tooling.
- **Tests:** Representative Playwright projects, accessibility checks, visual states, physical iOS/iPadOS/macOS checklist, and issue recording.
- **Acceptance:** Each supported profile has current automated evidence plus recorded device evidence; unsupported behavior has an explicit fallback.
- **Split recommendation:** WebKit automation and device-lab ownership may proceed independently.

## Release gates across phases

- Maintain a compatibility note for every published class, token, behavior, or default.
- Require at least one consuming-app use case before adding reusable runtime behavior.
- Document manual checks that cannot be automated; do not treat an emulator or Playwright WebKit as a substitute for physical Safari.
- Keep Kihon framework-independent and leave application architecture with consumers.
