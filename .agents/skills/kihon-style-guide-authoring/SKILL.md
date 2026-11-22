---
name: kihon-style-guide-authoring
description: Create or maintain Kihon's static style guide, examples, and local demonstrations without accidentally expanding the public package API.
---

# Kihon style-guide authoring

Use this skill for style-guide pages, CSS, and local demonstrations when the task does not itself add or change a public Kihon component. For a public component, also use component authoring; for `style-guide/experience/`, also use platform experience.

## Workflow

1. Read the relevant sections of [`docs/development.md`](../../../docs/development.md), [`docs/foundation.md`](../../../docs/foundation.md), and any component contract represented by the page. Confirm whether the requested behavior is a guide-only example or a proposed/public Kihon API.
2. Keep the guide static and framework-free. Use semantic HTML, the documented Kihon classes and tokens, and clearly identify application-owned or demonstration-only behavior. Do not turn guide scripts or selectors into package exports without a separately documented consumer need.
3. Edit maintained files under `style-guide/` and its source TypeScript/CSS. Generate browser scripts with `npm run build:style-guide`; do not hand-edit ignored files under `style-guide/generated/` or package outputs under `dist/`.
4. For interactive examples, define the expected native behavior and fallback, then add or update focused coverage before implementation. Avoid artificial behavior tests for presentational-only edits; use the existing HTML/CSS checks and relevant browser examples instead.
5. Validate applicable changes with `npm run sanity`, `npm run typecheck` when TypeScript changes, and relevant Playwright checks or `npm test`. Review light/dark themes, narrow layouts, enlarged text, keyboard/focus behavior, reduced motion, forced colours, and no-JavaScript behavior where applicable. Keep manual observations distinct from automation.
6. Review the diff to confirm no generated files, public exports, runtime dependencies, or claims of conformance were added unintentionally. Summarize pages/examples changed, build/check evidence, and remaining manual review.

The guide is documentation and a test fixture; it is not a production application or a substitute for testing a consuming app.
