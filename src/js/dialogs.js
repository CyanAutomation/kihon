/* Optional native-dialog helpers. Applications own validation and actions. */
(function exposeDialogHelpers(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KihonDialogs = api;
})(typeof window === 'undefined' ? globalThis : window, function createDialogHelpers() {
  const controllers = new WeakMap();

  function requireDialog(dialog) {
    if (!dialog || typeof dialog.showModal !== 'function' || typeof dialog.close !== 'function' || typeof dialog.matches !== 'function') {
      throw new TypeError('Expected a native HTMLDialogElement.');
    }
    return dialog;
  }

  function isModal(dialog) {
    return dialog.matches(':modal');
  }

  function controllerFor(dialog) {
    let controller = controllers.get(dialog);
    if (controller) return controller;

    controller = {
      trigger: null,
      fallbackFocus: null,
      sessionActive: false,
      disposeAfterClose: false,
      onClose: null
    };
    controller.onClose = () => {
      // A close event from a just-closed instance can arrive after an immediate reopen.
      if (dialog.open) return;

      const { trigger, fallbackFocus } = controller;
      controller.trigger = null;
      controller.fallbackFocus = null;
      controller.sessionActive = false;

      // Native dialog normally restores focus. Correct it only if needed, or use the fallback if removed.
      if (trigger?.isConnected) {
        if (dialog.ownerDocument.activeElement !== trigger) trigger.focus();
      } else if (fallbackFocus?.isConnected && typeof fallbackFocus.focus === 'function') {
        fallbackFocus.focus();
      }

      if (controller.disposeAfterClose) {
        dialog.removeEventListener('close', controller.onClose);
        controllers.delete(dialog);
      }
    };

    dialog.addEventListener('close', controller.onClose);
    controllers.set(dialog, controller);
    return controller;
  }

  function openDialog(dialog, options = {}) {
    requireDialog(dialog);
    if (dialog.open) {
      if (isModal(dialog)) return false;
      throw new Error('Kihon can only open a closed dialog as a modal.');
    }
    if (options === null || typeof options !== 'object') {
      throw new TypeError('Dialog options must be an object.');
    }

    const document = dialog.ownerDocument;
    const trigger = options.trigger === undefined ? document.activeElement : options.trigger;
    const initialFocus = options.initialFocus ?? null;
    const fallbackFocus = options.fallbackFocus ?? null;

    if (initialFocus && (!dialog.contains(initialFocus) || typeof initialFocus.focus !== 'function' || !initialFocus.isConnected)) {
      throw new TypeError('initialFocus must be a connected focusable element inside the dialog.');
    }
    for (const [name, target] of [['trigger', trigger], ['fallbackFocus', fallbackFocus]]) {
      if (target && (target.ownerDocument !== document || typeof target.focus !== 'function')) {
        throw new TypeError(`${name} must be a focusable element in the dialog document.`);
      }
    }

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

  function closeDialog(dialog, returnValue = '') {
    requireDialog(dialog);
    if (!dialog.open) return false;
    if (!isModal(dialog)) {
      throw new Error('Kihon can only close a modal dialog opened with showModal().');
    }
    dialog.close(String(returnValue));
    return true;
  }

  function disposeDialog(dialog) {
    requireDialog(dialog);
    if (dialog.open) throw new Error('Close the dialog before disposing its focus-restoration helper.');
    const controller = controllers.get(dialog);
    if (!controller) return false;
    if (controller.sessionActive) {
      // `close` is dispatched asynchronously; let native and fallback restoration run first.
      controller.disposeAfterClose = true;
      return true;
    }
    dialog.removeEventListener('close', controller.onClose);
    controllers.delete(dialog);
    return true;
  }

  return { openDialog, closeDialog, disposeDialog };
});
