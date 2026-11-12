# Kihon platform experience specification

**Status:** Phase 5A proposal. This document specifies behavior and visual direction; it does not publish or implement a new component API.

**Research checked:** 12 November 2026. Platform details change; use the linked primary references and validate support on the target OS and browser before implementation.

Kihon remains a framework-independent web UI foundation. Its target is a familiar, capable experience on compact touch screens, adaptive tablet-sized windows, and desktop windows while retaining HTML semantics, browser navigation, accessibility, and product identity. “Native-inspired” describes observable fit and behavior; it does not mean copying SwiftUI or Safari chrome.

## Read this specification

1. [Gap assessment](gap-assessment.md) records the repository baseline and separates what to retain, refine, and add.
2. [Principles and appearance](appearance.md) defines shared visual decisions, theme recommendations, and the use of materials.
3. [Platform profiles](platform-profiles.md) describes experience profiles and adaptive layout choices.
4. [Navigation contract](navigation.md) defines application-owned routing behavior.
5. [Content, search, and state patterns](content-states.md) covers grouped lists, detail views, search, empty states, and progress.
6. [Presentation contract](presentation.md) distinguishes dialogs, sheets, popovers, menus, and inline disclosure.
7. [Touch, pointer, and keyboard interaction](interaction.md) defines input parity, targets, selection, and gesture boundaries.
8. [Motion contract](motion.md) gives state-based motion rules and reduced-motion fallbacks.
9. [Installed web app guidance](pwa.md) covers manifests, safe areas, viewport changes, lifecycle, and offline recovery.
10. [Native and web capability boundary](native-web-capabilities.md) states what the platform can and cannot guarantee.
11. [Adoption checklist](adoption.md) gives consuming applications an implementation contract.
12. [Validation matrix and rubric](validation.md) defines repeatable checks and their limits.
13. [Roadmap](roadmap.md) scopes 5B through 5F without implementing them in Phase 5A.

The three [reference screens](../../style-guide/experience/) demonstrate the direction using static HTML, CSS, and small local interactions. They are experimental style-guide material, not consumer imports or public APIs.

## Shared rules

- Use semantic links for navigation and buttons for actions. Preserve ordinary URL, history, focus, and scrolling expectations.
- Adapt structure to available space and input needs. Viewport width is a useful layout signal, not a device identity.
- Keep the content hierarchy and product identity consistent across profiles; vary navigation, density, and action placement only when the context benefits.
- Prefer native HTML controls, system fonts, and CSS layout. Do not require custom gestures, blur, JavaScript, a framework, or an install prompt for core tasks.
- Every action and destination has an accessible name, visible state, keyboard path, and pointer/touch path.
- Make loading, empty, success, error, and unsaved states explicit. Preserve user work during interruptions.
- Keep app-owned navigation and presentation distinct from browser or operating-system UI.

## Source and interpretation

The references below are official Apple, WebKit, or MDN documentation. The recommendations in these pages are Kihon interpretation for a browser environment, not Apple requirements or a promise of parity. HIG pages are living references; the verification date above records when this set was checked.

### Apple interface guidance

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) — principles and platform design guidance.
- [Navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search), [tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), and [sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars) — choosing top-level and hierarchical navigation.
- [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), [sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [popovers](https://developer.apple.com/design/human-interface-guidelines/popovers), [alerts](https://developer.apple.com/design/human-interface-guidelines/alerts), and [context menus](https://developer.apple.com/design/human-interface-guidelines/context-menus) — purpose and platform-appropriate presentation.
- [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures), [motion](https://developer.apple.com/design/human-interface-guidelines/motion), [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), and [designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos) — input, feedback, and platform expectations.
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials) and [Liquid Glass adoption](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass) — the distinction between the functional navigation layer and content.
- SwiftUI [NavigationStack](https://developer.apple.com/documentation/swiftui/navigationstack), [NavigationSplitView](https://developer.apple.com/documentation/swiftui/navigationsplitview), and [navigation overview](https://developer.apple.com/documentation/swiftui/navigation) — native examples of stack and split-view structure, used here only as conceptual references.

### Web platform guidance

- [WebKit: Safari 27.1 features](https://webkit.org/blog/18486/webkit-features-for-safari-27-1/) and [Safari 26 web apps on iOS and iPadOS](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) — Safari-specific support and the user-controlled Home Screen web app flow. The 27.1 Viewport Segments and Device Posture support described there is a preview behind feature flags, so this specification does not depend on it.
- [WebKit: Web Push for Home Screen web apps](https://webkit.org/blog/13878/) — iOS/iPadOS installation-context capabilities; verify the current OS, permission, and user-gesture requirements.
- MDN [web app manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest), [display mode](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display), [CSS environment variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Environment_variables), [safe-area values](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env), and [standalone apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Create_a_standalone_app) — browser-standard install metadata and layout mechanisms.
- MDN [VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport), [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), and [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — browser APIs whose actual availability and lifecycle behavior still require feature detection and device checks.

## Keeping this guidance current

When implementing a later phase, first verify each platform-specific statement against its linked reference and the minimum OS/browser versions supported by the consuming application. Record the tested browser build, OS version, install context, input method, and date. Do not infer behavior from a user-agent string or from a desktop browser emulating an iPhone viewport.
