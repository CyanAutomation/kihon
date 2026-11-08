# Dialogs

Kihon dialog styles provide a restrained presentation for native HTML
`<dialog>` elements. A CSS class does not make an element modal: open modal
dialogs with `showModal()` so the browser supplies top-layer placement,
background inertness, modal semantics, and keyboard focus containment. Import
`src/css/base.css` to receive the opt-in styles.

## Public CSS API

| Class | Purpose |
| --- | --- |
| `.kh-dialog` | Base modal surface. |
| `.kh-dialog__header` | Title and optional description. |
| `.kh-dialog__title` | Visible dialog heading. |
| `.kh-dialog__description` | Concise supporting text. |
| `.kh-dialog__body` | Content region that can scroll when content is long. |
| `.kh-dialog__footer` | Wrapping action row. |
| `.kh-dialog--sm` | Compact information or confirmation dialog. |
| `.kh-dialog--lg` | Wider, form-oriented dialog. |

Without a size modifier, the dialog uses a moderate 36rem maximum inline size;
`--sm` uses 26rem and `--lg` uses 52rem. All sizes remain constrained to the
viewport. The body can scroll independently while the heading and actions stay
available. On narrow screens, footer actions wrap into full-width rows.

All opinionated rules are opt-in. The component styles only a `.kh-dialog` when
it is modal, and does not reset unclassed dialogs or supply a DOM backdrop.
Semantic surface, text, border, radius, shadow, spacing, typography, and focus
tokens adapt to system, light, and dark appearances.

## Recommended structure

Give every dialog an accessible name. Prefer `aria-labelledby` pointing to its
visible heading and add `aria-describedby` for concise supporting text when it
helps users understand the dialog before interacting.

```html
<button type="button" id="open-preferences">Preferences</button>

<dialog
  class="kh-dialog"
  id="preferences-dialog"
  aria-labelledby="preferences-title"
  aria-describedby="preferences-description"
>
  <header class="kh-dialog__header">
    <h2 class="kh-dialog__title" id="preferences-title">Preferences</h2>
    <p class="kh-dialog__description" id="preferences-description">
      Manage your application preferences.
    </p>
  </header>
  <div class="kh-dialog__body">
    <p>Dialog content goes here.</p>
  </div>
  <div class="kh-dialog__footer">
    <button class="kh-button kh-button--secondary" type="button">Cancel</button>
    <button class="kh-button kh-button--primary" type="button">Save changes</button>
  </div>
</dialog>
```

Do not add `role="dialog"` or `aria-modal="true"`; native `<dialog>` opened
with `showModal()` already exposes those semantics. Use normal buttons and
existing Kihon form classes inside the dialog.

## Opening, initial focus, and focus restoration

Native code can open a modal directly:

```js
dialog.showModal();
```

Calling `showModal()` on an already-open dialog throws. The optional helper
provides a repeated-open guard and stores the invoking control for the removed
trigger fallback case:

```html
<script src="/path/to/kihon/src/js/dialogs.js" defer></script>
<script defer>
  const trigger = document.querySelector('#open-preferences');
  const dialog = document.querySelector('#preferences-dialog');
  const firstField = dialog.querySelector('input');
  const fallback = document.querySelector('#settings-heading');

  trigger.addEventListener('click', () => {
    KihonDialogs.openDialog(dialog, {
      trigger,
      initialFocus: firstField,
      fallbackFocus: fallback
    });
  });
</script>
```

The helper API is optional:

| Function | Behavior |
| --- | --- |
| `KihonDialogs.openDialog(dialog, options)` | Calls `showModal()`. Returns `true` when opened and `false` if it is already open modally. Throws for an already-open nonmodal dialog or invalid focus targets. |
| `KihonDialogs.closeDialog(dialog, returnValue)` | Closes an open modal and sets its `returnValue`. Returns `true` when closed and `false` when already closed. |
| `KihonDialogs.disposeDialog(dialog)` | Removes its focus-restoration listener after the dialog is closed. Returns `true` when disposed and `false` if no listener was registered. |

`options.trigger` defaults to the document's active element. `initialFocus` is
optional; without it, the browser's `autofocus` and native initial-focus
algorithm remain in control. Choose a focus target that fits the workflow:

- Information dialogs can focus their Close action.
- Preferences dialogs can focus the first relevant field.
- Destructive confirmations should start on Cancel or a static heading, not
  the destructive action.

The browser normally restores focus to the invoker when the dialog closes. The
helper leaves that behavior alone when focus has returned correctly; if the
invoker is still connected but focus is elsewhere, it restores focus to that
control. If the invoker has been removed, it focuses the supplied connected
`fallbackFocus`; if none was supplied or it was removed, it does not force focus
to `body`. Applications may provide a logical successor for their own page
structure. Call `disposeDialog` when a dynamically removed dialog is no longer
needed; if its `close` event is pending, disposal waits until restoration has
run. Static dialogs can keep the small listener for the page lifetime.

The helper does not create a focus trap. Browser modal behavior prevents
background controls from receiving focus. In Chromium, a Tab or Shift+Tab at a
dialog boundary can make `document.activeElement` report `body` for that
navigation step; the next step returns within the modal. Kihon does not add
sentinel controls or a second focus trap to override that native behavior.

## Dismissal, cancellation, and results

Provide a visible Cancel or Close action and allow Escape on dismissible
dialogs. Do not require a backdrop click, and do not add global keyboard
interception. A simple result-based action may use a form with
`method="dialog"`:

```html
<form method="dialog" class="kh-dialog__footer">
  <button class="kh-button kh-button--primary" type="submit" value="close">
    Close
  </button>
</form>
```

`method="dialog"` closes the dialog and sets `returnValue` to the submitted
button's value. Escape dispatches `cancel` and closes a dismissible modal;
programmatic `close(value)` closes it and sets `returnValue`. A close event
reports that it closed, not that an operation succeeded. Treat values such as
`cancel`, `close`, or `confirm` explicitly, and keep confirmation or save logic
in the application. Guard business actions against duplicate activation.

For forms with validation or asynchronous saving, do not use
`method="dialog"`. Prevent submission, validate with native constraints and
application rules, show associated errors, and leave the dialog open on failure.
Close only after the application confirms a valid local or remote completion.
Kihon supplies form presentation; applications own validation rules, form
state, persistence, network requests, and recovery paths.

## Responsive behavior, themes, and accessibility

The dialog is viewport constrained rather than fixed-height. Keep long content
inside `.kh-dialog__body` so it remains scrollable while actions stay available.
Use wrapping labels and actions; test 320 CSS px, large text, browser zoom, and
the consuming application's content. The styles use semantic tokens and the
native backdrop, with no entry animation. Forced-colours mode preserves a
visible dialog boundary and reduced-motion preferences do not require custom
animation handling.

Verify keyboard opening, Escape, Cancel, form error announcements, initial
focus, focus containment, restoration, and any removed-trigger fallback in the
complete application. Automated checks do not establish screen-reader support
or WCAG conformance. See [the manual checklist](../../tests/MANUAL_TESTING.md)
for VoiceOver, NVDA, zoom, touch, reduced-motion, and forced-colours checks.

## Common mistakes and limitations

- Applying `.kh-dialog` without calling `showModal()` and expecting modal
  semantics or background inertness.
- Calling `show()` and treating that nonmodal dialog as a Kihon modal.
- Adding a custom focus trap or a separate backdrop element.
- Focusing a destructive action before users have read its consequences.
- Closing a form after an invalid submission or equating every close with a
  successful save.
- Using backdrop click as the only way to dismiss.
- Reusing IDs across dialogs or omitting accessible names.

Kihon does not implement nested dialog orchestration, modal stacking, action
frameworks, business decisions, or a server-side no-JavaScript modal. A
critical workflow must retain an accessible alternative such as a normal
settings page when JavaScript or native dialog support is unavailable.

## SwiftUI conceptual mapping

| Kihon intent | SwiftUI concept |
| --- | --- |
| Information dialog | `.alert` or a simple `.sheet`, depending on content and decision flow |
| Preferences form | `.sheet` containing a form |
| Destructive confirmation | `.confirmationDialog` or `.alert`, depending on platform context |

These mappings express design intent only. Native browser and SwiftUI dialog
behavior are not interchangeable.

## Reference screenshots

[Light theme dialog](screenshots/dialogs-light.png) · [Dark theme dialog](screenshots/dialogs-dark.png)
