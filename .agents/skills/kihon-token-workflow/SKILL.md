---
name: kihon-token-workflow
description: Add or change Kihon design tokens and theme values while preserving the DTCG source, generated CSS, public naming, and contrast checks.
---

# Kihon token workflow

Use this skill for token additions or changes in `tokens/` and their generated CSS. For ordinary component styling that does not change tokens, use the component workflow or the repository's development guide.

## Workflow

1. Read the relevant sections of [`docs/development.md`](../../../docs/development.md) and [`docs/foundation.md`](../../../docs/foundation.md). Inspect neighboring tokens and the CSS that consumes them before choosing a change.
2. Keep `tokens/` as the source of truth. Put reusable raw values in primitives, purpose-based names in semantic tokens, and appearance-specific assignments in the appropriate theme files. Preserve DTCG types and alias conventions; avoid copying literal values where an alias expresses the intent.
3. For color changes, check both light and dark theme mappings and the approved foreground/background pairs in `scripts/contrast.js`. Add a pairing only when it represents a real public use; do not remove or weaken an existing check to make validation pass.
4. Regenerate committed CSS with `npm run build`. Do not edit `src/css/tokens.css` by hand.
5. Run `npm run validate` and `npm test`. Review the complete diff, including generated CSS, and confirm only intended public tokens and values changed.
6. Report the source token paths changed, generated output, validation results, and any visual or manual checks still needed.

Automated contrast checks cover selected pairings; they do not prove that every use in a consuming interface meets WCAG. Follow the limitations in [`tests/README.md`](../../../tests/README.md) when describing evidence.
