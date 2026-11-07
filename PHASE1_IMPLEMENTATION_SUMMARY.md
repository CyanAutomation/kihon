# Kihon Phase 1 — implementation status

**Status:** Draft foundation; Phase 1.1 hardening implementation is present on this branch.
**Updated:** November 7, 2026

Kihon provides a framework-free set of design tokens, base styles, and a static style guide. The repository is not a released v1.0 package, and the automated checks below are evidence for specific behaviours rather than a claim of WCAG conformance.

## Implemented and automatically checked

- DTCG 2025.10 token files are validated against the vendored official JSON Schema and additional type-specific value checks.
- Dimensions, durations, colors, and shadow sub-values use typed DTCG structures.
- Alias resolution rejects unresolved references and direct or indirect cycles.
- Approved text, control, border, and focus color pairings are measured in both themes with `wcag-contrast`.
- Foundation styling for buttons and form controls uses opt-in `.kh-*` classes. Unclassed controls retain browser styling; selects keep their native appearance.
- Theme controls distinguish selected mode from current appearance and handle unavailable browser storage.
- Playwright tests cover theme selection and persistence, system preference changes, storage failure, visible keyboard focus, common viewport widths, and in-page links in Chromium.
- `html-validate` and PostCSS parse the style-guide HTML and CSS. A separate check detects stale generated CSS without rebuilding it first.
- GitHub Actions runs the validation suite on pushes to `main` and pull requests.

## Commands

```bash
npm ci
npm run build       # Regenerate src/css/tokens.css
npm test            # Unit, token, contrast, HTML/CSS, generated-file, and Chromium checks
npm run dev         # Build and serve the style guide at http://127.0.0.1:4173/style-guide/
```

## Verification limits

The automated browser suite currently runs Chromium only. The manual checklist in `tests/MANUAL_TESTING.md` has not been completed by these automated checks; Safari, Firefox, Edge, assistive technology, zoom, forced-colors, and full application workflows still need separate review. Passing token contrast checks does not certify every use of a token or a consuming application against WCAG.

The package remains private and marked `UNLICENSED`. Choose and add a project licence before distribution.
