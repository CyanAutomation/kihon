# Kihon (基本)

**The UI foundation for CyanAutomation.**

Kihon defines a lightweight, framework-free design system for CyanAutomation web applications: shared design decisions, accessible interface conventions, reusable CSS and small, optional TypeScript enhancements. It draws inspiration from Apple's Human Interface Guidelines—particularly the clarity and ergonomics of macOS and iOS—while remaining a web-native system rather than an imitation of SwiftUI.

> **Status: Draft foundation; Phase 2A buttons and actions, Phase 2B forms and grouped settings, and Phase 2C accessible dialogs are implemented.** Automated checks cover DTCG token validation, selected WCAG contrast pairings, generated-file consistency, HTML/CSS parsing, and Chromium interactions. These checks do not certify WCAG conformance. Sidebars and public package distribution remain planned. Kihon v1.0 has not been released. See [`docs/development.md`](docs/development.md) for build and contribution information.

## Why Kihon?

*Kihon* means **fundamentals** or **basics** in Japanese. The aim is to give different applications a reliable common starting point without removing their individuality.

Kihon exists to:

- Establish a consistent baseline for typography, colour, spacing, controls and interaction.
- Make web interfaces feel considered and familiar on both desktop and mobile devices.
- Preserve **vanilla HTML, CSS and TypeScript**, without requiring React, Vue, Ionic or another UI framework.
- Make accessibility, responsiveness and light/dark themes foundational rather than retrofits.
- Reduce duplicated styling and interaction patterns across CyanAutomation repositories.
- Record platform-neutral design decisions that can inform future native **SwiftUI** frontends.

Kihon is **not** a full application framework, a page builder, an Apple UI clone, a substitute for usability testing, or a way to convert HTML/CSS directly into SwiftUI.

## Principles

1. **Web-native first.** Prefer semantic HTML and built-in browser behaviour before custom controls or JavaScript.
2. **Foundation, not uniformity.** Share visual rules and behaviours; let each application retain its own identity and information architecture.
3. **Accessibility by design.** Target WCAG 2.2 AA, with meaningful keyboard, focus, screen-reader and reduced-motion support.
4. **Adaptive by default.** Support light and dark appearance, narrow screens, wide desktop windows and user preferences.
5. **Progressive enhancement.** Core functionality must not depend on blur, animation, advanced CSS effects or an optional enhancement script.
6. **Small and dependency-conscious.** Keep runtime code minimal, tree-shakeable where applicable, and easy to remove.
7. **Platform-neutral decisions.** Express intent in semantic tokens and documentation, not in hard-coded platform-specific styling alone.
8. **Documented and testable.** Every component needs a defined API, states, accessibility expectations and visual examples.

## Kihon UI Foundation v1.0 — planned scope

| Area | v1.0 expectations |
| --- | --- |
| **Design tokens** | Semantic colour, typography, spacing, radius, elevation, border and motion tokens; light/dark variants. |
| **Base CSS** | A restrained baseline, system-font stack, readable defaults, sensible layout primitives and predictable focus styles. |
| **Buttons** | Primary, secondary, destructive and quiet actions; hover, active, focus, disabled and busy states. |
| **Forms** | Labels, inputs, selects, checkboxes, textareas, validation, descriptions and error/help states. |
| **Desktop patterns** | Sidebar, toolbar, section headers, grouped settings and contextual actions informed by macOS conventions. |
| **Responsive patterns** | Sidebar collapse, appropriate mobile navigation and layouts that withstand zoom and narrow viewports. |
| **Dialogs** | Accessible modal interactions built on native `<dialog>`, with documented focus management and dismissal behavior. |
| **Style guide** | A static, framework-free site documenting foundations, component examples, states, usage and anti-patterns. |
| **Quality checks** | Token validation, accessibility checks, keyboard tests and visual regression coverage for supported examples. |

**v1.0 intentionally excludes** a general-purpose router, global application state, data fetching, authentication, icon library, complex data grids and a native SwiftUI implementation. Individual applications remain responsible for these concerns.

### macOS-inspired, not macOS-mimicking

For desktop-oriented applications, prefer clear window-size adaptation, restrained sidebars, meaningful toolbars, keyboard-efficient workflows, contextual actions, consistent selection states and legible information density. Avoid recreating operating-system window controls or browser chrome inside ordinary webpages. Use familiar platform conventions where they improve usability, without copying Apple's proprietary assets.

### Accessible interaction contracts

Components must document and test, as applicable:

- Correct semantics, names, labels and relationships.
- Keyboard access and visible focus indicators.
- Pointer, touch, keyboard and assistive-technology operation.
- Disabled, loading, error and success states.
- Contrast, text resizing, zoom and reflow.
- Reduced motion and usable fallbacks for decorative transparency.
- For dialogs: initial focus, focus containment when modal, Escape/cancel behaviour, focus restoration and appropriate labelling.

Automated checks are useful evidence, **not proof of WCAG conformance**; manual keyboard and assistive-technology checks remain necessary.

## Architecture (proposed)

The intended repository structure is:

```text
kihon/
├── tokens/                 # Platform-neutral design token source
├── src/
│   ├── css/                # Foundation and reusable CSS components
│   │   └── components/     # Buttons and future component styles
│   └── components/         # Optional vanilla TypeScript behaviours
├── style-guide/            # Static documentation and live examples
├── docs/
│   ├── foundation.md       # Normative v1.0 baseline and adoption rules
│   ├── macos-patterns.md   # Desktop interaction conventions
│   ├── accessibility.md    # Component and testing requirements
│   ├── swiftui-mapping.md  # Conceptual mapping to native SwiftUI
│   └── adopting-kihon.md   # Migration guidance for existing apps
├── tests/
└── package.json            # Only when packaging is introduced
```

This is a **proposed layout**, not a list of files that currently exist.

### Tokens and styling

Kihon will use semantic token names such as `surface`, `text.primary`, `border.subtle`, `accent` and `focus.ring`. The intended token source is compatible with the stable [Design Tokens Community Group format (2025.10)](https://www.designtokens.org/TR/2025.10/); CSS custom properties will be generated or maintained as the web-facing interface.

Illustrative future CSS variables:

```css
:root {
  --kh-surface: #ffffff;
  --kh-text-primary: #1d1d1f;
  --kh-accent: #2463c5;
  --kh-radius-control: 0.625rem;
}
```

These values are **examples, not final tokens**. Names, values and theming contracts will be defined and tested before the first release. Consumer applications should override documented semantic tokens rather than patching Kihon's internal selectors.

Kihon will use a predictable `kh-` prefix for its CSS classes and public custom properties to minimise collisions. Avoid intrusive global resets and unnecessarily high-specificity selectors.

## Quick Start

### Prerequisites

- Node.js 24 or later
- npm

### Building

```bash
# Install the locked development dependencies
npm ci

# Generate CSS from design tokens
npm run build

# Validate tokens and generated output
npm run validate

# Run unit, token, contrast, HTML/CSS, generated-file, and Chromium checks
npm test

# Build and serve the style guide
npm run dev
```

### Viewing the Style Guide

`npm run dev` builds the generated tokens and serves the guide at `http://127.0.0.1:4173/style-guide/`.

The style guide demonstrates:

- **Design tokens** — colours, spacing, typography, shadows, motion
- **Typography** — heading hierarchy, body text, code, links
- **Colour palette** — light and dark theme colours; approved pairings are checked by `npm run validate`
- **Spacing and radii** — geometric scales
- **Buttons and actions** — variants, sizes, states, icons, and application-owned status demonstrations
- **Forms** — native controls, field states, help and error associations, and a local validation example
- **Grouped settings** — responsive preference sections with native controls
- **Dialogs** — native modal information, validated preferences, and confirmation examples
- **Foundations** — surfaces and application layouts
- **Accessibility** — keyboard navigation, reduced motion, forced colours
- **Theme switcher** — test light, dark and system preference modes

### Using Kihon in Your Application

For Kihon components, consuming applications can import the foundation entry point:

1. Import the generated CSS:
   ```html
   <link rel="stylesheet" href="path/to/kihon/src/css/base.css">
   ```

2. Use semantic CSS variables in application styles:
   ```css
   .my-component {
     background-color: var(--kh-color-surface);
     color: var(--kh-color-text-primary);
     border-radius: var(--kh-radius-md);
     padding: var(--kh-space-4);
   }
   ```

3. Use the documented button classes, for example:
   ```html
   <button type="button" class="kh-button kh-button--primary">Save</button>
   <button type="button" class="kh-button kh-button--secondary kh-button--sm">Cancel</button>
   ```
   See [`docs/components/buttons.md`](docs/components/buttons.md) for variants, state handling, token customisation, and accessibility guidance.

4. Let CSS follow the system appearance or set `data-kh-theme="light"` / `data-kh-theme="dark"` on `<html>`. The theme switcher in `style-guide/` is a demonstration, not a production component.

No frontend framework is required. Kihon works with vanilla HTML, CSS and optional JavaScript.

Dialogs use native `<dialog>` opened with `showModal()`; the optional focus helper and consumer responsibilities are documented in [`docs/components/dialogs.md`](docs/components/dialogs.md).

Kihon is intended for CyanAutomation applications with a web UI. Headless Workers, APIs and background services are **not applicable**, rather than non-compliant.

1. Audit the app's current HTML, CSS, interaction patterns and accessibility baseline.
2. Adopt the published Kihon foundation stylesheet and semantic tokens.
3. Replace duplicated common styling incrementally; retain application-specific branding and layouts.
4. Adopt optional component behaviours only where native HTML/CSS is insufficient.
5. Run automated checks, keyboard checks and visual reviews; document any intentional exceptions.
6. Pin a released Kihon version and update it intentionally.

A future package may allow a consumer to import Kihon's styles directly; **there is no valid installation command or published API yet**. Examples will be added when package names and exports are finalised.

### Working with Testacoda

[Testacoda](https://github.com/CyanAutomation/testacoda) may eventually track Kihon adoption and UI-foundation evidence across repositories. Adoption reporting must distinguish **declared package use**, **automated test results** and **manual review**. A repository score cannot by itself certify visual quality or accessibility.

## Future SwiftUI readiness

Kihon is designed to preserve **design intent**, not to promise source-code portability. Tokens, information architecture, API contracts and documented interaction states can guide future SwiftUI implementations. HTML templates, CSS and TypeScript view behaviour will generally require native implementations.

The planned `swiftui-mapping.md` will describe conceptual equivalents—for example grouped settings and native `Form`/`Section`, sidebars and `NavigationSplitView`, and web dialogs and native sheets or alerts—without pretending they are interchangeable.

## Roadmap

- [ ] Formalise the UI Foundation v1.0 specification and acceptance criteria.
- [ ] Define and validate semantic light/dark design tokens.
- [ ] Implement the minimal base stylesheet and responsive primitives.
- [x] Implement core buttons and actions (Phase 2A).
- [x] Add accessible form styling with documented states (Phase 2B).
- [x] Implement grouped settings patterns with responsive rows (Phase 2B).
- [x] Implement native accessible dialogs with local examples (Phase 2C).
- [ ] Document and implement desktop sidebar/toolbar conventions.
- [x] Build a static, framework-free style-guide site with live examples.
- [ ] Add automated validation and manual review checklists.
- [ ] Pilot adoption in one CyanAutomation web application.
- [ ] Decide package exports, versioning, distribution and licensing before v1.0 release.
- [ ] Define a lightweight adoption-reporting contract for Testacoda.

Roadmap order and scope may evolve through implementation and review.

## Versioning and stability

**Kihon v1.0 is a target specification**, not an assertion that a package has shipped. Before v1.0, APIs, token names and file paths may change. Once published, releases should follow semantic versioning, document breaking changes and provide migration notes. The specification version and package version should be identifiable independently if they later evolve at different rates.

## Contributing

Use [GitHub Issues](https://github.com/CyanAutomation/kihon/issues) for proposals and [pull requests](https://github.com/CyanAutomation/kihon/pulls) for changes. Prefer small, accessible, documented additions rather than introducing large abstractions. A new public component should include examples of relevant states and supporting tests before being considered stable.

## Reference material

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [Design Tokens Community Group — 2025.10](https://www.designtokens.org/TR/2025.10/)
- [MDN Web Docs: HTML `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)

Kihon is an independent CyanAutomation project inspired by established design principles. It is **not affiliated with or endorsed by Apple**. Apple names and trademarks belong to their respective owners.

## License

A project licence has **not yet been specified in this README**. Confirm the repository licence and distribution terms before publishing reusable packages or assets.
