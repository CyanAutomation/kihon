# Kihon Development Guide

This document explains how Kihon's design tokens, CSS and style guide are organized and built.

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
│       └── base.css             # Foundation styles and resets
├── style-guide/                 # Static documentation site
│   ├── index.html               # Main style guide page
│   ├── styles.css               # Style guide-specific styles
│   └── theme.js                 # Theme switcher component
├── scripts/
│   ├── build-tokens.js          # Generates tokens.css from source
│   └── validate-tokens.js       # Validates token correctness
├── tests/                       # Test fixtures and checks
├── docs/
│   ├── foundation.md            # Normative specification
│   └── development.md           # This file
└── package.json                 # Build configuration
```

## Design Tokens

### Token Source Structure

Kihon uses the [Design Tokens Community Group Format 2025.10](https://www.designtokens.org/TR/2025.10/) for platform-neutral token definitions.

Each token file is a JSON object with typed `$value` entries:

```json
{
  "colors": {
    "gray": {
      "100": {
        "$type": "color",
        "$value": "#f5f5f7"
      }
    }
  }
}
```

### Primitive vs. Semantic Tokens

**Primitives** (`tokens/primitives.json`) define base values:
- Colour palette (gray, blue, red)
- Spacing scale (0, 4, 8, 12, 16, 24, 32, 48 px)
- Typography (sizes, weights, fonts)
- Shadows and radii

**Semantics** (`tokens/semantic.json`) define purpose-based aliases:
- `color.text-primary` (what it is) instead of `colors.gray.900` (literal value)
- `space.4` instead of `spacing.16`

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

- Light theme: `color.text-primary` → `#1d1d1f` (dark gray)
- Dark theme: `color.text-primary` → `#f5f5f7` (light gray)

### Token Aliases

Tokens reference other tokens using the `{path.to.token}` syntax:

```json
{
  "color": {
    "text-primary": {
      "$value": "{colors.gray.900}"
    }
  }
}
```

The build process recursively resolves aliases into final values for CSS output.

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
   - Light theme tokens in `:root`
   - Dark theme tokens in `@media (prefers-color-scheme: dark)` and `[data-kh-theme="dark"]`
   - System-preference-aware defaults

### Output Example

The generated `tokens.css` contains:

```css
:root {
  color-scheme: light;
  --kh-color-background: #f5f5f7;
  --kh-color-surface: #ffffff;
  --kh-color-text-primary: #1d1d1f;
  --kh-color-accent: #175cd3;
  /* ... more tokens ... */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-kh-theme]) {
    color-scheme: dark;
    --kh-color-background: #141518;
    --kh-color-surface: #1f2024;
    --kh-color-text-primary: #f5f5f7;
    --kh-color-accent: #85b4ff;
  }
}

:root[data-kh-theme="light"] {
  color-scheme: light;
  /* Light theme tokens */
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
- Motion: `--kh-motion-fast`, `--kh-motion-normal`, etc.
- Typography: `--kh-type-font-stack`, `--kh-type-size-*`, etc.

This prefix ensures tokens don't collide with application-specific variables.

## Validation

```bash
npm run validate
```

This runs `scripts/validate-tokens.js`, which checks:

- ✓ Token source files exist and are valid JSON
- ✓ Required semantic tokens are present in all themes
- ✓ CSS generation produces valid output
- ✓ Light and dark themes have matching token counts
- ✓ Theme selectors and media queries are present

Run this before committing token changes.

## Base CSS

`src/css/base.css` provides:

- System-font defaults
- Typography (headings, body, code)
- Form element styling
- Button base styles
- Focus and keyboard navigation
- Accessibility features (reduced motion, forced colours)
- Layout utility classes

Base CSS imports the generated `tokens.css` to use custom properties. Do not edit token values in `base.css`; regenerate CSS from the token source instead.

## Style Guide

The static style guide lives in `style-guide/` and demonstrates:

- Typography hierarchy
- Colour palette and contrast
- Spacing and radii scales
- Button and form states
- Keyboard navigation
- Theme switching
- Application preview examples

### Preview the Style Guide

Once the build is complete, open `style-guide/index.html` in a browser to view the interactive documentation.

The style guide includes:

- **Theme switcher**: Choose system, light, or dark appearance
- **Live examples**: See tokens and components in both themes
- **Breakpoint indicator**: Debug responsive behaviour
- **Accessibility checklist**: Reduced motion, zoom, forced colours

### Theme Switching

The theme switcher is implemented in `style-guide/theme.js` using a framework-free `KihonThemeSwitcher` class:

```javascript
// Auto-initializes when DOM is ready
window.KihonThemeSwitcher = new KihonThemeSwitcher({
  storageKey: 'kihon-theme'  // localStorage key for persistence
});

// Programmatic usage
KihonThemeSwitcher.setTheme('dark');
```

It stores the user's preference in localStorage and applies the `data-kh-theme` attribute to `<html>`.

## Development Workflow

### Making Changes

1. **Modify token values**: Edit `tokens/primitives.json` or theme files
2. **Rebuild CSS**: `npm run build`
3. **Validate**: `npm run validate`
4. **Preview**: Open `style-guide/index.html` in a browser

### Adding New Tokens

1. Add the primitive value to `tokens/primitives.json`:
   ```json
   {
     "spacing": {
       "16": { "$type": "dimension", "$value": "64px" }
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

1. Update the light theme in `tokens/themes/light.json`
2. Update the dark theme in `tokens/themes/dark.json`
3. Rebuild: `npm run build`
4. Check contrast with WCAG guidelines
5. Test in the style guide

## Testing

### Automated Checks

```bash
npm run test
```

Runs build, validation and basic correctness checks.

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
| text-secondary | surface | 3:1 | light & dark |
| on-accent | accent | 4.5:1 | light & dark |
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

The CI pipeline should:

1. Run `npm install`
2. Run `npm run build`
3. Run `npm run validate`
4. Fail if tokens.css differs from the expected output (detects stale builds)
5. Optionally run accessibility or visual regression checks

Example `.github/workflows/ci.yml`:

```yaml
- name: Build tokens
  run: npm run build

- name: Validate tokens
  run: npm run validate

- name: Check for stale CSS
  run: |
    npm run build
    git diff --exit-code src/css/tokens.css || \
      (echo "Stale generated CSS. Run: npm run build" && exit 1)
```

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

**Status**: Kihon v1.0 is in development. This guide reflects the Phase 1 implementation scope.
