"use strict";
var KihonDialogs = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/ts/dialogs.ts
  var dialogs_exports = {};
  __export(dialogs_exports, {
    closeDialog: () => closeDialog,
    disposeDialog: () => disposeDialog,
    openDialog: () => openDialog
  });
  var controllers = /* @__PURE__ */ new WeakMap();
  function requireDialog(dialog) {
    if (!dialog || typeof dialog.showModal !== "function" || typeof dialog.close !== "function" || typeof dialog.matches !== "function") {
      throw new TypeError("Expected a native HTMLDialogElement.");
    }
    return dialog;
  }
  function isModal(dialog) {
    return dialog.matches(":modal");
  }
  function isDialogFocusTarget(value) {
    return value !== null && typeof value === "object" && Reflect.get(value, "nodeType") === 1 && typeof Reflect.get(value, "focus") === "function";
  }
  function validateFocusTarget(value, name, document, dialog) {
    if (value === null) return;
    if (!isDialogFocusTarget(value) || value.ownerDocument !== document || typeof value.focus !== "function" || name === "initialFocus" && (!dialog?.contains(value) || !value.isConnected)) {
      const requirement = name === "initialFocus" ? "a connected focusable element inside the dialog" : "a focusable element in the dialog document";
      throw new TypeError(`${name} must be ${requirement}.`);
    }
  }
  function controllerFor(dialog) {
    const existingController = controllers.get(dialog);
    if (existingController) return existingController;
    const controller = {
      trigger: null,
      fallbackFocus: null,
      sessionActive: false,
      disposeAfterClose: false,
      onClose: () => {
        if (dialog.open) return;
        const { trigger, fallbackFocus } = controller;
        controller.trigger = null;
        controller.fallbackFocus = null;
        controller.sessionActive = false;
        if (trigger?.isConnected) {
          if (dialog.ownerDocument.activeElement !== trigger) trigger.focus();
        } else if (fallbackFocus?.isConnected) {
          fallbackFocus.focus();
        }
        if (controller.disposeAfterClose) {
          controller.disposeAfterClose = false;
          dialog.removeEventListener("close", controller.onClose);
          controllers.delete(dialog);
        }
      }
    };
    dialog.addEventListener("close", controller.onClose);
    controllers.set(dialog, controller);
    return controller;
  }
  function openDialog(dialog, options = {}) {
    requireDialog(dialog);
    if (dialog.open) {
      if (isModal(dialog)) return false;
      throw new Error("Kihon can only open a closed dialog as a modal.");
    }
    if (options === null || typeof options !== "object") {
      throw new TypeError("Dialog options must be an object.");
    }
    const document = dialog.ownerDocument;
    const trigger = options.trigger === void 0 ? document.activeElement : options.trigger;
    const initialFocus = options.initialFocus ?? null;
    const fallbackFocus = options.fallbackFocus ?? null;
    validateFocusTarget(trigger, "trigger", document);
    validateFocusTarget(initialFocus, "initialFocus", document, dialog);
    validateFocusTarget(fallbackFocus, "fallbackFocus", document);
    dialog.returnValue = "";
    dialog.showModal();
    const controller = controllerFor(dialog);
    controller.disposeAfterClose = false;
    controller.sessionActive = true;
    controller.trigger = trigger?.isConnected && trigger !== document.body && trigger !== document.documentElement ? trigger : null;
    controller.fallbackFocus = fallbackFocus;
    initialFocus?.focus();
    return true;
  }
  function closeDialog(dialog, returnValue = "") {
    requireDialog(dialog);
    if (!dialog.open) return false;
    if (!isModal(dialog)) {
      throw new Error("Kihon can only close a modal dialog opened with showModal().");
    }
    dialog.close(String(returnValue));
    return true;
  }
  function disposeDialog(dialog) {
    requireDialog(dialog);
    if (dialog.open) throw new Error("Close the dialog before disposing its focus-restoration helper.");
    const controller = controllers.get(dialog);
    if (!controller) return false;
    if (controller.sessionActive) {
      controller.disposeAfterClose = true;
      return true;
    }
    dialog.removeEventListener("close", controller.onClose);
    controllers.delete(dialog);
    return true;
  }
  return __toCommonJS(dialogs_exports);
})();
if (typeof module === "object" && module.exports) module.exports = KihonDialogs;
