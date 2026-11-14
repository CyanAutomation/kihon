# Grouped settings

Grouped settings give preferences and configuration screens a restrained
section-and-row layout. The styles present content and align controls; native
HTML remains responsible for labels, current values, activation, and keyboard
behavior. Import `src/css/base.css` to receive these styles.

## Public CSS API

| Class | Purpose |
| --- | --- |
| `.kh-settings-group` | A section of related settings. |
| `.kh-settings-heading` | Visible section heading. |
| `.kh-settings-description` | Optional explanation for the section. |
| `.kh-settings-list` | Shared surface around related rows. |
| `.kh-settings-row` | Layout for one setting. |
| `.kh-settings-row-content` | Region for a title and supporting description. |
| `.kh-settings-row-title` | Primary setting label or title. |
| `.kh-settings-row-description` | Secondary explanatory text. |
| `.kh-settings-row-control` | Region that aligns a native control. |

These classes are opt-in and do not create interactive widgets. A settings row
is not a button, link, ARIA listbox, or application state container.

## Recommended markup

Use a section with a visible heading. For form controls, associate a native
label with the control and put its description ID on `aria-describedby`.

```html
<section class="kh-settings-group" aria-labelledby="general-heading">
  <h2 class="kh-settings-heading" id="general-heading">General</h2>
  <p class="kh-settings-description">Choose how this application behaves.</p>

  <div class="kh-settings-list">
    <div class="kh-settings-row">
      <div class="kh-settings-row-content">
        <label class="kh-settings-row-title" for="automatic-updates">
          Automatic updates
        </label>
        <p class="kh-settings-row-description" id="automatic-updates-help">
          Keep application information up to date.
        </p>
      </div>
      <div class="kh-settings-row-control">
        <input
          class="kh-checkbox"
          id="automatic-updates"
          name="automaticUpdates"
          type="checkbox"
          aria-describedby="automatic-updates-help"
        >
      </div>
    </div>
  </div>
</section>
```

Use one heading per section and unique IDs in the rendered page. For related
checkbox or radio options, retain `<fieldset>` and `<legend>` semantics. Use a
real anchor for a navigation-like row. Do not nest controls inside a label that
already contains another interactive element, and do not make the whole row
clickable with custom JavaScript when a label is sufficient.

## Layout and responsive behavior

Rows place title and description in a flexible content column and the native
control in a bounded column. At 32rem and below, the control region moves under
the text and aligns to the start. Long words and descriptions wrap; rows have
content-driven height and do not clip enlarged text. DOM order remains content
then control at every width, so reading and focus order stay logical.

Shared surfaces, subtle separators, and consistent spacing group related
settings without giving each row a heavy card. The row itself does not signal
control state; the native checked or selected value is authoritative. Use the
existing `.kh-input`, `.kh-select`, `.kh-checkbox`, and `.kh-radio` classes as
appropriate.

## States, themes, and accessibility

Native controls keep checked, selected, disabled, required, and invalid state.
Use the forms contract for labels, descriptions, and errors; see
[`forms.md`](forms.md). The settings classes add no ARIA state, event handling,
or custom keyboard behavior. Controls remain independently operable by
keyboard, touch, and pointer.

Sections and rows use semantic background, text, and border tokens and adapt to
system, light, and dark themes. Reduced-motion preferences are respected by the
foundation stylesheet. Forced-colors mode keeps group boundaries visible.
Check reflow at 320 CSS px and at increased text size in the consuming
application; the included Chromium, Firefox, and WebKit suite checks for horizontal overflow at
320px, while manual review is still needed at 200% text resize and 400% zoom.

Consumers may customize documented semantic tokens and can add application
layout around groups. Do not rely on internal selectors or use borders as the
only indication that a control is interactive. Automated checks do not certify
WCAG conformance.

## Common mistakes and limitations

- Leaving a section without a descriptive heading.
- Using a clickable `div` instead of a native label, button, or anchor.
- Duplicating native state in `aria-checked`, `aria-selected`, or custom state
  attributes.
- Applying an entire-row click handler that conflicts with a checkbox, select,
  or link.
- Relying on a row background or separator to show whether a control is on.

Kihon does not persist preferences, save forms, call APIs, or synchronize state.
It does not define a settings information architecture or build navigation.

## SwiftUI conceptual mapping

| Kihon intent | SwiftUI concept |
| --- | --- |
| Grouped settings sections | `Form` and `Section` |
| Boolean setting | `Toggle` |
| Choice setting | `Picker` |
| Text configuration | `TextField` or `TextEditor` |
| Supporting description | Supporting `Text` within a form row |

These are conceptual equivalents only. No SwiftUI controls or automatic
conversion are provided.

## Reference screenshots

[Light theme settings](screenshots/grouped-settings-light.png) · [Dark theme settings](screenshots/grouped-settings-dark.png)
