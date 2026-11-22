---
name: kihon-ci-build-maintenance
description: Maintain Kihon's GitHub Actions, repository scripts, generated artifacts, and build or validation tooling with focused regression coverage.
---

# Kihon CI and build maintenance

Use this skill for changes to `.github/workflows/`, `.github/dependabot.yml`, `scripts/`, build-related `package.json` commands, generated-file checks, or CI validation behavior. For package output or export changes, also use package compatibility.

## Workflow

1. Read the relevant workflow or script, [`docs/development.md`](../../../docs/development.md), [`tests/README.md`](../../../tests/README.md), and the corresponding tests. Check current Node and browser requirements, generated-file ownership, and commands in `package.json` before changing them.
2. For a workflow behavior change, first add or update a focused failing test in `tests/unit/ci-workflow.test.ts`. For a build-script or generated-output change, add or update the narrowest relevant unit or generated-file check before implementation.
3. Preserve least-privilege workflow permissions, full commit-SHA pins for Actions, `persist-credentials: false` for checkouts, bounded jobs, cancellation of superseded runs, and the configured browser matrix unless the requested change explicitly revises the contract. Do not add secrets, publishing, or deployment steps incidentally.
4. Keep generated files aligned with their sources. Update scripts and tests rather than hand-editing generated outputs; use `npm run check:generated` and the documented build command to detect or regenerate committed artifacts.
5. Validate with `npm run typecheck` and `npm test` as relevant. Run `npm run test:package` when package artifacts or exports are affected. For workflow edits, preserve the repository's actionlint and zizmor CI checks and review their results; do not treat a local YAML parse as a substitute for those checks.
6. Review the complete diff for permission expansion, mutable action references, credential persistence, unnecessary dependencies, changed output files, and divergence between workflow steps and documented commands. Summarize the behavior changed and checks performed.

Do not weaken a validation gate merely to make a failing change pass. If the supported runtime, browser matrix, or security boundary needs to change, document the reason and update its tests and guidance together.
