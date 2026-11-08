/* Optional native-dialog helpers. Applications own validation and actions. */

export interface DialogFocusTarget extends Element {
  focus(options?: FocusOptions): void;
}

export interface DialogOpenOptions {
  trigger?: DialogFocusTarget | null;
  initialFocus?: DialogFocusTarget | null;
  fallbackFocus?: DialogFocusTarget | null;
}

export interface KihonDialogsAPI {
  openDialog(dialog: HTMLDialogElement, options?: DialogOpenOptions): boolean;
  closeDialog(dialog: HTMLDialogElement, returnValue?: string): boolean;
  disposeDialog(dialog: HTMLDialogElement): boolean;
}

declare global {
  interface Window {
    KihonDialogs?: KihonDialogsAPI;
  }
}

interface DialogController {
  trigger: DialogFocusTarget | null;
  fallbackFocus: DialogFocusTarget | null;
  sessionActive: boolean;
  disposeAfterClose: boolean;
  onClose: () => void;
}

const controllers = new WeakMap<HTMLDialogElement, DialogController>();

function requireDialog(dialog: HTMLDialogElement): HTMLDialogElement {
  if (
    !dialog
    || typeof dialog.showModal !== 'function'
    || typeof dialog.close !== 'function'
    || typeof dialog.matches !== 'function'
  ) {
    throw new TypeError('Expected a native HTMLDialogElement.');
  }

  return dialog;
}

function isModal(dialog: HTMLDialogElement): boolean {
  return dialog.matches(':modal');
}

function isDialogFocusTarget(value: unknown): value is DialogFocusTarget {
  return value !== null
    && typeof value === 'object'
    && Reflect.get(value, 'nodeType') === 1
    && typeof Reflect.get(value, 'focus') === 'function';
}

function validateFocusTarget(
  value: unknown,
  name: string,
  document: Document,
  dialog?: HTMLDialogElement
): asserts value is DialogFocusTarget | null {
  if (value === null) return;

  if (
    !isDialogFocusTarget(value)
    || value.ownerDocument !== document
    || typeof value.focus !== 'function'
    || (name === 'initialFocus' && (!dialog?.contains(value) || !value.isConnected))
  ) {
    const requirement = name === 'initialFocus'
      ? 'a connected focusable element inside the dialog'
      : 'a focusable element in the dialog document';
    throw new TypeError(`${name} must be ${requirement}.`);
  }
}

function controllerFor(dialog: HTMLDialogElement): DialogController {
  const existingController = controllers.get(dialog);
  if (existingController) return existingController;

  const controller: DialogController = {
    trigger: null,
    fallbackFocus: null,
    sessionActive: false,
    disposeAfterClose: false,
    onClose: () => {
      // A close event from a just-closed instance can arrive after an immediate reopen.
      if (dialog.open) return;

      const { trigger, fallbackFocus } = controller;
      controller.trigger = null;
      controller.fallbackFocus = null;
      controller.sessionActive = false;

      // Native dialog normally restores focus. Correct it only if needed, or use the fallback if removed.
      if (trigger?.isConnected) {
        if (dialog.ownerDocument.activeElement !== trigger) trigger.focus();
      } else if (fallbackFocus?.isConnected) {
        fallbackFocus.focus();
      }

      if (controller.disposeAfterClose) {
        controller.disposeAfterClose = false;
        dialog.removeEventListener('close', controller.onClose);
        controllers.delete(dialog);
      }
    }
  };

  dialog.addEventListener('close', controller.onClose);
  controllers.set(dialog, controller);
  return controller;
}

export function openDialog(dialog: HTMLDialogElement, options: DialogOpenOptions = {}): boolean {
  requireDialog(dialog);
  if (dialog.open) {
    if (isModal(dialog)) return false;
    throw new Error('Kihon can only open a closed dialog as a modal.');
  }
  if (options === null || typeof options !== 'object') {
    throw new TypeError('Dialog options must be an object.');
  }

  const document = dialog.ownerDocument;
  const trigger: unknown = options.trigger === undefined ? document.activeElement : options.trigger;
  const initialFocus: unknown = options.initialFocus ?? null;
  const fallbackFocus: unknown = options.fallbackFocus ?? null;

  validateFocusTarget(trigger, 'trigger', document);
  validateFocusTarget(initialFocus, 'initialFocus', document, dialog);
  validateFocusTarget(fallbackFocus, 'fallbackFocus', document);

  // A new modal session always starts as an uncommitted/cancelled result.
  dialog.returnValue = '';
  dialog.showModal();

  const controller = controllerFor(dialog);
  controller.disposeAfterClose = false;
  controller.sessionActive = true;
  controller.trigger = trigger?.isConnected && trigger !== document.body && trigger !== document.documentElement
    ? trigger
    : null;
  controller.fallbackFocus = fallbackFocus;

  // Leave autofocus and the browser's default focus algorithm in control unless overridden.
  initialFocus?.focus();
  return true;
}

export function closeDialog(dialog: HTMLDialogElement, returnValue = ''): boolean {
  requireDialog(dialog);
  if (!dialog.open) return false;
  if (!isModal(dialog)) {
    throw new Error('Kihon can only close a modal dialog opened with showModal().');
  }
  dialog.close(String(returnValue));
  return true;
}

export function disposeDialog(dialog: HTMLDialogElement): boolean {
  requireDialog(dialog);
  if (dialog.open) throw new Error('Close the dialog before disposing its focus-restoration helper.');
  const controller = controllers.get(dialog);
  if (!controller) return false;
  if (controller.sessionActive) {
    // If the close event is still pending, restore focus before removing this listener.
    controller.disposeAfterClose = true;
    return true;
  }
  dialog.removeEventListener('close', controller.onClose);
  controllers.delete(dialog);
  return true;
}
