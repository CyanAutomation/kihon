---
name: kihon-runtime-authoring
description: Add or change reusable TypeScript behavior in Kihon, including generated browser and package outputs, typed APIs, and consumer checks.
---

# Kihon runtime authoring

Use this skill for reusable behavior authored in `src/ts/`, changes to its generated compatibility outputs, or changes to runtime package entry points. For CSS-only work, use the component-authoring or token workflow instead.

## Workflow

1. Read [`docs/development.md`](../../../docs/development.md), the relevant component contract under `docs/components/`, [`docs/distribution.md`](../../../docs/distribution.md), and [`tests/README.md`](../../../tests/README.md). Confirm that the behavior is in Kihon's scope and identify a concrete consumer use case before adding reusable runtime behavior.
2. Define the public contract before implementation: semantic markup expected from consumers, API shape, lifecycle and cleanup, error behavior, keyboard/focus behavior, progressive-enhancement fallback, and supported module/browser environments. Prefer native HTML and CSS when they meet the use case.
3. Add or update a focused failing unit or Playwright test for the behavior first. Cover relevant failure paths, repeated initialization or disposal, and browser interactions. Keep application-owned routing, data, and state out of the reusable helper.
4. Implement the TypeScript source in `src/ts/`. Keep the typed API small and avoid runtime dependencies. Add a package export only when the user-facing contract calls for one; document it in `docs/distribution.md` and preserve the ESM, CommonJS, declaration, and browser-global contracts that apply.
5. Regenerate committed compatibility outputs with `npm run build:runtime`, and build package artifacts with `npm run build`. Do not hand-edit generated `src/js/` or `dist/` files.
6. Run focused unit/browser checks, `npm run typecheck`, `npm test`, and `npm run test:package` as applicable. Package export changes require archive consumer coverage through `npm run test:package`. Review generated output and ensure no unintended package files or runtime dependencies were added.
7. Review keyboard operation, focus handling/restoration, no-script behavior, and relevant browser support. Record physical-device or assistive-technology checks separately from automated results.
8. Summarize the behavior and API, source and generated files changed, checks performed, and remaining manual checks.

Do not treat Playwright WebKit as physical Safari validation. Follow the evidence limits in [`tests/README.md`](../../../tests/README.md), and do not claim that helper-level tests establish accessibility conformance of consuming applications.
