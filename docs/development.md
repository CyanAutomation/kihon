# Kihon Development Guide

This document explains how Kihon's design tokens, CSS, reusable TypeScript behavior, and style guide are organized and built.

Phases 2A–2C and 3A–3C are implemented as framework-free components. See [`components/buttons.md`](components/buttons.md), [`components/forms.md`](components/forms.md), [`components/grouped-settings.md`](components/grouped-settings.md), [`components/dialogs.md`](components/dialogs.md), [`components/app-shell.md`](components/app-shell.md), [`components/sidebar.md`](components/sidebar.md), [`components/page-header.md`](components/page-header.md), and [`components/toolbar.md`](components/toolbar.md) for their public contracts. Dialog and sidebar behaviors are optional and documented separately from their CSS APIs. Page headers and toolbars are CSS-only.

Use Node.js 26 or later and npm. The minimum version covers the HTML validation and browser-test tools. Generated Kihon CSS and the compiled dialog and sidebar helpers have no npm runtime dependencies; TypeScript and esbuild are development-only.

## Repository Structure

```
kihon/
├── tokens/                      # Design token source (DTCG format)
│   ├── primitives.json          # Base colour, spacing, typography values
│   ├── semantic.json            # Platform-neutral semantic token aliases
│   └── themes/
│       ├── light.json           # Light theme colour assignments
│       └── dark.json            # Dark theme colour assignments
├── src/
│   └── css/
│       ├── tokens.css           # Generated: CSS custom properties
│       ├── base.css             # Foundation styles and resets
│       └── components/          # Component rules imported by base.css
│           ├── buttons.css
│           ├── forms.css
│           ├── settings.css
│           ├── dialogs.css
│           ├── app-shell.css
│           ├── sidebar.css
│           ├── page-header.css
│           └── toolbar.css
├── src/ts/
│   ├── dialogs.ts               # Reusable dialog runtime source
│   └── sidebar.ts               # Reusable sidebar runtime source
├── src/js/
│   ├── dialogs.js               # Generated browser/CommonJS helper
│   ├── dialogs.js.map            # Generated source map
│   ├── dialogs.d.ts              # Generated public declarations
│   ├── sidebar.js                # Generated browser/CommonJS helper
│   ├── sidebar.js.map             # Generated source map
│   └── sidebar.d.ts               # Generated public declarations
├── style-guide/                 # Static documentation site
│   ├── index.html               # Main style guide page
│   ├── styles.css               # Style guide-specific styles
│   ├── theme.js                 # Style-guide theme switcher
│   ├── sidebar.js               # Local sidebar navigation demo
│   ├── buttons.js               # Style-guide button demonstrations
│   ├── forms.js                 # Local form and validation demonstrations
│   ├── settings.js              # Local grouped-settings demonstration
│   └── dialogs.js               # Local dialog demonstrations
├── scripts/
│   ├── build-tokens.js          # Generates tokens.css from source
│   ├── build-runtime.js         # Generates runtime bundles and declarations
│   ├── token-resolver.js        # Resolves aliases and formats typed values
│   ├── token-validation.js     # DTCG schema and value validation
│   ├── contrast.js              # WCAG contrast calculations
│   ├── check-generated.js       # Detects stale committed CSS
│   ├── sanity-check.js          # Parses HTML and CSS
│   └── serve.js                 # Local style-guide preview server
├── schemas/                     # Vendored DTCG JSON Schema
├── .github/workflows/ci.yml     # Pull request and main-branch checks
├── tests/                       # Test fixtures and checks
├── docs/
│   ├── foundation.md            # Normative specification
│   ├── development.md           # This file
│   └── components/              # Public component contracts
│       ├── buttons.md
│       ├── forms.md
│       ├── grouped-settings.md
│       ├── dialogs.md
│       ├── app-shell.md
│       ├── sidebar.md
│       ├── page-header.md
│       └── toolbar.md
└── package.json                 # Build configuration
```

## Reusable TypeScript behavior

TypeScript is the preferred source language for new reusable Kihon runtime behavior. CSS remains responsible for presentation, HTML for structure and native semantics, and generated JavaScript for browser and Node consumers. Applications do not need TypeScript or a runtime framework.

Reusable TypeScript helpers have one source file per component:

| Helper | TypeScript source | Browser global / Node CommonJS output | Declarations |
| --- | --- | --- | --- |
| Dialogs | `src/ts/dialogs.ts` | `src/js/dialogs.js` (`window.KihonDialogs`) | `src/js/dialogs.d.ts` |
| Sidebar | `src/ts/sidebar.ts` | `src/js/sidebar.js` (`window.KihonSidebar`) | `src/js/sidebar.d.ts` |

Each JavaScript output has a generated `.js.map` source map beside it.

| Build command | Purpose |
| --- | --- |
| `npm run build` | Build tokens, legacy runtime outputs, and package outputs in `dist/`. |
| `npm run build:runtime` | Build the existing browser-global/CommonJS compatibility outputs and declarations in `src/js/`. |
| `npm run build:package` | Build ESM, CommonJS, browser-global, declaration, and bundled CSS package artifacts in `dist/`. |
| `npm run test:package` | Pack and install the archive in isolated JavaScript, TypeScript, and browser consumers. |
| `npm run typecheck` | Strict type check without emitting. |

The generated helpers in `src/js/` remain usable as classic browser scripts exposing `window.KihonDialogs` and `window.KihonSidebar`, and through Node `require()` at their existing paths. Each bundle is built from its TypeScript source; there is no second handwritten implementation. TypeScript and esbuild are development dependencies only. The existing compatibility JavaScript, source maps, and declarations are committed; `npm run check:generated` detects stale output without rewriting it. These compatibility bundles are not browser ES modules.

The internal package generates separate native ESM (`.mjs`), CommonJS (`.cjs`), module-specific declaration (`.d.mts`/`.d.cts`), browser-global, and CSS artifacts under `dist/`. `dist/` is ignored by Git. `npm pack` runs the `prepack` build automatically, and package tests verify that this archive contains every export and only the consumer files. The package contract is described in [`distribution.md`](distribution.md).

When adding reusable behavior, place source in `src/ts/`, export a small typed API, add generated output through `scripts/build-runtime.js`, and cover both the compiled Node path and browser path where applicable. New CSS-only components do not need JavaScript. Existing style-guide scripts, token/build scripts, and tests remain JavaScript for now; consider migrating them incrementally when shared runtime behavior or stronger type guarantees make that useful. Phase 3C page headers and toolbars use native semantics and CSS only.

## Design Tokens

`src/css/base.css` is the CSS source entry point. It imports generated tokens,
then buttons, forms, grouped-settings, dialogs, application-shell, sidebar,
page-header, and toolbar styles in that order. Package builds resolve those
imports into the self-contained `dist/styles.css`; applications do not need to
import files from Kihon's source tree or `style-guide/`. Optional dialog and
sidebar helpers are authored in `src/ts/` and generated at `src/js/` and `dist/`;
neither has runtime dependencies.

### Token Source Structure

Kihon uses the [Design Tokens Community Group Format 2025.10](https://www.designtokens.org/TR/2025.10/) for platform-neutral token definitions.

Each token file is a JSON object with typed `$value` entries:

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/format.json",
  "colors": {
    "gray": {
      "100": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [0.9607843, 0.9607843, 0.9686275],
          "hex": "#f5f5f7"
        }
      }
    }
  },
  "spacing": {
    "4": {
      "$type": "dimension",
      "$value": { "value": 16, "unit": "px" }
    }
  }
}
```

The matching 2025.10 format schema is checked in at `schemas/dtcg-2025.10-format.schema.json`, so validation does not depend on network access.

### Primitive vs. Semantic Tokens

**Primitives** (`tokens/primitives.json`) define base values:
- Colour palette (gray, blue, red)
- Spacing scale (0, 4, 8, 12, 16, 24, 32, 48 px)
- Typography (sizes, weights, fonts)
- Shadows and radii

**Semantics** (`tokens/semantic.json`) define purpose-based aliases:
- `color.text-primary` (what it is) instead of `colors.gray.900` (literal value)
- `space.4` as the semantic alias for the 16px primitive at `spacing.4`

This separation allows themes to override colour values without touching component code.

### Theme System

Kihon supports three appearance modes:

1. **System** (default): Respects `prefers-color-scheme: dark` OS preference
2. **Light**: Force light appearance
3. **Dark**: Force dark appearance

Themes are implemented using the `data-kh-theme` attribute on the root `<html>` element:

```html
<!-- System/default (no attribute) -->
<html>

<!-- Force light theme -->
<html data-kh-theme="light">

<!-- Force dark theme -->
<html data-kh-theme="dark">
```

Each theme file defines how semantic tokens resolve in that mode. For example:

- Light theme: `color.text-primary` → `#171a17` (warm charcoal)
- Dark theme: `color.text-primary` → `#f5f5f7` (light gray)

### Token Aliases

Tokens reference other tokens using the `{path.to.token}` syntax:

```json
{
  "color": {
    "text-primary": {
      "$type": "color",
      "$value": "{colors.gray.900}"
    }
  }
}
```

The build process recursively resolves aliases into final values for CSS output.
Primitive groups such as `colors` are available directly to semantic and theme
tokens. To reference a token in another document explicitly, prefix the path
with its document name, for example `{semantic.color.text-primary}` or
`{primitives.colors.gray.900}`. The explicit prefix avoids ambiguity between a
semantic token and a theme token with the same path.

## Building and Generating CSS

### Token to CSS Compilation

```bash
npm run build-tokens
```

This runs `scripts/build-tokens.js`, which:

1. Loads `tokens/primitives.json`, `tokens/semantic.json` and theme files
2. Resolves all token aliases recursively
3. Detects circular references and unresolved tokens
4. Generates `src/css/tokens.css` with:
   - Dark theme tokens in `:root` and `[data-kh-theme="dark"]`
   - Light theme tokens in `[data-kh-theme="light"]` and system mode when `prefers-color-scheme: light`

### Output Example

The generated `tokens.css` contains:

```css
:root {
  color-scheme: dark;
  --kh-color-background: #141518;
  --kh-color-accent: #fb923c;
  --kh-color-accent-text: #fb923c;
  /* ... more dark tokens and shared primitives ... */
}

@media (prefers-color-scheme: light) {
  :root[data-kh-theme="system"] {
    color-scheme: light;
    --kh-color-background: #f3f4f0;
    --kh-color-accent: #f45738;
    --kh-color-accent-text: #bf3b2c;
    --kh-color-on-accent: #171a17;
    /* ... more light tokens ... */
  }
}

:root[data-kh-theme="light"] {
  color-scheme: light;
  --kh-color-background: #f3f4f0;
  --kh-color-accent: #f45738;
  --kh-color-accent-text: #bf3b2c;
  /* ... more light tokens ... */
}

:root[data-kh-theme="dark"] {
  color-scheme: dark;
  /* Dark theme tokens */
}
```

### CSS Custom Properties Naming

All public Kihon CSS variables use the `--kh-` prefix:

- Colours: `--kh-color-background`, `--kh-color-text-primary`, etc.
- Spacing: `--kh-space-1`, `--kh-space-4`, etc.
- Radii: `--kh-radius-sm`, `--kh-radius-md`, etc.
- Shadows: `--kh-shadow-md`, `--kh-shadow-lg`, etc.
- Motion: `--kh-motion-fast`, `--kh-motion-normal`, `--kh-motion-slow`, `--kh-motion-loading`, etc.
- Typography: `--kh-type-font-stack`, `--kh-type-size-*`, etc.

This prefix ensures tokens don't collide with application-specific variables.

## Validation

```bash
npm run validate
```

This runs `scripts/validate-tokens.js`, which checks:

- DTCG 2025.10 JSON Schema and typed dimensions, durations, colors, and shadows
- Required semantic colors in both themes
- Alias resolution, including missing and cyclic references
- Approved text and non-text contrast pairings in light and dark themes

`npm run sanity` parses the style-guide HTML with `html-validate` and all committed CSS with PostCSS. `npm run check:generated` compares generated CSS in memory with `src/css/tokens.css`; it does not rebuild first. `npm test` runs these checks, Node unit tests, and Playwright browser checks.

Run this before committing token changes.

## Base CSS

`src/css/base.css` provides:

- System-font defaults
- Typography (headings, body, code)
- Opt-in `.kh-input`, `.kh-textarea`, `.kh-select`, `.kh-checkbox`, `.kh-radio`, and `.kh-label` styles
- Focus and keyboard navigation
- Accessibility features (reduced motion, forced colours)
- Layout utility classes and the application-shell component

`base.css` imports generated `tokens.css`, followed by button, form, grouped-settings, dialog, app-shell, sidebar, page-header, toolbar, card, and badge components. Component rules stay in their own files, while `base.css` remains the public entry point. Styling is opt-in through documented classes; unclassed controls retain browser styling, selects retain native appearance, and the root font size remains the browser's default. Do not edit token values in `base.css`; regenerate CSS from the token source instead.

Button classes, tokens, markup, state responsibilities and accessibility guidance are documented in [`components/buttons.md`](components/buttons.md). Sidebar CSS and optional controller behavior are documented in [`components/sidebar.md`](components/sidebar.md). Page-header and toolbar CSS contracts are documented in [`components/page-header.md`](components/page-header.md) and [`components/toolbar.md`](components/toolbar.md). Consuming applications do not need style-guide CSS or JavaScript.

## Style Guide

The static style guide lives in `style-guide/` and demonstrates:

- Typography hierarchy
- Colour palette and contrast
- Spacing and radii scales
- Button variants, sizes and interaction states
- Form states
- Keyboard navigation
- Theme switching
- Application preview examples
- Application-shell region combinations and narrow-width stacking
- Page headers and toolbar groups with native buttons and form controls

### Preview the Style Guide

Run `npm run dev` to build and serve the guide at `http://127.0.0.1:4173/style-guide/`. Button examples include style-guide-only action and loading demonstrations; their script is not a production API. Automated browser coverage currently runs Chromium only. It does not replace the manual browser, assistive-technology, zoom, or forced-colors review in `tests/MANUAL_TESTING.md`.

The style guide includes:

- **Theme switcher**: Choose system, light, or dark appearance
- **Live examples**: See tokens and components in both themes
- **Breakpoint indicator**: Debug responsive behaviour
- **Accessibility checklist**: Reduced motion, zoom, forced colours

### Theme Switching

The framework-free theme switcher is an internal style-guide script. Its buttons use `data-kh-theme-toggle`; it does not expose a public constructor API. The selected mode is reflected by `aria-pressed`. System mode leaves `data-kh-theme` unset so CSS follows the operating system; explicit light and dark modes set that attribute.

```html
<button type="button" data-kh-theme-toggle="system">System</button>
<button type="button" data-kh-theme-toggle="light">Light</button>
<button type="button" data-kh-theme-toggle="dark">Dark</button>
```

Explicit preferences are stored under `kihon-theme` when browser storage is available. A storage failure does not prevent changing the theme for the current page.

## Development Workflow

### Making Changes

1. **Modify token values**: Edit `tokens/primitives.json` or theme files
2. **Rebuild CSS**: `npm run build`
3. **Validate**: `npm run validate`
4. **Preview**: Run `npm run dev` and open `http://127.0.0.1:4173/style-guide/`

### Adding New Tokens

1. Add the primitive value to `tokens/primitives.json`:
   ```json
   {
     "spacing": {
      "16": { "$type": "dimension", "$value": { "value": 64, "unit": "px" } }
     }
   }
   ```

2. Add semantic aliases to `tokens/semantic.json`:
   ```json
   {
     "space": {
       "16": { "$type": "dimension", "$value": "{spacing.16}" }
     }
   }
   ```

3. Rebuild: `npm run build`
4. Use in CSS: `var(--kh-space-16)`

### Changing Colour Values

1. Add or update primitive values in `tokens/primitives.json` when a new palette colour is needed.
2. Assign semantic roles in the affected file under `tokens/themes/`. Change dark values only when the design calls for a dark-theme change.
3. Rebuild: `npm run build`
4. Check text and control-boundary contrast in every affected theme and state.
5. Review the style guide in light, dark, and system appearance.

## Testing

### Automated Checks

```bash
npm run test
```

Runs unit, token schema/value, contrast, HTML/CSS parsing, generated-file consistency, and Chromium browser checks. CI also runs strict TypeScript checking. App-shell, sidebar, page-header, and toolbar checks measure region geometry at 320, 480, 768, 1024, and 1280 CSS px; they include constrained-parent compact layouts, wrapping, focus, no-script fallback, and sidebar collapse. The automation does not run the manual verification checklist.

### Manual Verification Checklist

- [ ] **Keyboard navigation**: Tab through all interactive examples
- [ ] **Screen reader**: Test headings, labels, and focus on one desktop browser
- [ ] **Zoom and text resize**: Test at 200% zoom and large text settings
- [ ] **Reduced motion**: Enable and verify animations are minimal
- [ ] **Forced colours**: Enable high-contrast mode and verify visibility
- [ ] **Multiple browsers**: Test in Safari, Chrome, Firefox, Edge (latest stable versions)
- [ ] **Dark theme**: Check all colours are readable in dark mode
- [ ] **Light theme**: Check all colours are readable in light mode
- [ ] **Narrow viewport**: Test at 320 CSS px wide and verify reflow

### Colour Contrast Verification

Kihon targets WCAG 2.2 AA compliance:

- Normal text: **4.5:1** minimum contrast ratio
- Large text (18px+ or 14px+ bold): **3:1** minimum
- Graphical elements and control boundaries: **3:1** minimum

Use an online tool like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or a browser extension to verify.

Critical pairs to test:

| Foreground | Background | Min Ratio | Theme |
| --- | --- | --- | --- |
| text-primary | background | 4.5:1 | light & dark |
| text-primary | surface | 4.5:1 | light & dark |
| text-secondary | background and surface | 4.5:1 | light & dark |
| on-accent | accent | 4.5:1 | light & dark |
| on-accent | button-primary-hover | 4.5:1 | light & dark |
| accent-text | background and surface | 4.5:1 | light & dark |
| accent and button-primary-hover | background and surface | 3:1 | light & dark |
| focus-ring | background | 3:1 | light & dark |

## Public vs. Internal Interfaces

### Public (Stable, Documented)

Consumers of Kihon can rely on these:

- CSS custom properties with `--kh-` prefix
- CSS classes with `kh-` prefix (e.g., `.kh-container`, `.kh-surface`)
- The `data-kh-theme` attribute on `<html>`
- Semantic token names in documentation

### Internal (Subject to Change)

Do not rely on these in consuming applications:

- Private CSS class names (not prefixed with `kh-`)
- Undocumented token aliases
- Intermediate build outputs
- Implementation-specific selectors

## Extending the Token System

### Adding Brand Colours

A consuming application can add its own tokens without modifying Kihon:

```css
:root {
  --kh-color-background: var(--kh-color-background); /* Use Kihon base */
  --app-brand-primary: #custom-color;                 /* App-specific */
}
```

Keep Kihon's semantic tokens unchanged to preserve accessibility defaults.

### Overriding Token Values

Applications MAY override semantic tokens if they maintain contrast and accessibility:

```css
:root {
  --kh-color-accent: #custom-accent;
  --kh-color-on-accent: #custom-text;
  /* But test contrast: must pass 4.5:1 for normal text */
}
```

Colour-only overrides without testing WCAG requirements will break accessibility.

## Continuous Integration

The CI workflow runs `npm ci` with Node.js 26, builds the token and runtime
outputs, runs strict type checking, installs Playwright Chromium, and runs
`npm test`. The generated-file check compares expected output without rebuilding
committed files first, so stale CSS, JavaScript, source maps, or declarations
fail CI.

## Troubleshooting

### "Circular reference detected"

Token aliases form a loop. Example:

```json
{
  "a": { "$value": "{b}" },
  "b": { "$value": "{a}" }
}
```

**Fix**: Break the cycle by assigning a literal value to one token.

### "Unresolved reference: ..."

A token references a path that doesn't exist. Example:

```json
{
  "accent": { "$value": "{colors.primary}" }  // colors.primary doesn't exist
}
```

**Fix**: Use the correct path (e.g., `{colors.blue.700}`).

### CSS generation produces no output

**Check**:
- `npm run build` ran without errors?
- `src/css/tokens.css` exists?
- Base CSS imports `tokens.css` with `@import url('./tokens.css')`?

### Colours not changing when theme switches

**Check**:
- Applied the `data-kh-theme` attribute to `<html>`?
- Browser DevTools shows the correct CSS variables?
- CSS selectors for theme override are specific enough?
- No hard-coded colour values in component CSS?

## Further Reading

- [Design Tokens Community Group — 2025.10](https://www.designtokens.org/TR/2025.10/)
- [WCAG 2.2 Colour Contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [MDN CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

---

**Status**: Kihon remains provisional. Phase 4A adds internal package archives; it does not publish a stable release or configure registry distribution.
