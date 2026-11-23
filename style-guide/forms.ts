/**
 * Local form and validation demonstrations for the static style guide only.
 * Kihon production styles do not own form state, validation timing, or submission.
 */
const nativeDemo = document.querySelector<HTMLFormElement>('[data-kh-demo-native-form]');
nativeDemo?.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = nativeDemo.querySelector<HTMLElement>('[data-kh-demo-native-status]');
  if (status) status.textContent = 'Native constraints passed. No data was sent or saved.';
});

type DemoControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function findFieldError(control: DemoControl): HTMLElement | null {
  return control.closest('.kh-field')?.querySelector<HTMLElement>('.kh-error') ?? null;
}

function updateDescription(control: DemoControl, errorId: string, includeError: boolean): void {
  const describedBy = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  if (includeError) describedBy.add(errorId);
  else describedBy.delete(errorId);

  if (describedBy.size) control.setAttribute('aria-describedby', [...describedBy].join(' '));
  else control.removeAttribute('aria-describedby');
}

function clearControlError(control: DemoControl): void {
  control.removeAttribute('aria-invalid');
  const error = findFieldError(control);
  if (!error) return;

  updateDescription(control, error.id, false);
  error.textContent = '';
  error.hidden = true;
}

function fieldLabel(control: DemoControl): string {
  return control.labels?.[0]?.textContent?.trim() || 'This field';
}

function validationMessage(control: DemoControl): string {
  const label = fieldLabel(control).toLocaleLowerCase();
  if (control.validity.valueMissing) return `Enter ${label}.`;
  if (control.validity.typeMismatch) return `Enter ${label} in a valid format.`;
  return `Check the value for ${label}.`;
}

function showControlError(control: DemoControl, errorList: HTMLElement | null, ownerDocument: Document): void {
  const error = findFieldError(control);
  const label = fieldLabel(control);
  const message = validationMessage(control);

  control.setAttribute('aria-invalid', 'true');
  if (error) {
    error.textContent = message;
    error.hidden = false;
    updateDescription(control, error.id, true);
  }

  if (!errorList || !control.id) return;
  const item = ownerDocument.createElement('li');
  const link = ownerDocument.createElement('a');
  link.href = `#${control.id}`;
  link.textContent = `${label}: ${message}`;
  item.append(link);
  errorList.append(item);
}

function clearFormErrors(controls: DemoControl[], errorList: HTMLElement | null): void {
  controls.forEach(clearControlError);
  errorList?.replaceChildren();
}

function showValidSubmission(summary: HTMLElement | null, status: HTMLElement | null): void {
  if (summary) summary.hidden = true;
  if (status) status.textContent = 'The example passed native constraints. No data was sent or saved.';
}

function showInvalidSubmission(
  invalidControls: DemoControl[],
  errorList: HTMLElement | null,
  summary: HTMLElement | null,
  status: HTMLElement | null,
  ownerDocument: Document
): void {
  invalidControls.forEach((control) => showControlError(control, errorList, ownerDocument));
  if (summary) {
    summary.hidden = false;
    summary.focus();
  }
  if (status) status.textContent = 'Review the fields listed in the error summary.';
}

function handleCustomDemoSubmit(form: HTMLFormElement, event: SubmitEvent): void {
  event.preventDefault();

  const summary = form.querySelector<HTMLElement>('[data-kh-demo-error-summary]');
  const errorList = form.querySelector<HTMLElement>('[data-kh-demo-error-list]');
  const status = form.querySelector<HTMLElement>('[data-kh-demo-custom-status]');
  const controls = [...form.querySelectorAll<DemoControl>('input, select, textarea')];
  clearFormErrors(controls, errorList);

  const invalidControls = controls.filter((control) => !control.validity.valid);
  if (!invalidControls.length) {
    showValidSubmission(summary, status);
    return;
  }

  showInvalidSubmission(invalidControls, errorList, summary, status, form.ownerDocument);
}

const customDemo = document.querySelector<HTMLFormElement>('[data-kh-demo-custom-form]');
customDemo?.addEventListener('submit', (event) => handleCustomDemoSubmit(customDemo, event));
