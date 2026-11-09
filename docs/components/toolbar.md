# Toolbar

The toolbar arranges actions and form controls associated with a page, section, or dataset. It provides layout only: search, filtering, sorting, and action behavior belong to the consuming application.

Load [`src/css/base.css`](../../src/css/base.css). It imports the toolbar stylesheet. The component is opt-in and requires no JavaScript.

## Public CSS API

| Class | Purpose |
| --- | --- |
| `.kh-toolbar` | Wrapping control group. |
| `.kh-toolbar__group` | Related controls or actions. |
| `.kh-toolbar__group--end` | Pushes a group toward the inline end when space allows. |
| `.kh-toolbar__separator` | Optional decorative separator between groups. |
| `.kh-toolbar__label` | Compact visible label for an associated control. |

## Semantic markup

Use ordinary groups with an accessible name when the control purpose is not already clear. Give form controls persistent labels; the example uses visible labels and native controls.

```html
<div class="kh-toolbar" role="group" aria-label="Project controls">
  <div class="kh-toolbar__group" role="group" aria-label="Search projects">
    <label class="kh-toolbar__label" for="project-search">Search</label>
    <input
      class="kh-input"
      id="project-search"
      type="search"
      placeholder="Project name or owner"
    >
  </div>

  <div class="kh-toolbar__group" role="group" aria-label="Project filters">
    <label class="kh-toolbar__label" for="project-sort">Sort by</label>
    <select class="kh-select" id="project-sort">
      <option value="name">Name</option>
      <option value="updated">Recently updated</option>
    </select>
  </div>

  <span class="kh-toolbar__separator" aria-hidden="true"></span>

  <div class="kh-toolbar__group kh-toolbar__group--end" role="group" aria-label="Project actions">
    <button class="kh-button kh-button--secondary" type="button">Refresh</button>
    <button class="kh-button kh-button--primary" type="button">Export</button>
  </div>
</div>
```

Use the existing `.kh-button`, `.kh-input`, `.kh-select`, and `.kh-label` contracts. Kihon does not add toolbar-specific button variants or replace native controls. A separator is decorative, is not focusable, and should be hidden from assistive technology. It is never the only indication that controls are related.

## Keyboard behavior and ARIA

The default component does **not** use `role="toolbar"`. That ARIA role describes a composite widget with additional keyboard behavior, including arrow-key navigation and managed focus. Kihon toolbars are visual arrangements of independent controls; users navigate them using their browser's ordinary Tab sequence.

Use `role="group"` with a concise accessible name when a group needs context. Do not add arrow-key handling, roving `tabindex`, or shortcut behavior to ordinary action groups. A future composite toolbar would be a separate behavioral component with its own keyboard contract and tests.

## Responsive behavior and action placement

Groups wrap while keeping DOM and keyboard order unchanged. An end-aligned group uses `margin-inline-start: auto` while space remains; it follows its source order when it wraps. Search inputs can grow or shrink within their group. Labels and buttons wrap rather than being clipped, and no action is hidden behind an implicit overflow menu.

Use separators sparingly. They remain decorative and use a system text color in forced-colours mode. Do not rely on color alone to convey a meaningful grouping.

## Accessibility considerations

- Use a named group for toolbar controls when context is needed; do not claim composite toolbar semantics.
- Associate each input and select with a persistent label.
- Keep native button, link, input, and select behavior and visible focus indicators.
- Preserve source order; do not use CSS `order` to rearrange controls.
- Test narrow containers, long labels, enlarged text, light/dark themes, forced colours, and keyboard focus.
- Automated checks do not establish screen-reader support or full application conformance.

## Token dependencies

The toolbar uses existing `--kh-space-*`, `--kh-color-border-subtle`, `--kh-color-text-secondary`, `--kh-type-size-sm`, and `--kh-type-weight-medium` tokens. Buttons and form controls keep their own token use and interaction states. No new tokens or runtime code are required.

## Common mistakes and limitations

- Do not add `role="toolbar"` without implementing its complete keyboard interaction contract.
- Do not use placeholders in place of labels.
- Do not hide secondary actions or create an incomplete custom overflow menu to preserve a one-row layout.
- Do not assume search, filtering, sorting, status, or export logic is provided by Kihon.
- The toolbar does not implement sticky positioning, persistence, keyboard shortcuts, or menus.

## SwiftUI conceptual mapping

Page and section actions are conceptually similar to SwiftUI `.toolbar` items, paired with navigation-title patterns. These are design-intent mappings only; Kihon does not generate native SwiftUI views.

## Reference screenshots

[Light theme](screenshots/toolbar-light.png) · [Dark theme](screenshots/toolbar-dark.png)
