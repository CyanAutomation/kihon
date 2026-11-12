# Platform-adaptive experience profiles

Profiles describe presentation goals, not device classes. Choose them from the actual space available to the application region, the task, input capabilities, text settings, and user preference. A resized Mac window may use the compact profile; an iPad with a keyboard may use the desktop interaction pattern while retaining touch-sized targets.

| Capability | Compact touch | Adaptive tablet | Desktop |
| --- | --- | --- | --- |
| Typical context | One-column, frequent touch, limited width | Wider touch surface, often touch plus keyboard/pointer | Resizable window, pointer/trackpad, keyboard, more information visible |
| Top-level navigation | Stable bottom tabs when there are a few peer destinations; otherwise a context-appropriate menu/link | Tabs, collapsible sidebar, or split view according to destination count and hierarchy | Sidebar, toolbar navigation, or app-specific combination |
| Hierarchy | One current level; clear Back link/button when entering detail | Keep list and detail together when width allows; collapse to one route when it does not | Sidebar/list/detail columns where they help compare and inspect |
| Actions | Primary task action near the bottom of the content or reachable control area, without covering form controls | Place actions near affected content; keep touch and keyboard paths | Contextual toolbar actions, menus, and optional discoverable shortcuts |
| Presentation | Full-width dialog/sheet treatment for focused tasks; avoid cramped popovers | Sheet or anchored popover when space and input support it | Dialog or popover close to its source; inline expansion for small disclosure |
| Density | Comfortable spacing; short summaries | Balanced list and detail context | Potentially compact, with legible columns and clear selection |

## Adaptive rules

1. Measure the container that owns the layout. A CSS container query can adapt a component embedded in a narrow panel; a viewport media query can adapt the page shell.
2. Treat width thresholds as starting points from content testing, not device detection. Kihon's 56rem shell transition is an existing component rule, not a universal experience breakpoint.
3. Prefer preserving a hierarchy when it fits: sidebar, then optional list, then detail. Collapse a column only when the remaining content still has a clear location and return path.
4. When a tablet layout changes from split to single-column, do not drop selection or draft content. Provide a clear way back to the source list.
5. Use CSS layout as the default transition mechanism. If application behavior must change, keep selection and URL semantics stable across the transition.
6. Do not key layout solely from user-agent, assumed device model, orientation, hover support, or one width value.

## Input capability and preference

Pointer media queries such as hover and pointer can refine affordances, but cannot establish the only input. A touchscreen laptop may have touch, keyboard, and a mouse; an iPad may have a pointer. Always keep visible controls available without hover, and keep controls operable without touch gestures.

Use CSS media preferences for color scheme and reduced motion. Feature-detect optional browser APIs when needed. Never hide a working link because installation or a presumed Apple device is absent.

## Depart from the defaults when

- The task is a focused single workflow and has no meaningful peer destinations.
- A data hierarchy is shallow, making a sidebar redundant.
- A consumer's established information architecture works better with another semantic navigation pattern.
- Screen-reader, enlarged-text, localization, or assistive-input needs require a different flow.
- Network, authentication, or business constraints require explicit interruption and recovery states.

The departure still needs a visible current location, a complete keyboard/touch/pointer path, and a URL that represents navigable state where appropriate.
