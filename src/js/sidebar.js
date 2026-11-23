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

  // src/ts/sidebar-options.ts
  function isDomElement(value) {
    return value !== null && typeof value === "object" && Reflect.get(value, "nodeType") === 1 && typeof Reflect.get(value, "getAttribute") === "function" && typeof Reflect.get(value, "setAttribute") === "function" && typeof Reflect.get(value, "contains") === "function" && typeof Reflect.get(value, "focus") === "function";
  }
  function isSidebarToggle(value) {
    return isDomElement(value) && value.localName === "button" && Reflect.get(value, "type") === "button" && typeof Reflect.get(value, "addEventListener") === "function" && typeof Reflect.get(value, "removeEventListener") === "function";
  }
  function requireOptionsObject(options) {
    if (options === null || typeof options !== "object") {
      throw new TypeError("Sidebar options must be an object.");
    }
    return options;
  }
  function requireSidebar(value) {
    if (!isDomElement(value) || value.localName !== "nav") {
      throw new TypeError("sidebar must be a nav element.");
    }
    return value;
  }
  function requireToggleButton(value) {
    if (!isSidebarToggle(value)) {
      throw new TypeError('toggleButton must be a native button with type="button".');
    }
    return value;
  }
  function requireSharedDocument(sidebar, toggleButton) {
    const document = sidebar.ownerDocument;
    if (!document || !sidebar.isConnected || !toggleButton.isConnected) {
      throw new TypeError("sidebar and toggleButton must be connected to a document.");
    }
    if (toggleButton.ownerDocument !== document) {
      throw new TypeError("sidebar and toggleButton must belong to the same document.");
    }
    return document;
  }
  function requireUniqueSidebarId(sidebar, document) {
    if (!sidebar.id || document.getElementById(sidebar.id) !== sidebar) {
      throw new TypeError("sidebar must have a unique id.");
    }
  }
  function hasAccessibleName(sidebar, document) {
    if (sidebar.getAttribute("aria-label")?.trim()) return true;
    const labelledBy = sidebar.getAttribute("aria-labelledby")?.trim().split(/\s+/).filter(Boolean) ?? [];
    return labelledBy.length > 0 && labelledBy.every((id) => document.getElementById(id) !== null);
  }
  function requireAccessibleNames(sidebar, toggleButton, document) {
    if (!hasAccessibleName(sidebar, document)) {
      throw new TypeError("sidebar must have an accessible name.");
    }
    if (toggleButton.getAttribute("aria-controls") !== sidebar.id) {
      throw new TypeError("toggleButton aria-controls must reference the sidebar id.");
    }
    const ariaLabel = toggleButton.getAttribute("aria-label");
    const toggleName = ariaLabel === null ? toggleButton.textContent?.trim() ?? "" : ariaLabel.trim();
    if (!toggleName) {
      throw new TypeError("toggleButton must have a visible label or aria-label.");
    }
  }
  function resolveShell(rawOptions, sidebar, document) {
    const requestedShell = rawOptions.shell;
    if (requestedShell !== void 0 && (!isDomElement(requestedShell) || !requestedShell.contains(sidebar))) {
      throw new TypeError("shell must be a containing element for sidebar.");
    }
    const nearestShell = sidebar.closest(".kh-app-shell");
    const shell = requestedShell === void 0 ? isDomElement(nearestShell) ? nearestShell : null : requestedShell;
    if (shell && shell.ownerDocument !== document) {
      throw new TypeError("shell must belong to the same document as sidebar.");
    }
    return shell;
  }
  function resolveInitialExpanded(rawOptions, sidebar) {
    const initialExpanded = rawOptions.initialExpanded;
    if (initialExpanded !== void 0 && typeof initialExpanded !== "boolean") {
      throw new TypeError("initialExpanded must be a boolean when provided.");
    }
    return typeof initialExpanded === "boolean" ? initialExpanded : !Boolean(sidebar.hidden);
  }
  function resolveSidebarOptions(options) {
    const rawOptions = requireOptionsObject(options);
    const sidebar = requireSidebar(rawOptions.sidebar);
    const toggleButton = requireToggleButton(rawOptions.toggleButton);
    const document = requireSharedDocument(sidebar, toggleButton);
    requireUniqueSidebarId(sidebar, document);
    requireAccessibleNames(sidebar, toggleButton, document);
    return {
      sidebar,
      toggleButton,
      shell: resolveShell(rawOptions, sidebar, document),
      initialExpanded: resolveInitialExpanded(rawOptions, sidebar)
    };
  }

  // src/ts/sidebar.ts
  var controllers = /* @__PURE__ */ new WeakMap();
  var COLLAPSED_CLASS = "kh-app-shell--nav-collapsed";
  var READY_ATTRIBUTE = "data-kh-sidebar-ready";
  function createSidebarController(options) {
    const resolved = resolveSidebarOptions(options);
    const { sidebar, toggleButton, shell, initialExpanded } = resolved;
    if (controllers.has(sidebar)) {
      throw new Error("A sidebar controller is already active for this navigation.");
    }
    let disposed = false;
    const setExpanded = (expanded) => {
      if (!expanded && sidebar.contains(sidebar.ownerDocument.activeElement)) {
        if (toggleButton.isConnected) {
          toggleButton.focus();
        } else {
          const activeElement = sidebar.ownerDocument.activeElement;
          const blur = activeElement && Reflect.get(activeElement, "blur");
          if (typeof blur === "function") Reflect.apply(blur, activeElement, []);
        }
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
        try {
          setExpanded(true);
        } finally {
          toggleButton.removeEventListener("click", onToggle);
          toggleButton.removeAttribute(READY_ATTRIBUTE);
          toggleButton.setAttribute("hidden", "");
          controllers.delete(sidebar);
          disposed = true;
        }
      }
    };
    const onToggle = () => setExpanded(Boolean(sidebar.hidden));
    const previousState = {
      sidebarHidden: sidebar.hidden,
      sidebarHiddenAttribute: sidebar.getAttribute("hidden"),
      expandedAttribute: toggleButton.getAttribute("aria-expanded"),
      toggleHiddenAttribute: toggleButton.getAttribute("hidden"),
      readyAttribute: toggleButton.getAttribute(READY_ATTRIBUTE),
      shellCollapsed: shell?.classList.contains(COLLAPSED_CLASS) ?? false,
      focusedElement: sidebar.ownerDocument.activeElement
    };
    let listenerMayBeAttached = false;
    try {
      setExpanded(initialExpanded);
      listenerMayBeAttached = true;
      toggleButton.addEventListener("click", onToggle);
      toggleButton.removeAttribute("hidden");
      toggleButton.setAttribute(READY_ATTRIBUTE, "");
      controllers.set(sidebar, controller);
    } catch (error) {
      const restoreAttribute = (element, name, value) => {
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
      };
      const rollbackSteps = [
        () => {
          if (listenerMayBeAttached) toggleButton.removeEventListener("click", onToggle);
        },
        () => controllers.delete(sidebar),
        () => {
          sidebar.hidden = previousState.sidebarHidden;
        },
        () => restoreAttribute(sidebar, "hidden", previousState.sidebarHiddenAttribute),
        () => restoreAttribute(toggleButton, "aria-expanded", previousState.expandedAttribute),
        () => shell?.classList.toggle(COLLAPSED_CLASS, previousState.shellCollapsed),
        () => restoreAttribute(toggleButton, READY_ATTRIBUTE, previousState.readyAttribute),
        () => restoreAttribute(toggleButton, "hidden", previousState.toggleHiddenAttribute),
        () => {
          const focusedElement = previousState.focusedElement;
          if (!previousState.sidebarHidden && focusedElement && sidebar.contains(focusedElement) && typeof Reflect.get(focusedElement, "focus") === "function") {
            Reflect.apply(Reflect.get(focusedElement, "focus"), focusedElement, []);
          }
        }
      ];
      for (const rollback of rollbackSteps) {
        try {
          rollback();
        } catch {
        }
      }
      throw error;
    }
    return controller;
  }
  return __toCommonJS(sidebar_exports);
})();
if (typeof module === "object" && module.exports) module.exports = KihonSidebar;
