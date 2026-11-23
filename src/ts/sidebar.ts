/** Optional controller for a native, labelled sidebar navigation landmark. */

import { resolveSidebarOptions } from './sidebar-options.js';

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

const controllers = new WeakMap<HTMLElement, SidebarController>();
const COLLAPSED_CLASS = 'kh-app-shell--nav-collapsed';
const READY_ATTRIBUTE = 'data-kh-sidebar-ready';

/**
 * Add optional collapse/reveal behavior to a visible-by-default sidebar.
 * The controller owns aria-expanded and the app-shell collapsed modifier until disposed.
 */
export function createSidebarController(options: SidebarOptions): SidebarController {
  const resolved = resolveSidebarOptions(options);
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
