# Phase 5A repository gap assessment

This assessment reflects the repository after pulling the current main branch. It distinguishes implemented contracts from proposed application-level behavior. Kihon is an internal, framework-free UI package; the consumer archive exposes styles plus optional dialog and sidebar helpers.

## Keep

- Native HTML, CSS custom properties, semantic theme tokens, and small optional TypeScript helpers remain the foundation.
- The current component set covers application shell, sidebar links, page header, wrapping toolbar, grouped settings, cards, buttons, forms, and native modal dialogs.
- Light and dark themes, visible focus, forced-colors rules on core components, reduced-motion rules on existing sidebar behavior, and a system appearance option already exist.
- The responsive shell, sidebar collapse controller, forms, and dialogs have documented contracts and Chromium browser coverage.
- Existing package exports, class names, generated helper paths, and token values are public compatibility surfaces for this task.

## Refine

- The foundation currently defaults to dark. System mode follows the OS only when a consumer explicitly sets data-kh-theme="system"; the style guide has a selector for system, light, and dark. The Phase 5A recommendation is to make system-following the future default at a planned compatibility boundary, while keeping explicit overrides. Do not silently change the present default in this specification-only phase.
- The shell stacks regions at a fixed CSS breakpoint and the sidebar can collapse, but Kihon has no contract tying available width to a list/detail transition or an app-wide navigation choice.
- The sidebar is a link presentation and optional collapse behavior, not a navigation history manager. Applications still need router contracts for Back/Forward, direct links, selection, restoration, loading, and unsaved work.
- The page header and toolbar are presentational groups. They provide no standard action menu, adaptive navigation title, sheet, popover, tab bar, search workflow, or selected-detail model.
- Native dialog support has a public contract. Mobile sheet sizing, nonmodal anchored popovers, confirmation choice design, and context menus remain application patterns.
- Components have local state guidance, but there is no shared application workflow contract for loading, empty/error recovery, interrupted edits, foregrounding, or selection restoration.
- The current token vocabulary supports restrained opaque surfaces and themes. It does not include platform/material APIs; do not add new public tokens just to imitate Liquid Glass.

## Missing platform experience patterns

- Three experience profiles based on available space and actual input, with layout-transition expectations.
- Application-level navigation and presentation contracts that preserve browser semantics without turning Kihon into a router.
- Touch, pointer, keyboard, focus, selection, motion, and gesture parity across complete workflows.
- Installed-web-app guidance for manifests, safe areas, dynamic browser chrome, virtual keyboards, offline behavior, and lifecycle changes.
- A cross-platform validation matrix that separates automated checks from physical Apple-device checks.
- Complete responsive examples that show the same product identity in compact touch, adaptive tablet, and desktop analytical contexts.

## Ownership boundary

Kihon specifies semantic markup, presentation and interaction expectations, adaptable layout patterns, accessibility, and small optional helpers. A consuming application selects routes, manages URL/history, data, authentication, business rules, persistence, synchronization, offline policy, and whether a task needs a native wrapper. Kihon must not infer a product's information architecture or store app-wide navigation state.

## Repository evidence reviewed

- README.md, docs/foundation.md, docs/development.md, docs/distribution.md, and docs/components/*.
- src/css/base.css, src/css/components/*, src/ts/dialogs.ts, src/ts/sidebar.ts, generated CSS, tokens/*, and package.json.
- style-guide/index.html and local demonstration scripts.
- tests/browser/*, tests/unit/*, tests/MANUAL_TESTING.md, tests/README.md, tests/TRACEABILITY.md, and playwright.config.js.

The automated browser configuration currently runs Chromium. Its existing responsive tests do not represent Safari installation, iOS browser chrome, the iPad software keyboard, VoiceOver, or macOS window behavior.
