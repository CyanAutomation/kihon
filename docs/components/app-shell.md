# Application shell

The application shell provides an opt-in CSS grid for a desktop-oriented view with a header, primary navigation, main content, and optional contextual details. It positions the regions and leaves navigation-item appearance, routing, current-page state, and scrolling policy to the consuming application. Add `.kh-sidebar` to the navigation landmark for Kihon's grouped sidebar presentation.

Load `src/css/base.css`. It imports the shell stylesheet; consumers do not need to load component CSS or style-guide files separately.

## Public CSS API

| Class | Purpose |
| --- | --- |
| `.kh-app-shell` | Single-column main content, with an optional header. |
| `.kh-app-shell__header` | Full-width application identity, controls, and status. |
| `.kh-app-shell__nav` | Primary navigation region. Use with a `nav` landmark and accessible name. |
| `.kh-app-shell__main` | Primary content region. Use on the view's only `main` landmark. |
| `.kh-app-shell__details` | Optional complementary details. Use with an `aside` landmark and accessible name. |
| `.kh-app-shell--with-nav` | Two columns: navigation and main content. |
| `.kh-app-shell--with-details` | Two columns: main content and details. |
| `.kh-app-shell--with-nav-and-details` | Three columns: navigation, main content, and details. |
| `.kh-app-shell--nav-collapsed` | Controller-managed state that removes the navigation track from a two- or three-region shell. |

Choose the modifier that matches the regions present. The base class is the content-only layout. The header may be omitted in every layout. The component does not create a track for an absent region when its matching modifier is used.

## Semantic structure and document order

Keep the source order header, navigation, main content, then details. That order remains the reading and keyboard order after the layout stacks. Each application view must have one primary `main` landmark. Label primary navigation and complementary details when present. Use native links for navigation, and mark the current page with `aria-current="page"`.

```html
<a href="#main-content">Skip to main content</a>
<div class="kh-app-shell kh-app-shell--with-nav-and-details">
  <header class="kh-app-shell__header">
    <strong>Project workspace</strong>
    <button class="kh-button kh-button--primary" type="button">New project</button>
  </header>

  <nav class="kh-app-shell__nav kh-sidebar" aria-label="Primary navigation">
    <section class="kh-sidebar__section" aria-labelledby="primary-nav-workspace">
      <h2 class="kh-sidebar__section-title" id="primary-nav-workspace">Workspace</h2>
      <ul class="kh-sidebar__list">
        <li class="kh-sidebar__item"><a class="kh-sidebar__link" href="/overview" aria-current="page">Overview</a></li>
        <li class="kh-sidebar__item"><a class="kh-sidebar__link" href="/activity">Activity</a></li>
      </ul>
    </section>
    <section class="kh-sidebar__section" aria-labelledby="primary-nav-preferences">
      <h2 class="kh-sidebar__section-title" id="primary-nav-preferences">Preferences</h2>
      <ul class="kh-sidebar__list">
        <li class="kh-sidebar__item"><a class="kh-sidebar__link" href="/settings">Settings</a></li>
      </ul>
    </section>
  </nav>

  <main class="kh-app-shell__main" id="main-content" tabindex="-1">
    <h1>Overview</h1>
    <p>Application content goes here.</p>
  </main>

  <aside class="kh-app-shell__details" aria-label="Project details">
    <h2>Project details</h2>
    <p>Contextual information about the selected project.</p>
  </aside>
</div>
```

For a content-only view, omit navigation and details and use `.kh-app-shell`. For the other combinations, use `.kh-app-shell--with-nav` or `.kh-app-shell--with-details`. Do not add extra `main` landmarks to demonstrate more than one view on a single page.

The component does not provide a skip-link style. Give the link a visible focus style and make its target programmatically focusable, commonly with `tabindex="-1"`. The shell adds no focus trap, hidden controls, or JavaScript behavior.

## Layout and responsive behavior

CSS Grid places the header across the active columns. Navigation and details tracks use bounded, content-relative sizes; the main track uses `minmax(0, 1fr)` so it can shrink. At and below `56rem`, all regions stack in source order. Navigation and details remain visible and usable. This breakpoint is where the three-region desktop layout would otherwise leave too little room for main content; it is not a device category. If a sidebar controller collapses navigation, the shell removes that grid track as well as the hidden navigation. A two-region shell becomes one column; a three-region shell retains main content and details.

The breakpoint uses the viewport because the shell has no required wrapper element that could provide an inline-size query. A shell embedded in a narrower parent on a wide viewport keeps desktop columns. The tested 56rem parent retains at least 300 CSS px for main content; narrower embedded layouts should provide an application-owned responsive state or place the shell at the application root.

The shell sets no fixed width or height, sticky positioning, or overflow clipping. The default is normal document scrolling, which keeps focused controls and anchor targets in the page's scroll path. Long code blocks retain the foundation's horizontal scrolling. For wide tables, provide an explicitly labelled, keyboard-reachable overflow wrapper rather than allowing the page itself to widen.

Applications that need an application-height view may set a minimum height on their own root, for example `min-block-size: 100vh; min-block-size: 100dvh;`. Keep document scrolling unless independent pane scrolling is a real application requirement. If adding scroll containers, verify keyboard access, focus visibility, anchor navigation, browser zoom, and mobile viewport behavior. Sticky application regions are not part of this component; ensure any application-owned sticky content does not cover headings or focus targets.

## Focus, themes, and tokens

The shell preserves native links and buttons and uses Kihon's visible `:focus-visible` treatment. Its grid changes do not reorder focus or reading order. Light and dark appearances use semantic surface, text, border, and accent tokens. Forced-colours mode keeps region boundaries visible. The `.kh-sidebar` component provides the current-page indicator. The stylesheet adds no motion, so reduced-motion settings require no special behavior.

## Common mistakes and limitations

- Do not put multiple `main` landmarks in one application view.
- Do not use `aside` for primary content or unrelated navigation.
- Do not pair a layout modifier with a missing navigation or details region.
- Use `.kh-sidebar` for the canonical grouped links and states; the shell no longer styles descendant anchors directly. Existing bare navigation links remain native links, and can migrate by adding the sidebar classes and list markup.
- The shell stacks navigation at narrow widths. An optional sidebar controller can collapse it, but keeps the labelled reveal button available and does not move navigation off canvas.
- Do not expect the shell to implement routing, selected-item state, pane resizing, persistence, a toolbar, or independent scroll behavior.
- Do not put essential content only in the details pane; it follows main content in source order.
- Do not use operating-system window controls or traffic-light decorations.

## SwiftUI conceptual mapping

The three-region arrangement is conceptually similar to `NavigationSplitView` with a supplementary detail presentation. The content-only and two-region variants correspond to simpler navigation/content compositions. These are layout analogies only; Kihon HTML and CSS do not generate native SwiftUI views.

## Reference example

The [Application Shell section in the style guide](../../style-guide/index.html#app-shell) demonstrates each supported region combination, existing Kihon buttons and form controls, a native dialog trigger, and narrow-width stacking.

## Reference screenshots

[Light theme](screenshots/app-shell-light.png) · [Dark theme](screenshots/app-shell-dark.png)
