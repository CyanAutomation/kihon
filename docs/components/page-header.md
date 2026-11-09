# Page Header

The page header identifies the current view and presents its supporting context and immediate actions. It belongs inside the view's existing main-content region; the application shell remains responsible for page geometry.

Load [`src/css/base.css`](../../src/css/base.css). It imports the page-header stylesheet. The component is opt-in, CSS-only, and does not create a `main` landmark.

## Public CSS API

| Class | Purpose |
| --- | --- |
| `.kh-page-header` | Flexible page title and action region. |
| `.kh-page-header__content` | Title, description, and supporting metadata. |
| `.kh-page-header__title` | Main title for the current view. |
| `.kh-page-header__description` | Optional explanatory text. |
| `.kh-page-header__meta` | Optional supporting metadata. |
| `.kh-page-header__actions` | Optional contextual action group. |

## Recommended structure

Use a native `<header>` and choose its heading level to fit the surrounding document. A top-level view normally uses `h1`; a nested example or subsection may need `h2` or a lower level. The component does not set a level for you.

```html
<main class="kh-app-shell__main">
  <header class="kh-page-header">
    <div class="kh-page-header__content">
      <h1
        class="kh-page-header__title"
        id="projects-title"
        aria-describedby="projects-description"
      >
        Projects
      </h1>
      <p class="kh-page-header__description" id="projects-description">
        Manage your applications and services.
      </p>
      <div class="kh-page-header__meta">
        <span>8 projects</span>
        <span>Updated 4 minutes ago</span>
      </div>
    </div>

    <div class="kh-page-header__actions" role="group" aria-label="Project actions">
      <button class="kh-button kh-button--secondary" type="button">Import</button>
      <button class="kh-button kh-button--primary" type="button">New project</button>
    </div>
  </header>
</main>
```

Associate the description with the title when it adds useful context. Omit `aria-describedby` when there is no description. Keep the header itself unnamed; its heading provides the page context. Use native buttons for actions and links for navigation.

## Responsive behavior

The title content and action group wrap naturally. At narrow widths, actions move below the content and align to the start. Long titles and descriptions wrap instead of being truncated. Buttons retain their own Kihon sizing and are not forced into a single row.

## Accessibility considerations

- Maintain one logical page-title heading within the consuming view and preserve the surrounding heading hierarchy.
- Keep the description near the title; `aria-describedby` can associate it when useful.
- Give an action group a descriptive name when its purpose would otherwise be unclear.
- Preserve native button and link semantics, source order, and `:focus-visible` styles.
- Do not add another `main` landmark or make every page header a named region.
- Test long text, narrow layouts, 200% text size, dark appearance, and forced colours in the consuming application.

## Token dependencies

The component uses existing semantic spacing, typography, and secondary-text tokens, including `--kh-space-2`, `--kh-space-3`, `--kh-space-4`, `--kh-space-6`, `--kh-type-size-2xl`, `--kh-type-size-sm`, `--kh-type-weight-semibold`, `--kh-type-line-height-tight`, and `--kh-color-text-secondary`. Actions use the existing button classes. No new tokens or runtime code are required.

## Common mistakes

- Using a heading level based only on its desired visual size.
- Replacing a useful description with placeholder text or truncating a long title.
- Using buttons for navigation or links for actions.
- Adding global heading rules to imitate the page-header title.
- Putting application-wide identity controls in the page header when the application header already owns them.

## SwiftUI conceptual mapping

The page title and contextual actions are conceptually similar to a navigation title and `.toolbar` items in SwiftUI. This is design-intent guidance only; Kihon does not generate native SwiftUI views.

## Reference screenshots

[Light theme](screenshots/page-header-light.png) · [Dark theme](screenshots/page-header-dark.png)
