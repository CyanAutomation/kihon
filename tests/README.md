# Kihon verification

Run the automated checks with:

```bash
npm ci
npm test
```

The suite runs:

1. Node unit tests for alias resolution, typed token validation, contrast calculations, and safe CSS contracts.
2. DTCG 2025.10 schema and value validation, including required theme tokens and approved contrast pairings.
3. `html-validate` for the style-guide HTML and PostCSS parsing for committed stylesheets.
4. A generated CSS consistency check that compares output without rebuilding the committed file first.
5. Playwright checks in Chromium for theme behaviour, persistence and storage failure, keyboard focus, viewport widths, and in-page links.

`npm run build` regenerates `src/css/tokens.css`. It is intentionally not run before the consistency check in `npm test`, so stale committed output fails validation.

## What the automated checks do not establish

The automated suite is not a complete WCAG audit. It measures only the approved foreground/background combinations listed in `scripts/contrast.js`, and its browser tests run in Chromium. It does not establish screen-reader support, full keyboard usability, current Safari/Firefox/Edge compatibility, 400% zoom behaviour, forced-colors usability, or conformance of consuming applications.

Use [MANUAL_TESTING.md](MANUAL_TESTING.md) to record those checks before a release. The checklist is guidance; unchecked items have not been verified.

## Contrast thresholds

The automated list applies 4.5:1 to text pairings and 3:1 to focus indicators, strong borders, and accent fills used as non-text UI. Review each actual use in a consuming interface, especially when opacity or imagery affects the rendered result.
