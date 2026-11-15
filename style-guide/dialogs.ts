/** Local dialog demonstrations. No settings are persisted and no data is deleted. */
const dialogHeading = document.querySelector<HTMLElement>('#dialogs-heading')!;
const dialogStatus = document.querySelector<HTMLElement>('[data-kh-dialog-status]')!;
const aboutDialog = document.querySelector<HTMLDialogElement>('#about-dialog')!;
const preferencesDialog = document.querySelector<HTMLDialogElement>('#preferences-dialog')!;
const deleteDialog = document.querySelector<HTMLDialogElement>('#delete-dialog')!;

function openDemoDialog(dialog: HTMLDialogElement, trigger: HTMLElement | null, initialFocus: HTMLElement | null): void {
  window.KihonDialogs?.openDialog(dialog, {
    trigger,
    initialFocus,
    fallbackFocus: dialogHeading
  });
}

document.querySelector('#about-dialog-trigger')?.addEventListener('click', (event) => {
  openDemoDialog(aboutDialog, event.currentTarget as HTMLElement | null, document.querySelector<HTMLElement>('#about-dialog-close'));
});

document.querySelector('#app-shell-about-trigger')?.addEventListener('click', (event) => {
  openDemoDialog(aboutDialog, event.currentTarget as HTMLElement | null, document.querySelector<HTMLElement>('#about-dialog-close'));
});

const preferencesForm = document.querySelector<HTMLFormElement>('#preferences-form');
const preferencesName = document.querySelector<HTMLInputElement>('#preferences-name')!;
const preferencesError = document.querySelector<HTMLElement>('#preferences-name-error')!;
const preferencesSummary = document.querySelector<HTMLElement>('#preferences-error-summary')!;
const preferencesErrorList = document.querySelector<HTMLElement>('[data-kh-preferences-error-list]')!;

function clearPreferencesError() {
  preferencesName.removeAttribute('aria-invalid');
  preferencesName.setAttribute('aria-describedby', 'preferences-name-help');
  preferencesError.textContent = '';
  preferencesError.hidden = true;
  preferencesSummary.hidden = true;
  preferencesErrorList.replaceChildren();
}

preferencesForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  clearPreferencesError();

  if (!preferencesName.value.trim()) {
    const message = 'Enter an application name.';
    preferencesName.setAttribute('aria-invalid', 'true');
    preferencesName.setAttribute('aria-describedby', 'preferences-name-help preferences-name-error');
    preferencesError.textContent = message;
    preferencesError.hidden = false;

    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#preferences-name';
    link.textContent = `Application name: ${message}`;
    item.append(link);
    preferencesErrorList.append(item);
    preferencesSummary.hidden = false;
    preferencesSummary.focus();
    return;
  }

  dialogStatus.textContent = 'Preferences updated for this example. Nothing was saved.';
  window.KihonDialogs?.closeDialog(preferencesDialog, 'save');
});

document.querySelector('#preferences-dialog-trigger')?.addEventListener('click', (event) => {
  clearPreferencesError();
  openDemoDialog(preferencesDialog, event.currentTarget as HTMLElement | null, preferencesName);
});

document.querySelector('#preferences-cancel')?.addEventListener('click', () => {
  window.KihonDialogs?.closeDialog(preferencesDialog, 'cancel');
});

preferencesDialog?.addEventListener('close', () => {
  if (preferencesDialog.open) return;
  if (preferencesDialog.returnValue !== 'save') {
    dialogStatus.textContent = 'Preferences cancelled. Nothing was saved.';
  }
});

let confirmationHandled = false;

document.querySelector('#delete-dialog-trigger')?.addEventListener('click', (event) => {
  confirmationHandled = false;
  openDemoDialog(deleteDialog, event.currentTarget as HTMLElement | null, document.querySelector<HTMLElement>('#delete-dialog-cancel'));
});

document.querySelector('#delete-dialog-cancel')?.addEventListener('click', () => {
  window.KihonDialogs?.closeDialog(deleteDialog, 'cancel');
});

document.querySelector('#delete-dialog-confirm')?.addEventListener('click', () => {
  if (confirmationHandled) return;
  confirmationHandled = true;
  dialogStatus.textContent = 'Confirmation ran once. No real data was deleted.';
  window.KihonDialogs?.closeDialog(deleteDialog, 'confirm');
});

deleteDialog?.addEventListener('close', () => {
  if (deleteDialog.open) return;
  if (deleteDialog.returnValue !== 'confirm') {
    dialogStatus.textContent = 'Deletion cancelled. No configuration was deleted.';
  }
});
