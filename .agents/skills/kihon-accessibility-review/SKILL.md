---
name: kihon-accessibility-review
description: Review Kihon component or style-guide changes for accessibility issues and report actionable findings with evidence and limits.
---

# Kihon accessibility review

Use this skill when asked to review Kihon changes for accessibility or to prepare an accessibility release check. It produces evidence-based findings; it does not certify a complete consuming application.

## Review workflow

1. Read the applicable requirements in [`docs/foundation.md`](../../../docs/foundation.md), the component contract in `docs/components/` if present, and [`tests/README.md`](../../../tests/README.md). Review the actual changed code and examples; do not infer accessibility from documentation alone.
2. Follow each affected control through its applicable states and interaction paths. Check semantic elements and names, labels and relationships, keyboard operation and focus visibility, disabled/busy/error states, contrast of text and meaningful boundaries, and target sizing.
3. Check the relevant presentation modes: light and dark themes, text resize and zoom/reflow, reduced motion, forced colours, and narrow viewports. Consider no-script or unsupported-feature behavior where the component depends on enhancement code.
4. Run relevant automated checks when available. Separate results that were actually measured from manual checks that remain; automated checks cover selected cases and do not establish screen-reader support or full WCAG conformance. Use [`tests/MANUAL_TESTING.md`](../../../tests/MANUAL_TESTING.md) to identify applicable manual checks, not as evidence that unchecked items passed.
5. Report only actionable findings supported by the code or a reproducible check. For each finding, include severity, file and line, affected user or behavior, and a concrete correction. If no issue is found, state the review scope and checks performed rather than claiming broad conformance.

Kihon's target is WCAG 2.2 AA, while conformance is assessed in complete applications and workflows. Preserve that distinction in review conclusions.
