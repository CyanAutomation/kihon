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

function resolveOptions(options: SidebarOptions): ResolvedSidebarOptions {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('Sidebar options must be an object.');
  }

  const rawOptions = options as unknown as Record<string, unknown>;
  const sidebarValue = rawOptions.sidebar;
  const toggleValue = rawOptions.toggleButton;

  if (!isDomElement(sidebarValue) || sidebarValue.localName !== 'nav') {
    throw new TypeError('sidebar must be a nav element.');
  }
  if (!isSidebarToggle(toggleValue)) {
    throw new TypeError('toggleButton must be a native button with type="button".');
  }

  const sidebar = sidebarValue;
  const toggleButton = toggleValue;
  const document = sidebar.ownerDocument;
  const ariaLabel = toggleButton.getAttribute('aria-label');
  const toggleName = ariaLabel === null ? toggleButton.textContent?.trim() ?? '' : ariaLabel.trim();

  if (!document || !sidebar.isConnected || !toggleButton.isConnected) {
    throw new TypeError('sidebar and toggleButton must be connected to a document.');
  }
  if (toggleButton.ownerDocument !== document) {
    throw new TypeError('sidebar and toggleButton must belong to the same document.');
  }
  if (!sidebar.id || document.getElementById(sidebar.id) !== sidebar) {
    throw new TypeError('sidebar must have a unique id.');
  }
  const labelledBy = sidebar.getAttribute('aria-labelledby')?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!sidebar.getAttribute('aria-label')?.trim() && (!labelledBy.length || labelledBy.some((id) => !document.getElementById(id)))) {
    throw new TypeError('sidebar must have an accessible name.');
  }
  if (toggleButton.getAttribute('aria-controls') !== sidebar.id) {
    throw new TypeError('toggleButton aria-controls must reference the sidebar id.');
  }
  if (!toggleName) {
    throw new TypeError('toggleButton must have a visible label or aria-label.');
  }

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

  const initialExpanded = rawOptions.initialExpanded;
  if (initialExpanded !== undefined && typeof initialExpanded !== 'boolean') {
    throw new TypeError('initialExpanded must be a boolean when provided.');
  }

  return {
    sidebar,
    toggleButton,
    shell,
    initialExpanded: typeof initialExpanded === 'boolean' ? initialExpanded : !Boolean(sidebar.hidden)
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

  toggleButton.addEventListener('click', onToggle);
  toggleButton.removeAttribute('hidden');
  toggleButton.setAttribute(READY_ATTRIBUTE, '');
  setExpanded(initialExpanded);
  controllers.set(sidebar, controller);

  return controller;
}
