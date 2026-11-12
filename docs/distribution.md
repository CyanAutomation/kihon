# Internal package distribution

Kihon is an internal CyanAutomation foundation. It is not an open-source product, a public npm package, or an externally supported library. The repository keeps `private: true` and `license: "UNLICENSED"`; Phase 4A does not publish archives, change repository access, or configure release automation.

## Identity and provisional version

- Package: `@cyanautomation/kihon`
- Current version: `1.0.0-draft.2`
- License metadata: `UNLICENSED`
- Registry publication: disabled

The scoped name expresses package ownership and is not a registry reservation or publication. The version is a valid semantic-version prerelease, not a stable v1.0 release. Before v1.0, breaking API and token changes are permitted; document each change and migration. Consumer repositories should pin an explicit version or immutable archive instead of following moving source. Kihon maintainers own source, builds, package tests, and compatibility notes; each consumer team owns adoption, review, and intentional upgrades.

## Public package entry points

The public API is intentionally limited to:

| Export | ESM | CommonJS | TypeScript |
| --- | --- | --- | --- |
| `@cyanautomation/kihon/dialogs` | `dist/esm/dialogs.mjs` | `dist/cjs/dialogs.cjs` | `dist/types/dialogs.d.mts` / `dist/types/dialogs.d.cts` |
| `@cyanautomation/kihon/sidebar` | `dist/esm/sidebar.mjs` | `dist/cjs/sidebar.cjs` | `dist/types/sidebar.d.mts` / `dist/types/sidebar.d.cts` |
| `@cyanautomation/kihon/styles.css` | `dist/styles.css` | `dist/styles.css` | — |
| `@cyanautomation/kihon/styles.compat.css` | `dist/styles.compat.css` | `dist/styles.compat.css` | — |
| `@cyanautomation/kihon/browser/dialogs.js` | `dist/browser/dialogs.global.js` | `dist/browser/dialogs.global.js` | — |
| `@cyanautomation/kihon/browser/sidebar.js` | `dist/browser/sidebar.global.js` | `dist/browser/sidebar.global.js` | — |

There is no root JavaScript export. `exports` blocks access to source files, scripts, style-guide files, test fixtures, and unlisted distribution paths. The package has no runtime dependencies. TypeScript and esbuild are used only while building and testing Kihon.

ESM consumers can import the typed helpers:

```typescript
import { openDialog, type DialogOpenOptions } from "@cyanautomation/kihon/dialogs";
import { createSidebarController, type SidebarOptions } from "@cyanautomation/kihon/sidebar";
```

CommonJS consumers can use `require()`:

```javascript
const { openDialog } = require("@cyanautomation/kihon/dialogs");
const { createSidebarController } = require("@cyanautomation/kihon/sidebar");
```

The package includes separate `.d.mts` and `.d.cts` files so NodeNext TypeScript resolves declarations according to the ESM or CommonJS branch. The public declarations are generated from `src/ts/` and do not refer to Kihon source paths. Consumer checks cover strict NodeNext and bundler module resolution, named imports, exported interface types, CommonJS imports, and invalid calls that must fail compilation.

ESM and CommonJS builds each hold their own module-local dialog and sidebar controller state. Do not mix both module formats for the same helper within one application if that application expects a single shared controller registry.

## CSS and browser-global helpers

`dist/styles.css` is a self-contained stylesheet. esbuild resolves the import graph from `src/css/base.css`, preserving its order: generated tokens, buttons, forms, grouped settings, dialogs, application shell, sidebar, page header, and toolbar. It includes light, dark, and system token themes plus the existing forced-colours and reduced-motion rules. It is not minified and contains no imports from the repository source tree.

`dist/styles.compat.css` is generated from the same bundled CSS for browsers
that do not support cascade layers. The build removes only `@layer` statements
and wrappers, retaining the declarations and source order. It does not add
separate component implementations. Prefer `styles.css` for supported modern
browsers; use the compatibility export only when the application supports an
older engine without cascade layers.

In a consumer build-tool stylesheet that resolves npm package exports:

```css
@import "@cyanautomation/kihon/styles.css";
```

For an older browser target, import the compatibility export instead:

```css
@import "@cyanautomation/kihon/styles.compat.css";
```

These bare package specifiers are for a bundler or CSS resolver. Native browser
`<link>` and `@import` loaders do not resolve npm names. When a consumer does
not use a resolver, serve the chosen stylesheet from
`node_modules/@cyanautomation/kihon/dist/` at an application-owned asset URL.
Kihon CSS works without JavaScript; applications still own their page markup,
token overrides, and theme selector.

The package also includes optional classic-script helpers that preserve `window.KihonDialogs` and `window.KihonSidebar`. Serve or copy the corresponding `dist/browser/*.global.js` file and load it as a normal script. These bundles are separate from the ESM outputs. They do not add JavaScript requirements to the stylesheet.

## Build and local archive installation

Use Node.js 26 or later and npm to reproduce the package:

```bash
npm ci
npm run build
npm run typecheck
npm test
npm run test:package
npm pack --dry-run --json
```

`dist/` is generated and ignored by Git. `npm pack` runs the `prepack` script, which rebuilds tokens, legacy outputs, and all package files before creating the archive. `files: ["dist/"]` restricts the package to consumer artifacts; npm also includes the package metadata and README. No source maps, build scripts, tests, screenshots, local configuration, or credentials are included. `npm run test:package` inspects the real archive, verifies every export target, installs it offline in a temporary consumer, and exercises its public interfaces without resolving back to the Kihon checkout.

For an internal consumer, generate an archive outside the source tree and provide it through an approved CyanAutomation-controlled channel:

```bash
npm pack --pack-destination ../artifacts
```

Install that exact archive in the consumer and commit an explicit dependency pin according to the consumer's artifact-handling practice:

```bash
npm install --save-exact /approved/internal/path/cyanautomation-kihon-1.0.0-draft.2.tgz
```

Do not upload the archive to a public location. CI targets Node.js 26 for the local package contract, which covers native ESM and CommonJS, TypeScript NodeNext and bundler resolution, and Chromium. Browser compatibility certification across engines is not part of Phase 4A.

## Distribution options

| Method | Advantages | Limitations and status |
| --- | --- | --- |
| Local `.tgz` archive | Reproducible, credential-free installation; the exact archive can be inspected and tested before adoption. | **Supported for Phase 4A.** A controlled internal process must deliver and retain the archive. |
| Git dependency pinned to a commit | No registry required; a commit can identify immutable source. | **Not currently supported.** `dist/` is ignored and is built by `prepack`; Git dependency lifecycle behavior has not been made or validated as a package build contract. Do not rely on it until its lifecycle is explicitly implemented and tested. |
| Private GitHub Packages | Versioned package retrieval, organization-level access controls, and integration with GitHub workflows. | Future option only. It requires an agreed package visibility/access model, authenticated consumer reads, release ownership, and workflow permissions. It needs separate approval and implementation. |

For a future GitHub Packages decision, review the current [GitHub npm registry guidance](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry). At a high level, administrators must grant the right repositories or teams access to the private package; consumer automation needs package-read permission, while publishing would require separate write permission. Do not place tokens in `.npmrc`, source control, or this repository. Phase 4A adds no registry credentials, publish configuration, release workflow, GitHub release, or package upload.

## Consumer responsibilities and limitations

- Import only the public exports listed above; do not depend on internal source or build paths.
- Keep native HTML semantics and application-owned validation, routing, permissions, and page state.
- Use a CSS resolver for the package import form, or serve the packaged CSS through an application-owned URL.
- Use either the ESM or CommonJS helper branch consistently for a given application.
- Test application-specific token overrides, theme behavior, interactions, and accessibility in the consuming context. Kihon's automated checks are not a complete WCAG audit or browser certification.
- Pin prerelease archives and update them intentionally. Consumer owners are responsible for reviewing change notes and adopting breaking changes.

No npm registry install, Git dependency, or public release is available in Phase 4A. A future private registry may improve artifact distribution, but publishing, package access controls, and release automation remain separate decisions.
