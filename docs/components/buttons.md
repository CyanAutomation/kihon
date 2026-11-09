# Buttons and Actions

Kihon buttons provide a shared visual treatment for native HTML actions. They use semantic tokens and CSS only; Kihon does not create controls, manage application state, or require a JavaScript runtime.

## CSS entry point

Load `src/css/base.css`. It imports generated `tokens.css` and the internal `src/css/components/buttons.css` in a fixed order. Existing applications that already load `base.css` keep their `.kh-button` styles without changing markup. Do not load the component file separately when using `base.css`.

The stable public API is the documented `.kh-*` classes and semantic `--kh-*` tokens below. The component file's path and internal selectors are implementation details. Its rules target native `<button>` elements, so the same classes on an anchor do not turn navigation into a button-like control. No style-guide stylesheet or script is needed.

```html
<link rel="stylesheet" href="path/to/kihon/src/css/base.css">
```

## Basic use and default

Use a native `<button>` for an action and specify its type. The base class remains a medium primary button for compatibility with existing Kihon markup.

```html
<button type="button" class="kh-button">Save</button>
<button type="submit" class="kh-button kh-button--primary">Save changes</button>
```

`kh-button--primary` makes the main action explicit. It is not required for the default appearance. Button labels should describe the result of the action.

## Public classes

Apply `.kh-button` with at most one variant and one size modifier:

| Class | Appearance and use |
| --- | --- |
| `.kh-button` | Base button; defaults to primary and medium. |
| `.kh-button--primary` | Main action in a view or form. |
| `.kh-button--secondary` | Supporting or alternative action. |
| `.kh-button--quiet` | Contextual action in a toolbar or compact interface. Accessible accent text keeps the control visibly interactive. |
| `.kh-button--destructive` | Action that removes, deletes, resets or otherwise changes data destructively. Use clear wording as well as the danger colour. |
| `.kh-button--sm` | Compact desktop actions. The minimum target is 40 CSS px; leave adequate spacing around dense controls. |
| `.kh-button--md` | Standard size and default when no size class is present. Minimum target is 48 CSS px. |
| `.kh-button--lg` | More prominent or touch-oriented actions. Minimum target is 56 CSS px. |
| `.kh-button--icon` | Icon-only button; use with a variant and an accessible name. It retains a 48 CSS px minimum target. |
| `.kh-button--loading` | CSS loading presentation for application-managed asynchronous work. |

```html
<button type="button" class="kh-button kh-button--secondary kh-button--sm">
  View details
</button>
```

Small controls are intended for dense desktop toolbars and secondary actions. For frequently touched actions, prefer at least 44 × 44 CSS px. The compact size exceeds WCAG 2.2 AA's 24 × 24 CSS px minimum, but spacing and context still matter.

## Interaction states

- **Default:** each variant has a resting appearance in both themes.
- **Hover:** subtle colour or border feedback; the pointer cursor and label preserve the affordance without hover.
- **Active:** a momentary 1px press while `:active` applies. It is not a persistent toggle state.
- **Keyboard focus:** `:focus-visible` shows a 2px semantic focus ring with an offset. Keep it clear of clipping and overlays in the consuming layout.
- **Disabled:** use the native `disabled` attribute. Disabled controls cannot activate and may be skipped in keyboard navigation. When the reason matters, keep the action available and explain how to proceed.
- **Loading:** change the label so it names the work in progress, add `.kh-button--loading`, and use `disabled` when duplicate activation must be prevented.

```html
<button type="button" class="kh-button kh-button--primary kh-button--loading" disabled>
  Saving changes…
</button>
<p role="status" aria-live="polite">Saving changes…</p>
```

The loading pseudo-element is decorative. Its cycle uses `--kh-motion-loading` and is hidden when reduced motion is requested; the text continues to communicate status. Do not put `aria-busy` on the button as a substitute for a meaningful announcement. The consuming application sets and clears the state and should announce completion or failure in an adjacent live status when useful. Use `min-inline-size` in the application when a loading label must not shift nearby layout.

Kihon does not provide a loading controller, confirmation dialog, or persistent status state. Confirm destructive actions in the application when their consequences warrant it; dialog behavior is part of Phase 2C.

## Semantics and accessibility

### Actions and navigation

Use `<button>` for actions and `<a href="…">` for navigation. Kihon does not define button-like link styling in Phase 2A. Do not change a link's role to `button` to get an action appearance. Use `type="submit"` only for intentional form submission; otherwise use `type="button"` to avoid accidental form submits.

### Keyboard and disabled behavior

Native buttons work with Enter and Space, take part in form behavior, and retain browser focus handling. Use the native `disabled` attribute rather than `aria-disabled` or `pointer-events: none` for an unavailable ordinary action. Remember that native disabled buttons are removed from normal tab navigation.

### Toggle buttons

Phase 2A has no toggle controller. For a persistent toggle, the application must maintain the state and set `aria-pressed="true"` or `aria-pressed="false"` on the native button. Do not use `:active` as a toggle state.

### Icons

Kihon supplies no icon set. Application-provided SVGs inherit `currentColor`; hide decorative SVGs from assistive technology. Icon-only controls need an accessible name, normally with `aria-label`.

```html
<button type="button" class="kh-button kh-button--quiet kh-button--icon" aria-label="Refresh">
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <!-- Application-provided icon using currentColor -->
  </svg>
</button>
```

### Text sizing and touch targets

Labels wrap rather than clip when space is limited. Keep labels concise and allow the control to grow under text zoom. Do not set fixed heights that can crop enlarged text. Use 44 × 44 CSS px or larger for common touch actions; add space between smaller compact controls.

## Themes, motion and customisation

The four variants adapt to Kihon's system, light and dark themes. Button-specific colors come from these public semantic tokens:

| Token | Use |
| --- | --- |
| `--kh-color-accent` | Primary background and border. |
| `--kh-color-on-accent` | Primary label and icon; charcoal in light mode for the coral fill. |
| `--kh-color-accent-text` | Quiet button and link text where the brighter action fill would not have sufficient text contrast. |
| `--kh-color-button-primary-hover` | Primary pointer-hover background and border. |
| `--kh-color-surface` | Secondary background and quiet/destructive hover background. |
| `--kh-color-background` | Secondary hover background. |
| `--kh-color-text-primary` | Secondary label. |
| `--kh-color-danger` | Destructive label and hover border. |
| `--kh-color-border-strong` | Secondary boundary. |
| `--kh-color-border-subtle` | Quiet hover boundary. |
| `--kh-color-focus-ring` | Keyboard focus indicator. |

Applications may override documented semantic token values at the root or theme scope. Recheck text and non-text contrast for every button state in both themes after overrides. Kihon's bright coral light-mode fill uses a dark label; `--kh-color-accent-text` is a separate, darker coral for readable links and quiet actions. Kihon also preserves system forced-colours behavior and removes component transitions and spinner motion under `prefers-reduced-motion: reduce`.

Button geometry and typography use existing tokens such as `--kh-space-*`, `--kh-radius-md`, `--kh-type-size-*`, and `--kh-type-weight-medium`. Transitions use `--kh-motion-fast`; the decorative loading cycle uses `--kh-motion-loading`. These tokens are generated from the existing DTCG source and do not require a runtime stylesheet or script beyond `base.css`.

## SwiftUI conceptual mapping

| Kihon intent | SwiftUI concept |
| --- | --- |
| Primary | Prominent action |
| Secondary | Standard action |
| Quiet | Borderless or low-emphasis action |
| Destructive | Destructive role |
| Disabled | `.disabled()` |
| Busy | Application-managed loading state |
| Sizes | Control sizing conventions |

This mapping records design intent only. Kihon CSS is not translated into SwiftUI automatically.

## Examples to avoid

```html
<!-- Avoid: a button used for navigation. -->
<button type="button" class="kh-button">Open settings</button>

<!-- Avoid: an icon-only action without a name. -->
<button type="button" class="kh-button kh-button--icon">
  <svg aria-hidden="true" focusable="false"></svg>
</button>

<!-- Avoid: aria-disabled without application code enforcing the disabled behavior. -->
<button type="button" class="kh-button" aria-disabled="true">Save</button>
```

Use an anchor with a real `href` for the first example, add an accessible name to the second, and use the native `disabled` attribute for the third.

## Limits

Kihon provides button appearance and native browser state styling. It does not supply icons, asynchronous state management, toggle behavior, confirmation flows, menus, toolbars or dialogs. The style-guide demonstrations are separate examples and are not production APIs.

## Reference screenshots

[Light theme preview](screenshots/buttons-light.png) · [Dark theme preview](screenshots/buttons-dark.png)
