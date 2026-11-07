---
name: kihon-component-authoring
description: Create or change a public Kihon UI component, including its CSS or behavior, accessibility contract, examples, documentation, and checks.
---

# Kihon component authoring

Use this skill when authoring a reusable component in Kihon. For an accessibility-only review of existing work, use the accessibility review skill.

## Workflow

1. Read the relevant component contract in [`docs/foundation.md`](../../../docs/foundation.md), the current public API guidance in [`docs/components/buttons.md`](../../../docs/components/buttons.md), and the development/testing sections of [`docs/development.md`](../../../docs/development.md). Treat the specification as the design source of truth and verify which roadmap items are implemented before relying on them.
2. Define the component's purpose, semantic HTML, public classes/tokens, states, responsive behavior, and accessibility expectations before implementation. Keep the public API small, prefix public CSS names with `kh-`, use documented semantic tokens, and keep internal selectors out of consumer guidance.
3. Prefer native HTML and CSS. Add JavaScript only when browser behavior cannot meet the contract; preserve a useful fallback and document any behavior that requires scripting.
4. For interactive behavior, write or update a focused failing unit or Playwright test first, then implement until it passes. For presentational-only changes, avoid artificial behavior tests; update the style-guide example and use the existing HTML/CSS parsing and visual/manual checks that fit the change.
5. Implement the component, wire its stylesheet through the documented CSS entry point when appropriate, and add a focused page under `docs/components/`. Update the style guide with representative variants and states so it can serve as a usable example and test fixture.
6. Run the applicable unit/browser checks and `npm test`. Review both themes, keyboard operation, focus, reduced motion, forced colours, zoom/reflow, and narrow viewports when relevant. Record manual checks separately from automated results.
7. Review the diff for accidental API expansion, hard-coded colors, unsupported conformance claims, and documentation that promises behavior the implementation does not provide. Summarize the public API, evidence, and remaining manual checks.

Do not introduce package exports, runtime dependencies, framework requirements, or application behavior beyond Kihon's documented scope. See [`tests/README.md`](../../../tests/README.md) for what the automated suite does and does not establish.
