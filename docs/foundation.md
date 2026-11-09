# Kihon UI Foundation v1.0

**CyanAutomation's framework-free baseline for consistent, accessible web interfaces.**

| Field | Value |
| --- | --- |
| Document | `docs/foundation.md` |
| Specification | Kihon UI Foundation v1.0 (proposed) |
| Document status | **Draft 0.1 — not yet ratified or implemented** |
| Updated | 2026-11-06 |
| Applies to | CyanAutomation projects with a user-facing web interface |
| Maintained by | [CyanAutomation/kihon](https://github.com/CyanAutomation/kihon) |

This is the **normative design and implementation contract** for Kihon. It converts the goals in the [README](../README.md) into rules that can be implemented, reviewed and tested. The values, CSS interfaces and acceptance criteria below are **proposed v1.0 decisions**, not a claim that the corresponding files or package already exist. They may change before the first release.

Kihon draws on Apple Human Interface Guidelines for clarity, content hierarchy, adaptive layouts and desktop ergonomics, but it is a **web-native, independent design system**, not a SwiftUI implementation or an Apple UI replica.

## 1. Conformance language and applicability

- **MUST / MUST NOT**: required for Kihon Foundation v1.0 conformance after the specification is ratified.
- **SHOULD / SHOULD NOT**: recommended; deviations require a documented reason.
- **MAY**: optional, provided it does not conflict with a requirement.

Conformance is assessed **per applicable web frontend**, not automatically per repository. API-only Workers, CLI programs, libraries without UIs and background services are **not applicable (N/A)**. Specialized games, kiosk dashboards and embedded UIs MAY document an equivalent pattern where a standard desktop layout would harm usability; accessibility requirements still apply.

There are three distinct claims:

1. **Foundation adoption** — the app consumes or faithfully implements the published Kihon tokens and foundational styles.
2. **Foundation conformance** — the app passes the required automated and manual criteria in this document.
3. **Design quality** — evaluated separately through usability and visual review, not inferred from adoption or automated checks.

A project MUST NOT claim conformance merely because it has installed the future package.

## 2. Non-goals and technical constraints

Kihon v1.0 MUST work with **semantic HTML, standards-based CSS and optional vanilla TypeScript/JavaScript**. It MUST NOT require React, Vue, Angular, Svelte, Ionic, Tailwind, a client-side router or a global state manager. Development-time tooling is allowed when it does not impose a runtime framework on consuming applications.

Out of scope for v1.0: application routing, authentication, data fetching, charts, complex data grids, large icon collections, business logic, full native SwiftUI components and cross-platform code conversion.

Kihon MUST avoid copying Apple's proprietary artwork, SF Symbols, macOS traffic-light window controls or system browser chrome. The aim is familiar usability and visual restraint, not pixel-perfect imitation.

## 3. Design principles

1. **Content first.** Reduce decoration; distinguish navigation, content and actions through clear hierarchy.
2. **Native web primitives.** Prefer `<button>`, `<a>`, `<label>`, `<input>`, `<select>`, `<fieldset>`, `<nav>` and `<dialog>` over bespoke equivalents.
3. **System-native feel.** Use system fonts, platform capabilities and familiar keyboard/pointer behaviour.
4. **Semantic before literal.** Code uses design decisions such as `text-primary` and `surface`, not arbitrary colour hex values.
5. **Adaptive, not device-sniffed.** Layout responds to available space, input capability and user settings.
6. **Accessible in every state.** Hover-only affordances and colour-only information are insufficient.
7. **Progressive enhancement.** Essential content and navigation remain usable without effects or optional scripts; interactions requiring JavaScript must have an intentional fallback or be documented as app functionality.
8. **Small public surface.** Stable classes and tokens are documented; internal styles are not consumer extension points.

## 4. Design tokens

### 4.1 Source of truth and naming

The token source MUST follow the [Design Tokens Community Group Format 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), using typed `$value` entries. Kihon SHOULD maintain primitive palettes separately from semantic aliases. Platform outputs (including CSS and possible future Swift colour assets) MUST be derived from, or validated against, the same source.

Rules:

- Published CSS custom properties MUST use the `--kh-` prefix; public CSS classes MUST use `kh-`.
- Semantic colour names MUST express **purpose**, never a specific hue or light/dark appearance.
- A consumer MUST NOT rely on undocumented private classes, selectors or token names.
- App branding MAY override documented semantic tokens, but MUST revalidate colour contrast and component states.
- Public token removal, renaming or semantic repurposing after v1.0 is a breaking change.
- Token transformation MUST fail on invalid types, unresolved aliases, circular references and duplicate public names.

An **illustrative** typed token, using the community-group format:

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/format.json",
  "spacing": {
    "$type": "dimension",
    "4": { "$value": { "value": 16, "unit": "px" } }
  }
}
```

The final implementation MUST validate source files against the adopted format. The example does not establish file paths or build commands.

### 4.2 Semantic colour roles

The following **candidate defaults** establish a concrete starting palette; they are subject to cross-state contrast and visual tests before ratification.

| Public CSS token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `--kh-color-background` | `#f5f5f7` | `#141518` | Application canvas |
| `--kh-color-surface` | `#ffffff` | `#1f2024` | Cards, grouped sections and panels |
| `--kh-color-text-primary` | `#141518` | `#f5f5f7` | Main content and headings |
| `--kh-color-text-secondary` | `#475467` | `#c3c6ce` | Secondary readable content |
| `--kh-color-accent` | `#c2410c` | `#fb923c` | Primary controls and emphasis |
| `--kh-color-on-accent` | `#ffffff` | `#141518` | Text/icons on an accent fill |
| `--kh-color-danger` | `#b42318` | `#f97066` | Destructive actions and error text |
| `--kh-color-success` | `#166534` | `#86efac` | Positive status text and indicators |
| `--kh-color-success-background` | `#f0fdf4` | `#1b3a25` | Background for positive status labels |
| `--kh-color-border-subtle` | `#d0d5dd` | `#525760` | Decorative separators only |
| `--kh-color-border-strong` | `#667085` | `#969da8` | Boundaries essential to identifying controls |
| `--kh-color-focus-ring` | `#c2410c` | `#fdba74` | Visible keyboard focus indicator |

Important: `border-subtle` is **not** suitable as the sole indicator of a control boundary where a 3:1 non-text contrast is required. Validate colours in their **actual combinations** (including fills, overlays and states), not as isolated swatches. Colour MUST NOT be the only way to convey error, success, required status or selection.

### 4.3 Typography

- Font stack MUST default to `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`, without shipping Apple font files.
- Body text SHOULD start at **1rem** (normally 16 CSS px) with line-height **1.5**; dense metadata MAY use **0.875rem** (normally 14 CSS px) where readability is preserved.
- The preliminary type scale is **0.875 / 1 / 1.125 / 1.25 / 1.5 / 2rem**. Headings MUST communicate semantic hierarchy with HTML heading elements, not typography alone.
- Text SHOULD use relative units (`rem`/`em`) so browser font-size preferences continue to work.
- Text MUST wrap or reflow without truncating essential meaning. Truncation MAY be used for supplementary labels if the complete value remains accessible.
- Avoid gratuitous all-caps, letter-spacing and excessively light font weights in ordinary body copy.

### 4.4 Spacing, geometry and elevation

The proposed spacing scale is **0, 4, 8, 12, 16, 24, 32 and 48 CSS px**, represented by `--kh-space-0`, `--kh-space-1`, `--kh-space-2`, `--kh-space-3`, `--kh-space-4`, `--kh-space-6`, `--kh-space-8` and `--kh-space-12`. These SHOULD be emitted in rem units where appropriate (based on a default 16px root).

The proposed corner-radius tokens are:

| Token | Candidate value | Use |
| --- | --- | --- |
| `--kh-radius-sm` | `0.5rem` | Compact controls |
| `--kh-radius-md` | `0.75rem` | Buttons, fields, list groups |
| `--kh-radius-lg` | `1rem` | Cards and larger surfaces |
| `--kh-radius-pill` | `9999px` | Pills and fully rounded controls |

- Kihon MUST define restrained elevation/shadow tokens, including a no-shadow state.
- Shadows and translucency MUST NOT be necessary to perceive a control or understand content.
- Rounded corners, shadows and blur MUST NOT create clipped focus indicators or obscured content.

### 4.5 Motion

- Motion SHOULD serve state changes and spatial orientation rather than decoration.
- Candidate duration tokens: `--kh-motion-fast: 120ms`, `--kh-motion-normal: 200ms`, `--kh-motion-slow: 300ms`.
- Components MUST respect `prefers-reduced-motion: reduce`; essential information MUST remain available without animation.
- Avoid animated layout shifts, flashing, excessive parallax and constant attention-seeking effects.

## 5. Themes and personalisation

- Kihon MUST support light and dark appearances, defaulting to **dark**.
- Apps MAY allow an explicit **dark / light / system** choice. If implemented, explicit selection MUST take precedence over system preference, and the app MUST manage any persistence.
- The override mechanism is `data-kh-theme="light"`, `data-kh-theme="dark"`, or `data-kh-theme="system"` on the document root. With no attribute, Kihon uses dark. System mode follows `prefers-color-scheme`.
- Component styles MUST account for native controls using the CSS `color-scheme` property.
- `forced-colors: active` and increased-contrast preferences MUST remain usable. Do not disable forced-colours adjustment globally.
- Translucent surfaces MAY be used sparingly for navigation chrome but MUST have an opaque, readable fallback, including when `backdrop-filter` is unsupported.

Illustrative output contract (generated CSS MAY differ in implementation):

```css
:root {
  color-scheme: dark;
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  --kh-color-background: #141518;
  --kh-color-surface: #1f2024;
  --kh-color-text-primary: #f5f5f7;
  --kh-color-accent: #fb923c;
}

:root[data-kh-theme="dark"] {
  color-scheme: dark;
  --kh-color-background: #141518;
  --kh-color-surface: #1f2024;
  --kh-color-text-primary: #f5f5f7;
  --kh-color-accent: #fb923c;
}

@media (prefers-color-scheme: light) {
  :root[data-kh-theme="system"] {
    color-scheme: light;
    --kh-color-background: #f5f5f7;
    --kh-color-surface: #ffffff;
    --kh-color-text-primary: #141518;
    --kh-color-accent: #c2410c;
  }
}

:root[data-kh-theme="light"] {
  color-scheme: light;
  --kh-color-background: #f5f5f7;
  --kh-color-surface: #ffffff;
  --kh-color-text-primary: #141518;
  --kh-color-accent: #c2410c;
}
```

**Implementation note:** this snippet demonstrates the override approach using selected tokens, not the full token implementation. The released stylesheet MUST implement all theme-specific semantic tokens, rather than changing `color-scheme` alone.

## 6. Base CSS and layout

Kihon's base stylesheet MUST:

- Set `box-sizing: border-box` predictably without overriding native semantics.
- Respect default browser controls unless a documented Kihon style is applied.
- Preserve visible focus (`:focus-visible`) and default keyboard behaviour.
- Avoid broad `outline: none`, `user-select: none`, `overflow: hidden` and unscoped form resets.
- Use logical properties where practical for potential right-to-left support.
- Avoid hard-coded viewport dimensions that break zoom, resizable windows or browser toolbars.
- Give images/media responsive intrinsic sizing without indiscriminately changing their aspect ratios.

A standard desktop shell SHOULD support a navigation area, a main content area and an optional contextual/details area. At narrower widths the layout SHOULD condense, stack or expose navigation through a labelled control. **Do not force desktop sidebars or mobile tab bars onto apps where they are inappropriate.**

The app MUST remain functional at narrow viewports and with large text. Breakpoints SHOULD be content-driven; `48rem` (768px) is a reasonable *initial test breakpoint*, not a mandatory global boundary. Prefer `minmax()`, `clamp()`, flex and grid over fixed widths.

## 7. Component contracts

Every public component MUST document its name, purpose, markup contract, classes/attributes, states, keyboard behaviour, accessibility constraints, token dependencies and example use. Any optional TypeScript enhancement MUST have a small, explicit API and no implicit global state.

### 7.1 Buttons and actions

- Native `<button type="button">` MUST be used for actions; `<a href>` MUST be used for navigation. Form submit controls MUST declare the intended `type`.
- Proposed classes: `.kh-button`, `.kh-button--primary`, `.kh-button--secondary`, `.kh-button--quiet`, `.kh-button--destructive`.
- Required states: default, hover where supported, active, focus-visible, disabled and busy/loading.
- Busy indicators MUST not erase the control's accessible name; duplicate submissions SHOULD be prevented without trapping focus.
- Icon-only buttons MUST have an accessible name. Decorative icons MUST be hidden from accessibility APIs.
- Kihon SHOULD target **at least 44 × 44 CSS px** for frequently touched controls; WCAG 2.2 AA requires at least **24 × 24 CSS px** for pointer targets *unless a permitted exception applies*. Compact desktop variants MAY be smaller than 44px with appropriate evidence and spacing.
- Destructive actions SHOULD be distinguishable by wording, not colour alone. Irreversible actions SHOULD use confirmation or a recoverable alternative where warranted.

### 7.2 Forms

- Every input MUST have a persistent visible label, appropriately associated through native `<label>` or an equivalent accessible relationship. Placeholder text MUST NOT replace labels.
- Related controls SHOULD be grouped using `<fieldset>` and `<legend>` where appropriate.
- Required, optional, disabled, read-only, invalid and help states MUST be perceptible and correctly conveyed.
- Error messages MUST explain how to recover, MUST NOT rely on red colouring alone, and MUST be associated with the field (for example through `aria-describedby`).
- Use native HTML validation thoughtfully; avoid reporting errors only by transient toast messages.
- Focus order MUST follow a logical reading and task sequence. Do not disable paste, password-manager integration or browser autofill without compelling reason.
- Use native checkbox, radio and select elements by default. Bespoke replacements require equivalent accessibility tests.

### 7.3 Grouped settings and list rows

- A grouped settings section MUST have a descriptive heading or legend.
- Entire-row activation MUST be used only when the whole row clearly represents one action or navigation destination; avoid invalid nested interactive elements.
- Selection and current-location states MUST be represented semantically (`aria-current`, native checked state or another appropriate mechanism).
- Secondary descriptions SHOULD remain readable and wrap. Status MUST NOT be represented solely through an icon or coloured dot.

### 7.4 Desktop sidebar

- Use `<nav aria-label="…">` for primary navigation, with one clear current item; use `<aside>` only for complementary content.
- Current-page navigation links SHOULD use `aria-current="page"`.
- The sidebar MUST remain usable with the keyboard, pointer and narrow layouts.
- If collapsible, the toggle MUST be a labelled button with `aria-expanded` and `aria-controls`, and collapsed content MUST be genuinely removed from focus navigation when hidden.
- Sidebar width and visibility SHOULD adapt to actual available space. Sidebar state persistence is an application decision.
- Do not imitate Finder windows or native traffic-light controls in webpage chrome.

### 7.5 Desktop toolbar

- Put page-specific actions near the content they affect; separate primary from secondary actions.
- Toolbars SHOULD be visually restrained and may be sticky only when they do not hide headings, focus targets or anchor destinations.
- A plain group of controls does **not** need `role="toolbar"`. Only use that role when implementing and testing its expected composite keyboard behaviour, including arrow-key navigation.
- Keyboard shortcuts MAY be provided for frequent actions, but MUST be discoverable, MUST avoid browser/system-reserved combinations and MUST not be the only way to invoke an action.
- Prefer wrapping groups over hiding or clipping controls. An application that needs an overflow menu MUST implement and test its menu semantics, focus, dismissal, and keyboard behavior as a separate pattern.

### 7.6 Modal dialog

The default Kihon modal dialog MUST use native HTML `<dialog>` opened with `showModal()` when available. Native browser focus containment and background inertness SHOULD be retained rather than recreated through custom traps. A nonmodal `show()` dialog MUST NOT be treated as modal.

Required behaviour:

1. A trigger has a clear label and opens the dialog.
2. The dialog has an accessible name (`aria-labelledby` or equivalent) and, where helpful, a description.
3. Initial focus is intentional; `autofocus` MAY identify the appropriate target, and long/destructive dialogs SHOULD avoid unexpectedly focusing the destructive action.
4. Keyboard Tab/Shift+Tab stay within the modal while it is active.
5. Escape closes a dismissible dialog; non-dismissible workflows MUST justify and implement an accessible alternative.
6. A visible Cancel/Close action is provided. The dialog MUST NOT require backdrop clicks to close.
7. Closing normally restores focus to the invoking control or a logical successor; this MUST be tested when the trigger is removed dynamically.
8. Validation failure MUST keep the user in context and identify the affected field(s).
9. The `cancel`, `close` and form-result paths MUST behave consistently, without duplicate submissions.
10. On a no-JavaScript route, critical application workflows MUST have an accessible alternative (for example, a normal settings page).

A minimal **illustrative** pattern:

```html
<button type="button" id="open-preferences">Preferences</button>
<dialog id="preferences" aria-labelledby="preferences-title">
  <form method="dialog">
    <h2 id="preferences-title">Preferences</h2>
    <p>Choose your settings.</p>
    <button value="cancel" autofocus>Cancel</button>
    <button value="confirm">Done</button>
  </form>
</dialog>
<script type="module">
  const trigger = document.querySelector('#open-preferences');
  const dialog = document.querySelector('#preferences');
  trigger?.addEventListener('click', () => dialog?.showModal());
</script>
```

This is a **behaviour sketch**, not a released Kihon component. A real settings workflow MUST implement and test its own save/validation handling.

### 7.7 Content cards

- Cards SHOULD group related content and actions using a semantic surface, readable text, and a visible boundary.
- A card MUST use the HTML element and heading level that match its content; CSS classes MUST NOT add roles or focusability.
- Independent controls inside a card MUST remain independently operable. Do not make an entire card clickable around nested actions.
- Cards MUST preserve readable content in light, dark, and forced-colours modes and MUST NOT depend on shadow or blur to communicate structure.

### 7.8 Status badges

- Badges MUST use concise text to convey a state or category; colour alone MUST NOT carry meaning.
- Static badges MUST NOT be focusable or presented as buttons. Dynamic status changes SHOULD use a separate appropriate live region.
- Semantic status foreground/background pairs MUST meet the applicable contrast requirements in both themes.

## 8. Accessibility requirements

Kihon targets **WCAG 2.2 AA** for applicable UI. The design system can provide accessible defaults, but final conformance is assessed in a **complete application and its workflows**.

| Area | Required v1.0 evidence |
| --- | --- |
| Text contrast | At least **4.5:1** for normal text and **3:1** for qualifying large text, subject to WCAG exceptions |
| Non-text contrast | **3:1** for necessary control boundaries, states and meaningful graphical elements |
| Focus | Visible keyboard focus, logical order, no obscured focused element |
| Reflow/zoom | No loss of content or function at **200% text resize** and at **400% page zoom** in applicable reflow scenarios (typically a 320 CSS px-wide viewport), subject to WCAG exceptions |
| Pointer targets | WCAG 2.2 AA **24 × 24 CSS px** minimum or permitted spacing/other exception; **44 × 44 CSS px** preferred for common touch actions |
| Keyboard | Every action operable without a pointer; no keyboard traps |
| Input | Persistent labels, discoverable errors and usable instructions |
| Preference modes | Light/dark, reduced motion and forced-colours behaviour checked |
| Semantics | Valid landmarks, heading sequence and controls with accessible names |

All component examples MUST support keyboard use and must not create an inaccessible experience when JavaScript is disabled or features are unsupported. Where a feature inherently requires scripting, provide a documented functional alternative appropriate to the app.

## 9. Validation and release gates

The initial style guide MUST expose examples for light/dark themes, buttons (all required states), cards, status badges, forms (normal/error/disabled), sidebar expanded/collapsed, responsive toolbar and modal dialog. These examples SHOULD serve as test fixtures.

**Automated checks** SHOULD include:

- DTCG source validation, alias resolution and generated-CSS consistency.
- Tests for public exports, selector/token naming and CSS parsing.
- Lint/static checks for invalid HTML and common accessibility mistakes.
- Colour-contrast testing of approved foreground/background pairs in light/dark themes.
- Browser-level keyboard and state tests for interactive enhancements.
- Visual regression snapshots of common breakpoints, themes and focus/error states.
- A dependency/runtime-size report; regressions must be justified.

**Manual checks MUST include**:

- Tab, Shift+Tab, Enter, Space and Escape paths for interactive examples.
- A screen-reader smoke test on at least one supported desktop combination; a mobile assistive-technology check when the component is touch-oriented.
- Browser zoom, text resize, narrow layout and high-contrast/forced-colours review.
- Reduced-motion and no-blur fallbacks.
- Dialog open, cancel, submit, validation and focus restoration.
- Visual review for truncation, overlaps, excessive density and legibility.

The minimum supported browser matrix SHOULD be the **current and immediately preceding major versions**, where available, of Safari (macOS and iOS), Chrome, Firefox and Edge. For a release, maintain a documented tested-version matrix rather than claiming blanket compatibility. Fallbacks MUST be considered for unsupported CSS/browser APIs.

### v1.0 release acceptance checklist

- [ ] This specification is reviewed, ratified and tagged as v1.0.
- [ ] All public semantic tokens exist and have a validated DTCG source.
- [ ] CSS exports/classes are documented and prefixed with `kh-`.
- [ ] Light/dark and forced-colours modes are demonstrably usable.
- [ ] Buttons, forms, grouped settings, cards, badges, sidebar, toolbar and modal dialog have examples and contracts.
- [ ] Required keyboard, accessibility and responsive checks pass, with evidence.
- [ ] Static style guide builds and is usable without a frontend framework.
- [ ] The intended package name, exports, versioning, licence and release process are documented.
- [ ] At least one representative CyanAutomation app completes a pilot adoption.
- [ ] Breaking changes and known limitations are documented.

Failing a required gate blocks a v1.0 conformance claim. Non-applicable items and justified exceptions must be recorded, not silently counted as passes.

## 10. Adoption and governance

A consuming project SHOULD record its Kihon version, applicable interface scope, adopted components and evidence for required checks. A future `ui-foundation.json` manifest MAY standardise this information; its schema is **not yet defined**, and no manifest is required until ratified.

Projects MAY retain their own brand accents, distinctive content visualisations and layout patterns. They MUST NOT override the foundation in a way that removes keyboard access, visible focus, legibility or meaning. Significant exceptions SHOULD be documented with rationale, owner and review date.

[Testacoda](https://github.com/CyanAutomation/testacoda) MAY later report adoption and collect evidence from repository files and CI results. It MUST distinguish **package presence**, **automated compliance evidence** and **manual assessment**, and MUST NOT claim WCAG certification based on repository scanning alone.

The Kihon specification and released package MUST have independently identifiable versions. Post-v1.0 public API or token breaking changes require a major version, migration notes and review of affected consumers. Experimental styles MUST be clearly marked and kept out of the stable public contract.

## 11. SwiftUI-readiness contract

Kihon preserves transferable **design decisions**, not executable view code. Component names, semantic roles, interaction states, responsive intent and token meanings SHOULD be documented in platform-neutral terms. Future `docs/swiftui-mapping.md` may describe conceptual counterparts such as grouped settings/`Form`, desktop navigation/`NavigationSplitView`, toolbar/`.toolbar` and modal dialog/`.sheet` or `.alert`.

HTML, CSS and TypeScript UI code are **not directly reusable** as SwiftUI views. Backend contracts and data models should remain separated from DOM presentation in consumer applications if native delivery is a longer-term objective.

## References

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple: Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)
- [WCAG 2.2 specification](https://www.w3.org/TR/WCAG22/)
- [WCAG 2.2 — Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- [W3C Design Tokens Format 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/)
- [MDN: HTML `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)

---

**Document status:** Draft for review. Requirements become binding for Kihon v1.0 only when this specification is approved and the corresponding implementation is released. Kihon is independent of Apple and is not endorsed by Apple.
