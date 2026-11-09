# Kihon verification

Run the automated checks with:

```bash
npm ci
npm run build
npm run typecheck
npm test
npm run test:package
```

The suite runs:

1. Node unit tests for alias resolution, typed token validation, contrast calculations, dialog-helper cleanup with synchronous and asynchronous close events, stale `returnValue` resets, sidebar-controller state, focus restoration, transactional initialization rollback and disposal, and parsed button, form, grouped-settings, dialog, app-shell, sidebar, page-header, and toolbar CSS contracts.
2. Strict type-checking in CI for both TypeScript helpers and consumer fixtures that import their generated declarations.
3. DTCG 2025.10 schema and value validation, including required theme tokens and approved contrast pairings.
4. `html-validate` for the style-guide HTML and PostCSS parsing for committed stylesheets.
5. A generated CSS, JavaScript, source-map, and declaration consistency check for both helpers, plus reproducible package output checks against the ignored `dist/` build.
6. Playwright checks in Chromium for theme behaviour, button variants and states, native form labels and interactions, validation relationships, settings rows, app-shell region geometry at 320, 480, 768, 1024, and 1280 CSS px, sidebar semantics and grouping, collapse/reveal, hidden-link focus, focus restoration, constrained-parent compact layouts, page-header and toolbar wrapping, native keyboard order, focus visibility, long labels at 200% text size, no-JavaScript layout, modal dialog naming and descriptions, native focus containment and restoration, cancellation, preference validation, destructive confirmation, and in-page links.
7. `npm run test:package` runs `npm pack` locally, compares the actual archive contents with the public export map, installs the archive offline in an isolated temporary consumer, and checks ESM, CommonJS, strict NodeNext and bundler TypeScript, package path encapsulation, and a Chromium browser fixture using the packaged CSS and browser-global helpers.

`npm run build` regenerates `src/css/tokens.css`, the committed dialog and sidebar compatibility outputs, and the ignored `dist/` package outputs. `npm run check:generated` compares these results without rewriting them, so run it separately before rebuilding to identify stale artifacts. Run `npm run typecheck` for strict source TypeScript checking; CI runs it before the suite.

The new presentational component contract and geometry checks are in `tests/browser/toolbars-and-page-headers.spec.js`; existing sidebar and dialog specs continue to cover their separate interactions. When a system Chromium binary is available but Playwright's managed browser cannot be downloaded, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path for local browser and package tests. CI continues to use the Chromium version installed by its workflow.

## What the automated checks do not establish

The automated suite is not a complete WCAG audit. It measures only the approved foreground/background combinations listed in `scripts/contrast.js`, and its browser tests run in Chromium. It does not establish screen-reader support, complete keyboard usability, Safari/Firefox/Edge compatibility, actual browser zoom behavior, mobile touch behavior, forced-colors usability across platforms, or conformance of consuming applications.

Use [MANUAL_TESTING.md](MANUAL_TESTING.md) to record those checks before a release. The checklist is guidance; unchecked items have not been verified.

## Contrast thresholds

The automated list applies 4.5:1 to text pairings, including primary-button hover text and quiet-button labels, and 3:1 to focus indicators and control boundaries. Review each actual use in a consuming interface, especially when opacity or imagery affects the rendered result.
