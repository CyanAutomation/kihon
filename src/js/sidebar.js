"use strict";
var KihonSidebar = (() => {
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

  // src/ts/sidebar.ts
  var sidebar_exports = {};
  __export(sidebar_exports, {
    createSidebarController: () => createSidebarController
  });
  var controllers = /* @__PURE__ */ new WeakMap();
  var COLLAPSED_CLASS = "kh-app-shell--nav-collapsed";
  var READY_ATTRIBUTE = "data-kh-sidebar-ready";
  function isDomElement(value) {
    return value !== null && typeof value === "object" && Reflect.get(value, "nodeType") === 1 && typeof Reflect.get(value, "getAttribute") === "function" && typeof Reflect.get(value, "setAttribute") === "function" && typeof Reflect.get(value, "contains") === "function" && typeof Reflect.get(value, "focus") === "function";
  }
  function isSidebarToggle(value) {
    return isDomElement(value) && value.localName === "button" && Reflect.get(value, "type") === "button" && typeof Reflect.get(value, "addEventListener") === "function" && typeof Reflect.get(value, "removeEventListener") === "function";
  }
  function resolveOptions(options) {
    if (options === null || typeof options !== "object") {
      throw new TypeError("Sidebar options must be an object.");
    }
    const rawOptions = options;
    const sidebarValue = rawOptions.sidebar;
    const toggleValue = rawOptions.toggleButton;
    if (!isDomElement(sidebarValue) || sidebarValue.localName !== "nav") {
      throw new TypeError("sidebar must be a nav element.");
    }
    if (!isSidebarToggle(toggleValue)) {
      throw new TypeError('toggleButton must be a native button with type="button".');
    }
    const sidebar = sidebarValue;
    const toggleButton = toggleValue;
    const document = sidebar.ownerDocument;
    const ariaLabel = toggleButton.getAttribute("aria-label");
    const toggleName = ariaLabel === null ? toggleButton.textContent?.trim() ?? "" : ariaLabel.trim();
    if (!document || !sidebar.isConnected || !toggleButton.isConnected) {
      throw new TypeError("sidebar and toggleButton must be connected to a document.");
    }
    if (toggleButton.ownerDocument !== document) {
      throw new TypeError("sidebar and toggleButton must belong to the same document.");
    }
    if (!sidebar.id || document.getElementById(sidebar.id) !== sidebar) {
      throw new TypeError("sidebar must have a unique id.");
    }
    const labelledBy = sidebar.getAttribute("aria-labelledby")?.trim().split(/\s+/).filter(Boolean) ?? [];
    if (!sidebar.getAttribute("aria-label")?.trim() && (!labelledBy.length || labelledBy.some((id) => !document.getElementById(id)))) {
      throw new TypeError("sidebar must have an accessible name.");
    }
    if (toggleButton.getAttribute("aria-controls") !== sidebar.id) {
      throw new TypeError("toggleButton aria-controls must reference the sidebar id.");
    }
    if (!toggleName) {
      throw new TypeError("toggleButton must have a visible label or aria-label.");
    }
    const requestedShell = rawOptions.shell;
    if (requestedShell !== void 0 && (!isDomElement(requestedShell) || !requestedShell.contains(sidebar))) {
      throw new TypeError("shell must be a containing element for sidebar.");
    }
    const nearestShell = sidebar.closest(".kh-app-shell");
    const shell = requestedShell === void 0 ? isDomElement(nearestShell) ? nearestShell : null : requestedShell;
    if (shell && shell.ownerDocument !== document) {
      throw new TypeError("shell must belong to the same document as sidebar.");
    }
    const initialExpanded = rawOptions.initialExpanded;
    if (initialExpanded !== void 0 && typeof initialExpanded !== "boolean") {
      throw new TypeError("initialExpanded must be a boolean when provided.");
    }
    return {
      sidebar,
      toggleButton,
      shell,
      initialExpanded: typeof initialExpanded === "boolean" ? initialExpanded : !Boolean(sidebar.hidden)
    };
  }
  function createSidebarController(options) {
    const resolved = resolveOptions(options);
    const { sidebar, toggleButton, shell, initialExpanded } = resolved;
    if (controllers.has(sidebar)) {
      throw new Error("A sidebar controller is already active for this navigation.");
    }
    let disposed = false;
    const setExpanded = (expanded) => {
      if (!expanded && sidebar.contains(sidebar.ownerDocument.activeElement)) {
        if (!toggleButton.isConnected) {
          throw new Error("Keep the sidebar toggle connected while the sidebar is collapsible.");
        }
        toggleButton.focus();
      }
      sidebar.hidden = !expanded;
      toggleButton.setAttribute("aria-expanded", String(expanded));
      shell?.classList.toggle(COLLAPSED_CLASS, !expanded);
    };
    const requireActive = () => {
      if (disposed) throw new Error("This sidebar controller has been disposed.");
    };
    const controller = {
      expand() {
        requireActive();
        setExpanded(true);
      },
      collapse() {
        requireActive();
        setExpanded(false);
      },
      toggle() {
        requireActive();
        setExpanded(Boolean(sidebar.hidden));
      },
      dispose() {
        if (disposed) return;
        setExpanded(true);
        toggleButton.removeEventListener("click", onToggle);
        toggleButton.removeAttribute(READY_ATTRIBUTE);
        toggleButton.setAttribute("hidden", "");
        controllers.delete(sidebar);
        disposed = true;
      }
    };
    const onToggle = () => setExpanded(Boolean(sidebar.hidden));
    toggleButton.addEventListener("click", onToggle);
    toggleButton.removeAttribute("hidden");
    toggleButton.setAttribute(READY_ATTRIBUTE, "");
    setExpanded(initialExpanded);
    controllers.set(sidebar, controller);
    return controller;
  }
  return __toCommonJS(sidebar_exports);
})();
if (typeof module === "object" && module.exports) module.exports = KihonSidebar;
