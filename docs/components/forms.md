# Forms

Kihon form styles give native controls a shared visual language and a small,
documented presentation contract. They do not manage form state, decide when to
validate, or submit application data. Import `src/css/base.css`; it loads the
token, button, form, and grouped-settings styles in order.

## Public CSS API

| Class | Purpose |
| --- | --- |
| `.kh-field` | Stacks a label, control, help text, and error message. |
| `.kh-label` | Visible label for an individual field. |
| `.kh-label--choice` | Comfortable clickable label layout for a checkbox or radio. |
| `.kh-required` | Optional visible required cue; pair it with native `required`. |
| `.kh-help` | Supporting field description. |
| `.kh-error` | Text explanation of an active error. |
| `.kh-input` | Native text-entry input, including email, password, search, URL, telephone, and number types. |
| `.kh-textarea` | Native, vertically resizable textarea. |
| `.kh-select` | Native select with its browser affordance and keyboard behavior. |
| `.kh-checkbox`, `.kh-radio` | Native checkbox and radio controls using the theme accent. |
| `.kh-fieldset`, `.kh-legend` | Opt-in presentation for semantic choice groups. |

All styling is opt-in. Unclassed native inputs, labels, fieldsets, and legends
keep their browser presentation. The existing `.kh-label`, `.kh-input`,
`.kh-textarea`, `.kh-select`, `.kh-checkbox`, and `.kh-radio` names are retained.

## Field structure

Use a persistent visible label associated with each control. Give every `id` a
unique value in the rendered document; applications that render repeated fields
should derive IDs from stable record or field identifiers.

```html
<div class="kh-field">
  <label class="kh-label" for="application-name">Application name</label>
  <input
    class="kh-input"
    id="application-name"
    name="applicationName"
    type="text"
    aria-describedby="application-name-help"
  >
  <p class="kh-help" id="application-name-help">
    Used to identify this application.
  </p>
</div>
```

Placeholder text can provide an example, but it does not replace the label.
Descriptions wrap with the field and can be associated with `aria-describedby`.
That attribute accepts a space-separated list of IDs, so help and error text can
be associated together.

## Native controls and states

Apply `.kh-input` to ordinary text-entry types (`text`, `email`, `password`,
`search`, `url`, `tel`, and `number`). It preserves native editing, autocomplete,
autofill, password-manager, paste, and validity behavior. Textareas remain
vertically resizable. Selects remain native; Kihon does not replace their
arrow, popup, or keyboard navigation.

Checkboxes and radios retain native rendering, checked state, keyboard behavior,
and form submission semantics. Use a real `<label>` and put related choices in
`<fieldset class="kh-fieldset">` with a `<legend class="kh-legend">`. Native
radio groups share the same `name`; browser arrow-key behavior is unchanged.
Kihon does not add composite-widget keyboard rules.

| State | Contract |
| --- | --- |
| Required | Use the native `required` attribute. If a visible cue is useful, include text such as `<span class="kh-required" aria-hidden="true">(Required)</span>` in the label; the native attribute exposes the required state to assistive technology. |
| Optional | Leave off `required`. Do not label every non-required field “Optional” unless the workflow benefits from it. |
| Disabled | Use native `disabled`. The control cannot be focused or submitted; its text remains readable. |
| Read-only | Use native `readonly` on text inputs or textareas. The value remains focusable and copyable. It is not a substitute for `disabled` on controls that do not support `readonly`. |
| Invalid | When an error is active, set `aria-invalid="true"`, show a recovery-oriented `.kh-error`, and associate it using `aria-describedby`. Remove or update the state when the error is resolved. |
| Valid | No success styling is applied automatically. Use a success message only when it helps the user understand a meaningful outcome. |

Kihon does not style every browser `:invalid` state automatically. This avoids
showing error treatment before an application chooses to present an error.
Focus-visible remains visible on normal and invalid controls. Disabled and
read-only states are not communicated through color alone.

## Validation and errors

Preserve native constraints such as `required`, `type="email"`, `min`, `max`,
`minlength`, `maxlength`, and `pattern`. Applications choose validation timing
and own business rules. Native validity APIs such as `checkValidity()`,
`reportValidity()`, `validity`, and `setCustomValidity()` can support that work;
Kihon does not provide a validation engine or validate on every keystroke.

```html
<div class="kh-field">
  <label class="kh-label" for="account-email">Email address</label>
  <input
    class="kh-input"
    id="account-email"
    name="email"
    type="email"
    required
    aria-invalid="true"
    aria-describedby="account-email-help account-email-error"
  >
  <p class="kh-help" id="account-email-help">
    We will use this address for account notifications.
  </p>
  <p class="kh-error" id="account-email-error">
    Enter an email address in the format name@example.com.
  </p>
</div>
```

An error needs explanatory text as well as the invalid state and border. Keep
help text when it is still useful. For forms with several errors, use an
application-owned summary with links to fields. Focus the summary after
submission only when it contains errors, and keep field-level messages beside
the controls. A summary can use ordinary section/list markup and does not need a
Kihon-specific class or JavaScript framework:

```html
<section aria-labelledby="form-errors-title" tabindex="-1">
  <h2 id="form-errors-title">Review these fields</h2>
  <ul>
    <li><a href="#account-email">Email address: enter a valid email address.</a></li>
  </ul>
</section>
```

After a failed submit, application code can reveal this section and focus it;
the link returns the user to the affected field. Do not focus an empty summary.

## Responsive behavior and themes

Text controls use full available inline width, wrapping labels and descriptions
naturally. Textareas have a sensible minimum height and can grow vertically.
Text-entry controls have a 48 CSS px minimum block size. Checkboxes and radios
have a 24 CSS px target, and `.kh-label--choice` expands the associated label
target to 48 CSS px. The classes use semantic background, text, border, accent,
danger, focus, spacing, radius, typography, and motion tokens, so they follow
system, light, and dark themes. Forced-colors mode retains visible control
boundaries and focus indicators.

Consumers may override documented semantic tokens at their theme scope. Check
text contrast and control boundaries in their actual adjacent colors after an
override. Automated contrast checks cover selected token pairings only; they do
not certify WCAG conformance.

## Common mistakes

- Using placeholder text as the only label.
- Setting `aria-invalid` without showing and associating an understandable error.
- Showing errors before interaction without a workflow reason.
- Using `disabled` when a user should be able to focus and copy a value.
- Removing the native select appearance or replacing native controls with custom
  menus.
- Relying on a red border or a required asterisk as the only state cue.
- Reusing IDs when rendering repeated fields.

## Keyboard behavior and limitations

Native inputs, selects, checkboxes, radios, and fieldsets keep browser keyboard
and assistive-technology behavior. Kihon does not set validation rules, manage
focus after errors, save data, call APIs, or implement form submission. Test
application-specific validation timing, focus, and server errors in the
consuming app.

## SwiftUI conceptual mapping

| Kihon intent | SwiftUI concept |
| --- | --- |
| Text input | `TextField` |
| Password input | `SecureField` |
| Multiline text | `TextEditor` |
| Native select | `Picker` |
| Boolean choice | `Toggle` |
| Help or error copy | Field-level supporting presentation |

These are design-intent equivalents only. Kihon does not generate SwiftUI code
or promise automatic portability.
