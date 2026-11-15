---
name: kihon-platform-experience
description: Research, document, implement, or validate Kihon's adaptive web experience patterns while preserving platform evidence and the proposal-to-implementation boundary.
---

# Kihon platform experience

Use this skill for work in `docs/experience/` or `style-guide/experience/`, or when implementing a pattern from the Phase 5 roadmap. For a public component implementation, also follow the component-authoring or runtime-authoring skill as applicable.

## Workflow

1. Read [`docs/experience/README.md`](../../../docs/experience/README.md), the relevant contract, [`docs/experience/gap-assessment.md`](../../../docs/experience/gap-assessment.md), [`docs/experience/roadmap.md`](../../../docs/experience/roadmap.md), and [`docs/experience/validation.md`](../../../docs/experience/validation.md). Check current implementation and consumers before treating a proposal as an existing API.
2. Preserve the boundary between Kihon guidance, style-guide examples, public package APIs, and application-owned behavior. Keep routing, persistence, permissions, service workers, and product data in consuming applications unless the approved scope explicitly says otherwise.
3. For platform-specific claims, check the linked primary Apple, WebKit, or MDN source and the relevant minimum OS/browser versions. Record the source and verification date. Describe Kihon's recommendation as an interpretation for the web, not as an Apple requirement or guarantee of native parity.
4. Start with semantic HTML, browser navigation, native controls, and CSS. Use viewport and capability signals for adaptation; do not infer device identity from user-agent strings, a single width, or desktop emulation. Every action needs keyboard and pointer/touch access, a visible state, and a useful fallback when an optional API is unavailable.
5. For implementation, define acceptance criteria from the roadmap and write a focused failing unit or Playwright test before changing interactive behavior. Keep visual/reference examples out of the package unless a separately documented public API is intended.
6. Validate responsive states, URL/history behavior, focus and scroll behavior, keyboard/pointer parity, reduced motion, and no-JavaScript or unsupported-feature fallbacks as relevant. Use the validation matrix to record actual browser, OS, install context, input method, and date. Treat physical-device checks as distinct from emulation and Playwright WebKit.
7. Update the roadmap or validation records when scope or evidence changes. Separate automated results, manual observations, and unchecked items; never imply that an unchecked matrix item passed.
8. Summarize the contract or implementation changed, evidence sources and dates, automated checks, manual device coverage, and remaining gaps.

Do not add patterns solely to imitate operating-system chrome or gestures. Keep browser history, links, semantics, progressive enhancement, and consuming-application responsibilities explicit.
