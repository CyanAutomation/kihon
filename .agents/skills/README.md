# Repository skills

Kihon's agent skills live in `.agents/skills/`. The `.github/` directory contains GitHub workflows and repository automation, not these skill files.

Choose the narrowest skill for the task, then combine it with another only when the work crosses that skill's boundary.

| Skill | Use it for |
| --- | --- |
| [Fallow](fallow/SKILL.md) | Dead-code, duplication, health, architecture, change-risk, and TypeScript semantic analysis. |
| [Fallow setup](fallow-setup/SKILL.md) | Installing or configuring repository code-health tooling and agent guidance. |
| [Accessibility review](kihon-accessibility-review/SKILL.md) | Evidence-based accessibility reviews of changed components and examples. |
| [Component authoring](kihon-component-authoring/SKILL.md) | Public component CSS, behavior, contract, examples, and documentation. |
| [Token workflow](kihon-token-workflow/SKILL.md) | DTCG token and theme changes, generated CSS, and contrast validation. |
| [Runtime authoring](kihon-runtime-authoring/SKILL.md) | Reusable TypeScript behavior, generated compatibility outputs, and runtime exports. |
| [Package compatibility](kihon-package-compatibility/SKILL.md) | Package metadata, exports, archive contents, compatibility, and release preparation. |
| [Platform experience](kihon-platform-experience/SKILL.md) | Kihon's adaptive web experience specifications, examples, roadmap patterns, and validation. |
| [Style-guide authoring](kihon-style-guide-authoring/SKILL.md) | Style-guide pages and demonstrations that do not define a new public component API. |
| [Consumer adoption](kihon-consumer-adoption/SKILL.md) | Planning, reviewing, or implementing Kihon adoption in a consuming application. |
| [CI and build maintenance](kihon-ci-build-maintenance/SKILL.md) | GitHub Actions, repository scripts, generated artifacts, and build or validation tooling. |
| [Modern Web Guidance](modern-web-guidance/SKILL.md) | Current web-platform guidance for HTML, CSS, and client-side JavaScript implementation work. |

## Combining skills

- For an interactive public component, use component authoring and runtime authoring when reusable TypeScript behavior is involved. Add the token workflow if token definitions change.
- For platform-experience implementation, use platform experience plus component, runtime, or token authoring as the implementation requires. Use accessibility review when the task is an independent review rather than authoring.
- For style-guide-only changes, use style-guide authoring. Add platform experience for work in `docs/experience/` or `style-guide/experience/`.
- For a consuming application's integration, use consumer adoption. Add package compatibility when the Kihon archive or export contract also changes.
- For web UI code, consult Modern Web Guidance as its instructions require. It does not replace Kihon's API, architecture, or compatibility contracts; it does not apply to CI, build scripts, or documentation-only edits.

The skills are working guidance, not proof that a check passed. Inspect the current implementation and repository contracts, and report automated results separately from manual or untested items.
