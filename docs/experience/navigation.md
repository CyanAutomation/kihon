# Application navigation contract

Kihon specifies expected behavior; the consumer selects and configures its router. Do not create a second navigation state store that can drift from the URL.

## Structure and use

- Use links with meaningful href values for destinations that can be bookmarked, opened in a new tab, shared, or revisited.
- Use buttons for local actions that do not navigate.
- Give the primary navigation landmark a clear accessible name. Mark the current destination with aria-current="page" or the appropriate selected state.
- Use top-level tabs only for a small, stable set of peer destinations. Use hierarchical links for parent/child destinations. Use a list/detail presentation for a collection where people inspect multiple items.
- A visible Back control returns to the prior in-app location when there is one. At a route root, it may return to a meaningful parent or the app's stable home, not an empty stack.
- Browser Back and Forward remain functional. Do not intercept ordinary link behavior or use replaceState for every navigation event.

## URL, deep links, and history

Each shareable screen or selected item has a stable route or fragment. Loading it directly produces the same selected destination as reaching it through the app. Query parameters represent shareable filters or view state only when useful and safe to expose.

When a router updates history, it also updates the page title, current navigation state, and main content. On Back/Forward, restore the prior route and its meaningful selection. Avoid putting secrets or sensitive draft data in a URL.

## Scroll and focus

- On forward navigation, move focus to the new page heading or main region only when the route replaces the current view; preserve normal link behavior for new tabs and browser actions.
- On Back, restore focus to the initiating link or selected row if it still exists. Otherwise focus the destination heading.
- Preserve scroll position when returning to a list after inspecting an item. New top-level destinations normally begin at their own useful starting position.
- Keep focus visible. Do not move focus merely because a breakpoint changes the visual arrangement.
- When the route changes asynchronously, expose a polite loading announcement and a useful main landmark. Focus the result only once it is ready; announce errors in context with a recovery action.

## Unsaved work and interrupted navigation

Prevent accidental loss using an application-owned confirmation or a save/recovery mechanism. Ask only when meaningful changes would be lost. Provide save, discard, or stay choices with descriptive labels. A browser beforeunload warning is a last-resort supplement, not the only recovery strategy.

Preserve drafts across a route change when the workflow expects it. On reload or a return visit, restore only data the application has deliberately persisted, and communicate when the network or authentication state prevents restoration.

## Keyboard and motion

Links and buttons remain in normal document tab order. Use browser-standard Enter and Space behavior. Do not implement arrow-key navigation for a plain list unless the pattern is intentionally a tested composite widget. Any shortcut is optional, discoverable, nonreserved, and has a visible/menu alternative.

Animate a route transition only if it clarifies spatial continuity and does not delay input. With reduced motion enabled, render the same destination and focus outcome without spatial movement.

## Acceptance checks

- Direct links render the intended page and selected item.
- Browser Back/Forward and reload preserve the expected destination.
- Back restores list context, scroll, and focus, or has a documented fallback when the initiating element no longer exists.
- Every route can be reached and left with keyboard and pointer/touch.
- Loading, error, empty, and unsaved states have visible text and a recovery action.
- A layout profile change does not reset the selected destination or discard a draft.
