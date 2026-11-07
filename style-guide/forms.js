/**
 * Local form and validation demonstrations for the static style guide only.
 * Kihon production styles do not own form state, validation timing, or submission.
 */
const nativeDemo = document.querySelector('[data-kh-demo-native-form]');
nativeDemo?.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = nativeDemo.querySelector('[data-kh-demo-native-status]');
  if (status) status.textContent = 'Native constraints passed. No data was sent or saved.';
});

const customDemo = document.querySelector('[data-kh-demo-custom-form]');
customDemo?.addEventListener('submit', (event) => {
  event.preventDefault();

  const summary = customDemo.querySelector('[data-kh-demo-error-summary]');
  const errorList = customDemo.querySelector('[data-kh-demo-error-list]');
  const status = customDemo.querySelector('[data-kh-demo-custom-status]');
  const controls = [...customDemo.querySelectorAll('input, select, textarea')];
  const invalidControls = controls.filter((control) => !control.validity.valid);

  for (const control of controls) {
    control.removeAttribute('aria-invalid');
    const error = control.closest('.kh-field')?.querySelector('.kh-error');
    if (error) {
      const describedBy = (control.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((id) => id && id !== error.id);
      if (describedBy.length) control.setAttribute('aria-describedby', describedBy.join(' '));
      else control.removeAttribute('aria-describedby');
      error.textContent = '';
      error.hidden = true;
    }
  }
  errorList?.replaceChildren();

  if (invalidControls.length === 0) {
    if (summary) summary.hidden = true;
    if (status) status.textContent = 'The example passed native constraints. No data was sent or saved.';
    return;
  }

  for (const control of invalidControls) {
    const error = control.closest('.kh-field')?.querySelector('.kh-error');
    const label = control.labels?.[0]?.textContent.trim() || 'This field';
    const message = control.validity.valueMissing
      ? `Enter ${label.toLocaleLowerCase()}.`
      : control.validity.typeMismatch
        ? `Enter ${label.toLocaleLowerCase()} in a valid format.`
        : `Check the value for ${label.toLocaleLowerCase()}.`;

    control.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = message;
      error.hidden = false;
      const describedBy = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      describedBy.add(error.id);
      control.setAttribute('aria-describedby', [...describedBy].join(' '));
    }

    if (errorList && control.id) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${control.id}`;
      link.textContent = `${label}: ${message}`;
      item.append(link);
      errorList.append(item);
    }
  }

  if (summary) {
    summary.hidden = false;
    summary.focus();
  }
  if (status) status.textContent = 'Review the fields listed in the error summary.';
});
