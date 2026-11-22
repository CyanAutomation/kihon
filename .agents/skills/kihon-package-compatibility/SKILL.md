---
name: kihon-package-compatibility
description: Prepare or review Kihon package export, compatibility, archive, and release changes while preserving the documented distribution contract.
---

# Kihon package compatibility and release preparation

Use this skill when changing package exports, build outputs, package metadata, archive contents, compatibility promises, version notes, or release preparation. It covers preparation and validation; publishing or changing package visibility is a separate external action.

## Workflow

1. Read [`docs/distribution.md`](../../../docs/distribution.md), the package and build sections in [`docs/development.md`](../../../docs/development.md), [`tests/README.md`](../../../tests/README.md), and `package.json`. Confirm the current package status and supported distribution route before proposing a release change.
2. Preserve the contract currently declared in `package.json` and [`docs/distribution.md`](../../../docs/distribution.md) unless the request explicitly changes it. Those files currently describe a private, `UNLICENSED`, unpublished package distributed through local `.tgz` archives; verify the current version, status, and route from those sources instead of hard-coding them here. If the sources disagree, report the discrepancy. Do not add registry publishing, credentials, public release metadata, or Git dependency support as incidental build work.
3. For a proposed export or compatibility change, state the consumer need, affected import paths and module formats, types, browser support, CSS/runtime behavior, and migration impact. Update the export table, consumer guidance, and compatibility notes together. Do not expose source files or internal build paths accidentally.
4. Write or update a failing package-consumer check first for changes to archive contents or exports. Keep generated `dist/` output disposable; build it from source with `npm run build` rather than editing it directly.
5. Validate with `npm run typecheck`, `npm test`, `npm run test:package`, and `npm pack --dry-run --json` as relevant. Inspect the archive file list, export targets, declarations, ESM/CommonJS behavior, CSS assets, and browser-global outputs. `npm run test:package` should exercise the actual archive in an isolated consumer.
6. For version or release notes, identify whether the change is breaking, state the exact version/archive under consideration, and include migration guidance. Keep internal archive handling on an approved CyanAutomation-controlled channel; do not upload archives to public locations.
7. Summarize the compatibility decision, package artifacts and metadata affected, evidence from consumer checks, and any remaining decisions or manual validation.

Do not publish a package, create a public release, change repository/package visibility, or configure registry access as part of preparation. Those actions require explicit user authorization and a separately agreed access and release model, as described in [`docs/distribution.md`](../../../docs/distribution.md).
