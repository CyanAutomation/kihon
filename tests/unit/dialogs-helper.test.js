const test = require('node:test');
const assert = require('node:assert/strict');
const { closeDialog, disposeDialog, openDialog } = require('../../src/js/dialogs.js');

function createDialogHarness(closeTiming) {
  const listeners = new Map();
  const document = { activeElement: null, body: {}, documentElement: {} };
  const focusable = (name) => ({
    name,
    nodeType: 1,
    isConnected: true,
    ownerDocument: document,
    focus() { document.activeElement = this; }
  });
  const trigger = focusable('trigger');
  const initialFocus = focusable('initial focus');
  const fallbackFocus = focusable('fallback');
  let pendingClose = null;
  let removeCount = 0;

  const dialog = {
    open: false,
    returnValue: '',
    ownerDocument: document,
    showModal() { this.open = true; },
    matches(selector) { return selector === ':modal' && this.open; },
    contains(element) { return element === initialFocus; },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) {
        listeners.delete(type);
        removeCount += 1;
      }
    },
    close(returnValue = '') {
      this.open = false;
      this.returnValue = returnValue;
      pendingClose = listeners.get('close');
      if (closeTiming === 'sync') pendingClose?.();
    }
  };

  return {
    dialog,
    document,
    trigger,
    initialFocus,
    fallbackFocus,
    dispatchPendingClose() { pendingClose?.(); },
    get listenerCount() { return listeners.size; },
    get removeCount() { return removeCount; }
  };
}

function open(harness) {
  return openDialog(harness.dialog, {
    trigger: harness.trigger,
    initialFocus: harness.initialFocus,
    fallbackFocus: harness.fallbackFocus
  });
}

test('disposeDialog removes its listener when close dispatches synchronously', () => {
  const harness = createDialogHarness('sync');
  open(harness);

  assert.equal(closeDialog(harness.dialog, 'done'), true);
  assert.equal(harness.document.activeElement, harness.trigger);
  assert.equal(disposeDialog(harness.dialog), true);
  assert.equal(harness.listenerCount, 0);
  assert.equal(harness.removeCount, 1);

  assert.equal(open(harness), true);
  assert.equal(harness.listenerCount, 1);
  assert.equal(closeDialog(harness.dialog, 'reused'), true);
  assert.equal(harness.document.activeElement, harness.trigger);
});

test('disposeDialog waits for an asynchronous close event to restore focus and clean up', () => {
  const harness = createDialogHarness('async');
  open(harness);

  assert.equal(closeDialog(harness.dialog, 'done'), true);
  assert.equal(harness.document.activeElement, harness.initialFocus);
  assert.equal(disposeDialog(harness.dialog), true);
  assert.equal(harness.listenerCount, 1);

  harness.dispatchPendingClose();
  assert.equal(harness.document.activeElement, harness.trigger);
  assert.equal(harness.listenerCount, 0);
  assert.equal(harness.removeCount, 1);
});

test('each new modal session resets the previous result before an Escape-style close', () => {
  const harness = createDialogHarness('sync');

  assert.equal(open(harness), true);
  assert.equal(closeDialog(harness.dialog, 'save'), true);
  assert.equal(harness.dialog.returnValue, 'save');

  assert.equal(open(harness), true);
  assert.equal(harness.dialog.returnValue, '');
  assert.equal(closeDialog(harness.dialog), true);
  assert.equal(harness.dialog.returnValue, '');

  assert.equal(open(harness), true);
  assert.equal(closeDialog(harness.dialog, 'confirm'), true);
  assert.equal(harness.dialog.returnValue, 'confirm');
  assert.equal(open(harness), true);
  assert.equal(harness.dialog.returnValue, '');
  assert.equal(closeDialog(harness.dialog), true);
  assert.equal(harness.dialog.returnValue, '');
});
