/** Optional controller for a native, labelled sidebar navigation landmark. */

export interface SidebarOptions {
  sidebar: HTMLElement;
  toggleButton: HTMLButtonElement;
  shell?: HTMLElement;
  initialExpanded?: boolean;
}

export interface SidebarController {
  expand(): void;
  collapse(): void;
  toggle(): void;
  dispose(): void;
}

export interface KihonSidebarAPI {
  createSidebarController(options: SidebarOptions): SidebarController;
}

declare global {
  interface Window {
    KihonSidebar?: KihonSidebarAPI;
  }
}

interface ResolvedSidebarOptions {
  sidebar: HTMLElement;
  toggleButton: HTMLButtonElement;
  shell: HTMLElement | null;
  initialExpanded: boolean;
}

type RawSidebarOptions = Record<string, unknown>;

const controllers = new WeakMap<HTMLElement, SidebarController>();
const COLLAPSED_CLASS = 'kh-app-shell--nav-collapsed';
const READY_ATTRIBUTE = 'data-kh-sidebar-ready';

function isDomElement(value: unknown): value is HTMLElement {
  return value !== null
    && typeof value === 'object'
    && Reflect.get(value, 'nodeType') === 1
    && typeof Reflect.get(value, 'getAttribute') === 'function'
    && typeof Reflect.get(value, 'setAttribute') === 'function'
    && typeof Reflect.get(value, 'contains') === 'function'
    && typeof Reflect.get(value, 'focus') === 'function';
}

function isSidebarToggle(value: unknown): value is HTMLButtonElement {
  return isDomElement(value)
    && value.localName === 'button'
    && Reflect.get(value, 'type') === 'button'
    && typeof Reflect.get(value, 'addEventListener') === 'function'
    && typeof Reflect.get(value, 'removeEventListener') === 'function';
}

function requireOptionsObject(options: SidebarOptions): RawSidebarOptions {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('Sidebar options must be an object.');
  }
  return options as unknown as RawSidebarOptions;
}

function requireSidebar(value: unknown): HTMLElement {
  if (!isDomElement(value) || value.localName !== 'nav') {
    throw new TypeError('sidebar must be a nav element.');
  }
  return value;
}

function requireToggleButton(value: unknown): HTMLButtonElement {
  if (!isSidebarToggle(value)) {
    throw new TypeError('toggleButton must be a native button with type="button".');
  }
  return value;
}

function requireSharedDocument(sidebar: HTMLElement, toggleButton: HTMLButtonElement): Document {
  const document = sidebar.ownerDocument;
  if (!document || !sidebar.isConnected || !toggleButton.isConnected) {
    throw new TypeError('sidebar and toggleButton must be connected to a document.');
  }
  if (toggleButton.ownerDocument !== document) {
    throw new TypeError('sidebar and toggleButton must belong to the same document.');
  }
  return document;
}

function requireUniqueSidebarId(sidebar: HTMLElement, document: Document): void {
  if (!sidebar.id || document.getElementById(sidebar.id) !== sidebar) {
    throw new TypeError('sidebar must have a unique id.');
  }
}

function hasAccessibleName(sidebar: HTMLElement, document: Document): boolean {
  if (sidebar.getAttribute('aria-label')?.trim()) return true;
  const labelledBy = sidebar.getAttribute('aria-labelledby')?.trim().split(/\s+/).filter(Boolean) ?? [];
  return labelledBy.length > 0 && labelledBy.every((id) => document.getElementById(id) !== null);
}

function requireAccessibleNames(
  sidebar: HTMLElement,
  toggleButton: HTMLButtonElement,
  document: Document
): void {
  if (!hasAccessibleName(sidebar, document)) {
    throw new TypeError('sidebar must have an accessible name.');
  }
  if (toggleButton.getAttribute('aria-controls') !== sidebar.id) {
    throw new TypeError('toggleButton aria-controls must reference the sidebar id.');
  }
  const ariaLabel = toggleButton.getAttribute('aria-label');
  const toggleName = ariaLabel === null ? toggleButton.textContent?.trim() ?? '' : ariaLabel.trim();
  if (!toggleName) {
    throw new TypeError('toggleButton must have a visible label or aria-label.');
  }
}

function resolveShell(
  rawOptions: RawSidebarOptions,
  sidebar: HTMLElement,
  document: Document
): HTMLElement | null {
  const requestedShell = rawOptions.shell;
  if (requestedShell !== undefined && (!isDomElement(requestedShell) || !requestedShell.contains(sidebar))) {
    throw new TypeError('shell must be a containing element for sidebar.');
  }

  const nearestShell = sidebar.closest('.kh-app-shell');
  const shell = requestedShell === undefined
    ? (isDomElement(nearestShell) ? nearestShell : null)
    : requestedShell;
  if (shell && shell.ownerDocument !== document) {
    throw new TypeError('shell must belong to the same document as sidebar.');
  }
  return shell;
}

function resolveInitialExpanded(rawOptions: RawSidebarOptions, sidebar: HTMLElement): boolean {
  const initialExpanded = rawOptions.initialExpanded;
  if (initialExpanded !== undefined && typeof initialExpanded !== 'boolean') {
    throw new TypeError('initialExpanded must be a boolean when provided.');
  }
  return typeof initialExpanded === 'boolean' ? initialExpanded : !Boolean(sidebar.hidden);
}

function resolveOptions(options: SidebarOptions): ResolvedSidebarOptions {
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

/**
 * Add optional collapse/reveal behavior to a visible-by-default sidebar.
 * The controller owns aria-expanded and the app-shell collapsed modifier until disposed.
 */
export function createSidebarController(options: SidebarOptions): SidebarController {
  const resolved = resolveOptions(options);
  const { sidebar, toggleButton, shell, initialExpanded } = resolved;

  if (controllers.has(sidebar)) {
    throw new Error('A sidebar controller is already active for this navigation.');
  }

  let disposed = false;

  const setExpanded = (expanded: boolean): void => {
    if (!expanded && sidebar.contains(sidebar.ownerDocument.activeElement)) {
      if (toggleButton.isConnected) {
        toggleButton.focus();
      } else {
        const activeElement = sidebar.ownerDocument.activeElement;
        const blur = activeElement && Reflect.get(activeElement, 'blur');
        if (typeof blur === 'function') Reflect.apply(blur, activeElement, []);
      }
    }

    sidebar.hidden = !expanded;
    toggleButton.setAttribute('aria-expanded', String(expanded));
    shell?.classList.toggle(COLLAPSED_CLASS, !expanded);
  };

  const requireActive = (): void => {
    if (disposed) throw new Error('This sidebar controller has been disposed.');
  };

  const controller: SidebarController = {
    expand(): void {
      requireActive();
      setExpanded(true);
    },
    collapse(): void {
      requireActive();
      setExpanded(false);
    },
    toggle(): void {
      requireActive();
      setExpanded(Boolean(sidebar.hidden));
    },
    dispose(): void {
      if (disposed) return;

      // Restore the native, visible-by-default fallback before hiding the control.
      try {
        setExpanded(true);
      } finally {
        toggleButton.removeEventListener('click', onToggle);
        toggleButton.removeAttribute(READY_ATTRIBUTE);
        toggleButton.setAttribute('hidden', '');
        controllers.delete(sidebar);
        disposed = true;
      }
    }
  };

  const onToggle = (): void => setExpanded(Boolean(sidebar.hidden));

  const previousState = {
    sidebarHidden: sidebar.hidden,
    sidebarHiddenAttribute: sidebar.getAttribute('hidden'),
    expandedAttribute: toggleButton.getAttribute('aria-expanded'),
    toggleHiddenAttribute: toggleButton.getAttribute('hidden'),
    readyAttribute: toggleButton.getAttribute(READY_ATTRIBUTE),
    shellCollapsed: shell?.classList.contains(COLLAPSED_CLASS) ?? false,
    focusedElement: sidebar.ownerDocument.activeElement
  };
  let listenerMayBeAttached = false;

  try {
    // Set the requested state before exposing the control. Any later failure is
    // rolled back to the visible-by-default navigation fallback.
    setExpanded(initialExpanded);
    listenerMayBeAttached = true;
    toggleButton.addEventListener('click', onToggle);
    toggleButton.removeAttribute('hidden');
    toggleButton.setAttribute(READY_ATTRIBUTE, '');
    controllers.set(sidebar, controller);
  } catch (error) {
    const restoreAttribute = (element: HTMLElement, name: string, value: string | null): void => {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    };
    const rollbackSteps: Array<() => void> = [
      () => {
        if (listenerMayBeAttached) toggleButton.removeEventListener('click', onToggle);
      },
      () => controllers.delete(sidebar),
      () => { sidebar.hidden = previousState.sidebarHidden; },
      () => restoreAttribute(sidebar, 'hidden', previousState.sidebarHiddenAttribute),
      () => restoreAttribute(toggleButton, 'aria-expanded', previousState.expandedAttribute),
      () => shell?.classList.toggle(COLLAPSED_CLASS, previousState.shellCollapsed),
      () => restoreAttribute(toggleButton, READY_ATTRIBUTE, previousState.readyAttribute),
      () => restoreAttribute(toggleButton, 'hidden', previousState.toggleHiddenAttribute),
      () => {
        const focusedElement = previousState.focusedElement;
        if (
          !previousState.sidebarHidden
          && focusedElement
          && sidebar.contains(focusedElement)
          && typeof Reflect.get(focusedElement, 'focus') === 'function'
        ) {
          Reflect.apply(Reflect.get(focusedElement, 'focus') as (...args: never[]) => unknown, focusedElement, []);
        }
      }
    ];

    for (const rollback of rollbackSteps) {
      try {
        rollback();
      } catch {
        // Keep attempting cleanup so one failing DOM operation cannot prevent
        // listener removal or restoration of the other fallback state.
      }
    }

    throw error;
  }

  return controller;
}
