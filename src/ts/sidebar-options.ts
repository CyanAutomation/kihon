import type { SidebarOptions } from './sidebar.js';

export interface ResolvedSidebarOptions {
  sidebar: HTMLElement;
  toggleButton: HTMLButtonElement;
  shell: HTMLElement | null;
  initialExpanded: boolean;
}

type RawSidebarOptions = Record<string, unknown>;

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

export function resolveSidebarOptions(options: SidebarOptions): ResolvedSidebarOptions {
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
