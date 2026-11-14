# Sidebar Navigation

Kihon's sidebar styles give ordinary application links a shared, responsive
presentation. Use native navigation landmarks, headings, lists, anchors, and
the application's own route state. The optional TypeScript controller only
adds collapse and reveal behavior; it does not choose destinations, infer the
current route, or persist preferences.

Load `src/css/base.css`. It imports the sidebar stylesheet after the
application-shell styles, and consumers do not need the style-guide CSS.

## Public CSS API

| Class | Purpose |
| --- | --- |
| `.kh-sidebar` | Sidebar navigation landmark and layout. |
| `.kh-sidebar__header` | Optional identity or summary above the groups. |
| `.kh-sidebar__section` | A named group of related destinations. |
| `.kh-sidebar__section-title` | Visible heading for a group. |
| `.kh-sidebar__list` | Unstyled list of navigation entries. |
| `.kh-sidebar__item` | Individual list item. |
| `.kh-sidebar__link` | Native navigation anchor. |
| `.kh-sidebar__icon` | Optional decorative icon container. |
| `.kh-sidebar__label` | Optional wrapper for a label that sits beside an icon. |
| `.kh-sidebar__description` | Optional secondary text below a link label. |
| `.kh-sidebar__footer` | Optional secondary information or navigation. |
| `.kh-sidebar-toggle` | Optional native button that controls collapse and reveal. |

All classes are opt-in. The application shell positions the navigation region;
the sidebar classes style its contents. `.kh-app-shell__nav` alone does not
style descendant links. Existing Phase 3A links remain native and functional;
add the sidebar classes and list markup to adopt the canonical sidebar design.

## Semantic structure

Give each navigation landmark a meaningful, unique name. Use lists for related
links and visible headings to label groups. Heading levels depend on the host
page's hierarchy; the example uses `h2` because the sidebar sits beside the
view's `h1`.

```html
<div class="kh-app-shell kh-app-shell--with-nav-and-details">
  <header class="kh-app-shell__header">
    <strong>Project workspace</strong>
    <button
      class="kh-button kh-button--quiet kh-sidebar-toggle"
      type="button"
      aria-controls="primary-sidebar"
      aria-expanded="true"
      hidden
    >
      Toggle navigation
    </button>
  </header>

  <nav
    class="kh-app-shell__nav kh-sidebar"
    id="primary-sidebar"
    aria-label="Primary navigation"
  >
    <div class="kh-sidebar__header"><strong>Workspace</strong></div>

    <section class="kh-sidebar__section" aria-labelledby="primary-workspace-title">
      <h2 class="kh-sidebar__section-title" id="primary-workspace-title">Workspace</h2>
      <ul class="kh-sidebar__list">
        <li class="kh-sidebar__item">
          <a class="kh-sidebar__link" href="/overview" aria-current="page">
            <span class="kh-sidebar__label">Overview</span>
          </a>
        </li>
        <li class="kh-sidebar__item">
          <a class="kh-sidebar__link" href="/projects">
            <span class="kh-sidebar__label">Projects</span>
          </a>
        </li>
      </ul>
    </section>

    <section class="kh-sidebar__section" aria-labelledby="primary-account-title">
      <h2 class="kh-sidebar__section-title" id="primary-account-title">Account</h2>
      <ul class="kh-sidebar__list">
        <li class="kh-sidebar__item">
          <a class="kh-sidebar__link" href="/settings">Settings</a>
        </li>
      </ul>
    </section>

    <div class="kh-sidebar__footer"><small>Workspace account</small></div>
  </nav>

  <main class="kh-app-shell__main">
    <h1>Overview</h1>
    <p>Application content.</p>
  </main>

  <aside class="kh-app-shell__details" aria-label="Project details">
    <h2>Project details</h2>
  </aside>
</div>
```

Use ordinary `<a href>` elements for navigation. Do not use `role="menu"`,
`role="menuitem"`, or `role="tree"`; those roles carry different keyboard
contracts. Kihon does not provide an icon set. If an application adds a
decorative SVG, put it in `.kh-sidebar__icon` and mark it `aria-hidden="true"`
with `focusable="false"`. Keep the link's text label visible. Labels and
descriptions wrap at larger text sizes rather than being clipped or
ellipsized. Descriptions are included in the link's accessible name; keep them
short and useful.

## Current-page state

The consuming application determines the current route and sets
`aria-current="page"` on its matching link:

```html
<a class="kh-sidebar__link" href="/projects" aria-current="page">
  Projects
</a>
```

The CSS follows that attribute. The current item has a subtle surface, an
accent edge, and stronger text weight, so the state does not rely on color
alone. Keep no more than one current-page link in a primary navigation
landmark. Kihon does not inspect the URL or maintain a separate selected state.

Unavailable destinations should generally be omitted until they can be used.
Do not use an anchor with `aria-disabled="true"` as a substitute for a
disabled control: it still navigates. If unavailable content must be shown,
render descriptive non-interactive text and explain its status.

## Collapse and reveal

The sidebar is visible by default, including when JavaScript is disabled. An
optional controller makes the native button available after successful
initialization. Keep the button in the shell header, outside the navigation it
controls. In the initial HTML, include `hidden`; this prevents a nonfunctional
toggle from appearing if scripts are unavailable. The controller removes that
attribute only after it has attached its listener. If initialization fails,
navigation remains visible and the control remains hidden.

The button must have a meaningful visible label or `aria-label`, an explicit
`type="button"`, `aria-controls` referencing the navigation `id`, and an
`aria-expanded` value matching the actual state. A stable label such as
“Toggle navigation” is sufficient because `aria-expanded` exposes the state.

### TypeScript API

The reusable source is `src/ts/sidebar.ts`. It exports:

```ts
export interface SidebarOptions {
  sidebar: HTMLElement;
  toggleButton: HTMLButtonElement;
  shell?: HTMLElement;
  initialExpanded?: boolean;
}

export interface SidebarController {
  expand(): void;
  collapse(): void;
  toggle(): void;
  dispose(): void;
}

export function createSidebarController(
  options: SidebarOptions
): SidebarController;
```

`sidebar` must be a connected, uniquely identified `<nav>` element. The native
button must be connected to the same document, have `type="button"`, expose a
name, and reference the sidebar's `id`. If `shell` is omitted, the controller
uses the nearest `.kh-app-shell`; pass it explicitly for a non-nearest shell.
`initialExpanded` defaults to the sidebar's current visibility. Applications
should omit `hidden` from the navigation in their initial markup so the page has
a useful no-script fallback.

The controller synchronizes the native `hidden` state and `aria-expanded`.
When used in an application shell, it also toggles
`.kh-app-shell--nav-collapsed`, which removes the empty navigation track from
two- and three-region layouts. The navigation stays hidden only while the
controller is active. Calling `dispose()` removes its click listener, restores
the navigation to its visible fallback, resets the shell track, and hides the
toggle again. Disposal is idempotent; methods on a disposed controller throw.
Only one controller may be active for a given navigation at a time.

If focus is inside the navigation when it is collapsed programmatically, focus
moves to the connected toggle before the navigation is hidden. If the toggle was
removed while the controller remains active, the focused link is blurred before
the navigation is hidden. Keep the toggle connected for normal use and dispose
the controller when removing the view. Activating the toggle to reveal the
sidebar leaves focus on the toggle; it does not move focus into the navigation.
The controller adds no focus trap and installs no global keyboard handler.

### Browser JavaScript usage

The generated `src/js/sidebar.js` can be loaded as a classic script and exposes
`window.KihonSidebar`. It can also be required from Node. The matching
`src/js/sidebar.d.ts` is generated from the TypeScript source.

```html
<script src="/path/to/kihon/src/js/sidebar.js" defer></script>
<script defer>
  const sidebar = document.querySelector('#primary-sidebar');
  const toggleButton = document.querySelector('.kh-sidebar-toggle');

  const controller = window.KihonSidebar.createSidebarController({
    sidebar,
    toggleButton
  });

  // Call controller.dispose() when removing this sidebar view.
</script>
```

The application owns the controller's lifetime and any preference persistence.
The output is a classic browser-global/CommonJS bundle, not a browser ES module.
No runtime dependency is required.

## Responsive behavior and shell integration

The application shell stacks its regions at and below `56rem`; navigation
remains visible in that layout. The optional toggle works at every width, so
users can reveal navigation after collapsing it and can resize the viewport
without losing access. Kihon does not turn the sidebar into a modal or
off-canvas drawer, and it does not trap focus. The shell's viewport breakpoint
does not adapt to a narrow parent container; see the [application shell
limitations](app-shell.md#layout-and-responsive-behavior) when embedding it in
a constrained region. Apply `.kh-app-shell--compact` to stack the regions when
the available parent is narrow, even on a wide viewport; the sidebar controller
continues to remove or restore the navigation track in that layout.

## Tokens, themes, and accessibility

The component uses existing semantic tokens and adds no new theme values:

- Surface and background tokens for the sidebar and hover/current surfaces.
- Primary and secondary text, accent, and subtle border tokens.
- Focus ring, spacing, type size, weight, line height, and radius tokens.
- Fast motion token for hover transitions, removed under reduced motion.

Light, dark, and system appearances follow those token assignments. Forced
colours use system link and highlight colors for the current item and keyboard
focus. Sidebar links have a 48 CSS px minimum block target, wrap long labels,
and retain native keyboard behavior. Check actual text and boundary contrast
after any application token overrides.

Automated Playwright tests in Chromium, Firefox, and WebKit cover naming, keyboard focus, hidden-state behavior,
two- and three-column shell tracks, 320 CSS px reflow, larger text, themes,
forced colours, reduced motion, and controller cleanup. They do not establish
screen-reader support or full WCAG conformance. VoiceOver, NVDA, actual touch,
browser zoom, and installed Safari/Edge behavior still need the manual checks in
[`tests/MANUAL_TESTING.md`](../../tests/MANUAL_TESTING.md).

## Common mistakes and limitations

- Using an unnamed navigation landmark or duplicate landmark names.
- Omitting list semantics or visible group headings for grouped destinations.
- Using a JavaScript-only selected style instead of `aria-current="page"`.
- Hiding the navigation before the controller is ready.
- Leaving the toggle inside the navigation it hides.
- Forgetting to dispose a controller when a dynamic view is removed.
- Adding menu/tree roles, a custom keyboard model, focus trap, or router.
- Expecting Kihon to infer routes, permissions, or persistent preferences.

## SwiftUI conceptual mapping

A Kihon sidebar with primary destinations is conceptually similar to a
sidebar-oriented `NavigationSplitView`. The HTML and CSS do not generate a
native SwiftUI view, and navigation state still belongs to the consuming
application.

## Reference screenshots

[Light theme sidebar](screenshots/sidebar-light.png) · [Dark theme sidebar](screenshots/sidebar-dark.png)
