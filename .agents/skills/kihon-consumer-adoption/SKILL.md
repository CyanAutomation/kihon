---
name: kihon-consumer-adoption
description: Plan, review, or implement Kihon adoption in a consuming application while preserving package constraints, ownership boundaries, and evidence-based validation.
---

# Kihon consumer adoption

Use this skill when a consuming application is adopting Kihon, upgrading its archive, or reviewing an existing integration. For changes to Kihon's package contract, also use package compatibility.

## Workflow

1. Read [`docs/distribution.md`](../../../docs/distribution.md), [`docs/experience/adoption.md`](../../../docs/experience/adoption.md), [`docs/foundation.md`](../../../docs/foundation.md), and the relevant component contracts. Confirm which consumer repository and archive/version are in scope. If the consumer repository is unavailable, prepare an adoption plan from the Kihon contracts and label consumer-specific findings as unchecked.
2. Inspect the consumer's actual dependency declaration, imports, stylesheet loading, markup, theme overrides, and any Kihon-specific behavior before recommending changes. Use the documented package entry points and supported archive route; do not assume Git dependencies, registry installation, source-tree imports, or a particular framework are supported.
3. Map the application's important workflows, supported browser/OS versions, install contexts, and input methods. Separate Kihon-owned tokens, component contracts, and shared behavior from application-owned routing, data, authentication, persistence, deployment, and product decisions.
4. Propose or make an incremental adoption plan that preserves application identity, records deviations and known gaps, and uses stable public tokens and exports. Do not add reusable Kihon runtime behavior for a single consumer need; follow the cross-consumer evidence requirement in `docs/experience/adoption.md`.
5. Validate the consumer's actual flows and supported contexts. Run applicable automated checks, then record keyboard, touch, assistive-technology, zoom, theme, offline, or installed-app checks separately when relevant. A dependency declaration or passing component tests do not establish adoption quality or accessibility conformance.
6. Summarize the archive/version, imports and overrides reviewed, app/Kihon ownership decisions, changes made, automated evidence, manual coverage, exceptions, and remaining gaps. Keep internal archives on an approved CyanAutomation-controlled channel.

Do not upload internal archives publicly, claim support for an untested consumer environment, or describe a package adoption score as proof of accessibility or visual quality.
