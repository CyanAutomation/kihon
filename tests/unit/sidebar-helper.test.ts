import test from 'node:test';
import assert from 'node:assert/strict';
import { createSidebarController, type SidebarController } from '../../src/js/sidebar.js';

interface FakeSidebarOptions {
  sidebar: FakeElement;
  toggleButton: FakeElement;
  shell?: FakeElement;
  initialExpanded?: boolean;
}

interface FixtureOptions {
  expanded?: boolean;
  passShell?: boolean;
  autoDetectShell?: boolean;
  initialize?: boolean;
}

interface SidebarFixture {
  document: FakeDocument;
  shell: FakeElement;
  sidebar: FakeElement;
  toggleButton: FakeElement;
  link: FakeElement;
  controller: SidebarController | null;
}

class FakeClassList {
  values = new Set<string>();

  toggle(name: string, force?: boolean): boolean {
    const enabled = force ?? !this.values.has(name);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }

  contains(name: string): boolean {
    return this.values.has(name);
  }
}

class FakeDocument {
  elements = new Map<string, FakeElement>();
  activeElement: FakeElement | null = null;

  getElementById(id: string): FakeElement | null {
    return this.elements.get(id) ?? null;
  }
}

class FakeElement {
  attributes = new Map<string, string>();
  children = new Set<FakeElement>();
  listeners = new Map<string, Set<() => void>>();
  classList = new FakeClassList();
  hidden = false;
  isConnected = true;
  textContent = '';
  type = '';
  nodeType = 1;
  ownerDocument: FakeDocument;
  localName: string;
  id: string;
  shell?: FakeElement;

  constructor(ownerDocument: FakeDocument, localName: string, id = '') {
    this.ownerDocument = ownerDocument;
    this.localName = localName;
    this.id = id;
    if (id) ownerDocument.elements.set(id, this);
  }

  addEventListener(type: string, listener: () => void): void {
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(listener);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  contains(element: FakeElement | null): boolean {
    return element === this || (element !== null && this.children.has(element));
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  blur() {
    if (this.ownerDocument.activeElement === this) this.ownerDocument.activeElement = null;
  }

  closest(selector: string): FakeElement | null {
    return selector === '.kh-app-shell' ? this.shell ?? null : null;
  }
}

function createController(options: FakeSidebarOptions): SidebarController {
  return createSidebarController({
    sidebar: options.sidebar as unknown as HTMLElement,
    toggleButton: options.toggleButton as unknown as HTMLButtonElement,
    ...(options.shell ? { shell: options.shell as unknown as HTMLElement } : {}),
    ...(options.initialExpanded === undefined ? {} : { initialExpanded: options.initialExpanded })
  });
}

function createFixture(options: FixtureOptions & { initialize: false }): Omit<SidebarFixture, 'controller'> & { controller: null };
function createFixture(options?: FixtureOptions & { initialize?: true }): Omit<SidebarFixture, 'controller'> & { controller: SidebarController };
function createFixture({ expanded = true, passShell = false, autoDetectShell = true, initialize = true }: FixtureOptions = {}): SidebarFixture {
  const document = new FakeDocument();
  const shell = new FakeElement(document, 'div', 'shell');
  const sidebar = new FakeElement(document, 'nav', 'primary-sidebar');
  const toggleButton = new FakeElement(document, 'button', 'sidebar-toggle');
  const link = new FakeElement(document, 'a', 'sidebar-link');
  toggleButton.type = 'button';
  toggleButton.textContent = 'Toggle navigation';
  toggleButton.setAttribute('aria-controls', sidebar.id);
  sidebar.setAttribute('aria-label', 'Primary navigation');
  sidebar.children.add(link);
  if (autoDetectShell) sidebar.shell = shell;
  shell.children.add(sidebar);
  const controllerOptions: FakeSidebarOptions = { sidebar, toggleButton, initialExpanded: expanded };
  if (passShell) controllerOptions.shell = shell;
  const controller = initialize ? createController(controllerOptions) : null;
  return { document, shell, sidebar, toggleButton, link, controller };
}

test('controller synchronizes visibility, ARIA state, and app-shell tracks idempotently', () => {
  const { shell, sidebar, toggleButton, controller } = createFixture();
  assert.equal(sidebar.hidden, false);
  assert.equal(toggleButton.getAttribute('aria-expanded'), 'true');
  assert.equal(toggleButton.getAttribute('data-kh-sidebar-ready'), '');
  assert.equal(toggleButton.getAttribute('hidden'), null);
  assert.equal(toggleButton.listeners.get('click')?.size ?? 0, 1);

  controller.collapse();
  controller.collapse();
  assert.equal(sidebar.hidden, true);
  assert.equal(toggleButton.getAttribute('aria-expanded'), 'false');
  assert.equal(shell.classList.contains('kh-app-shell--nav-collapsed'), true);

  controller.expand();
  controller.expand();
  assert.equal(sidebar.hidden, false);
  assert.equal(toggleButton.getAttribute('aria-expanded'), 'true');
  assert.equal(shell.classList.contains('kh-app-shell--nav-collapsed'), false);
});

test('explicit shell option controls its layout when automatic discovery is unavailable', () => {
  const { shell, sidebar, controller } = createFixture({ passShell: true, autoDetectShell: false });

  controller.collapse();
  assert.equal(shell.classList.contains('kh-app-shell--nav-collapsed'), true);

  controller.expand();
  assert.equal(shell.classList.contains('kh-app-shell--nav-collapsed'), false);
  controller.dispose();
});

test('collapse moves focus out of navigation before hiding its links', () => {
  const { document, sidebar, toggleButton, link, controller } = createFixture();
  link.focus();
  controller.collapse();

  assert.equal(document.activeElement, toggleButton);
  assert.equal(sidebar.hidden, true);
});

test('collapse blurs focused content if its detached toggle cannot receive focus', () => {
  const { document, sidebar, toggleButton, link, controller } = createFixture();
  link.focus();
  toggleButton.isConnected = false;

  assert.doesNotThrow(() => controller.collapse());
  assert.equal(document.activeElement, null);
  assert.equal(sidebar.hidden, true);
  assert.equal(toggleButton.getAttribute('aria-expanded'), 'false');
});

test('native button clicks toggle state and disposal restores the visible fallback', () => {
  const { shell, sidebar, toggleButton, controller } = createFixture();
  toggleButton.dispatch('click');
  assert.equal(sidebar.hidden, true);
  assert.equal(toggleButton.getAttribute('aria-expanded'), 'false');

  controller.dispose();
  assert.equal(sidebar.hidden, false);
  assert.equal(toggleButton.getAttribute('aria-expanded'), 'true');
  assert.equal(toggleButton.getAttribute('data-kh-sidebar-ready'), null);
  assert.equal(toggleButton.getAttribute('hidden'), '');
  assert.equal(toggleButton.listeners.get('click')?.size ?? 0, 0);
  assert.equal(shell.classList.contains('kh-app-shell--nav-collapsed'), false);

  toggleButton.dispatch('click');
  assert.equal(sidebar.hidden, false);
  assert.doesNotThrow(() => controller.dispose());
  assert.throws(() => controller.toggle(), /disposed/);
});

test('repeated initialization is rejected and disposal permits a new controller', () => {
  const { sidebar, toggleButton, controller } = createFixture();
  assert.throws(() => createController({ sidebar, toggleButton }), /already active/);
  assert.equal(toggleButton.listeners.get('click')?.size ?? 0, 1);

  controller.dispose();
  const replacement = createController({ sidebar, toggleButton });
  assert.equal(toggleButton.listeners.get('click')?.size ?? 0, 1);
  replacement.dispose();
});

test('failed initialization rolls back state and listeners, then allows a retry', () => {
  const { shell, sidebar, toggleButton } = createFixture({ expanded: false, initialize: false });
  toggleButton.setAttribute('aria-expanded', 'true');
  toggleButton.setAttribute('hidden', '');
  const originalSetAttribute = toggleButton.setAttribute.bind(toggleButton);
  toggleButton.setAttribute = (name, value) => {
    if (name === 'data-kh-sidebar-ready' && value === '') {
      throw new Error('simulated readiness update failure');
    }
    originalSetAttribute(name, value);
  };

  assert.throws(
    () => createController({ sidebar, toggleButton, shell, initialExpanded: false }),
    /simulated readiness update failure/
  );
  assert.equal(toggleButton.listeners.get('click')?.size ?? 0, 0);
  assert.equal(toggleButton.getAttribute('data-kh-sidebar-ready'), null);
  assert.equal(toggleButton.getAttribute('hidden'), '');
  assert.equal(sidebar.hidden, false);
  assert.equal(sidebar.getAttribute('hidden'), null);
  assert.equal(toggleButton.getAttribute('aria-expanded'), 'true');
  assert.equal(shell.classList.contains('kh-app-shell--nav-collapsed'), false);

  toggleButton.setAttribute = originalSetAttribute;
  const retry = createController({ sidebar, toggleButton, shell });
  assert.equal(toggleButton.listeners.get('click')?.size, 1);
  assert.equal(toggleButton.getAttribute('data-kh-sidebar-ready'), '');
  toggleButton.dispatch('click');
  assert.equal(sidebar.hidden, true);
  retry.dispose();
});

test('an initial sidebar state failure restores the visible fallback and permits retry', () => {
  const { shell, sidebar, toggleButton } = createFixture({ initialize: false });
  toggleButton.setAttribute('aria-expanded', 'true');
  toggleButton.setAttribute('hidden', '');
  const originalToggle = shell.classList.toggle.bind(shell.classList);
  let shouldThrow = true;
  shell.classList.toggle = (name, force) => {
    const result = originalToggle(name, force);
    if (shouldThrow) {
      shouldThrow = false;
      throw new Error('simulated shell-state failure');
    }
    return result;
  };

  assert.throws(
    () => createController({ sidebar, toggleButton, shell, initialExpanded: false }),
    /simulated shell-state failure/
  );
  assert.equal(sidebar.hidden, false);
  assert.equal(toggleButton.getAttribute('aria-expanded'), 'true');
  assert.equal(toggleButton.getAttribute('hidden'), '');
  assert.equal(toggleButton.getAttribute('data-kh-sidebar-ready'), null);
  assert.equal(toggleButton.listeners.get('click')?.size ?? 0, 0);
  assert.equal(shell.classList.contains('kh-app-shell--nav-collapsed'), false);

  shell.classList.toggle = originalToggle;
  const retry = createController({ sidebar, toggleButton, shell });
  assert.equal(toggleButton.listeners.get('click')?.size, 1);
  retry.dispose();
});

test('disposal removes listeners and releases the controller even if state restoration throws', () => {
  const { sidebar, shell, toggleButton, controller } = createFixture();
  controller.collapse();
  const originalToggle = shell.classList.toggle;
  shell.classList.toggle = () => { throw new Error('simulated class-list failure'); };

  assert.throws(() => controller.dispose(), /simulated class-list failure/);
  assert.equal(toggleButton.listeners.get('click')?.size ?? 0, 0);
  assert.equal(toggleButton.getAttribute('data-kh-sidebar-ready'), null);
  assert.equal(toggleButton.getAttribute('hidden'), '');
  assert.equal(sidebar.hidden, false);

  shell.classList.toggle = originalToggle;
  const replacement = createController({ sidebar, toggleButton, shell });
  replacement.dispose();
});

test('invalid and disconnected elements fail before registering a listener', () => {
  const { sidebar, toggleButton, controller } = createFixture();
  controller.dispose();

  toggleButton.setAttribute('aria-controls', 'missing-sidebar');
  assert.throws(() => createController({ sidebar, toggleButton }), /aria-controls/);
  assert.equal(toggleButton.listeners.get('click')?.size ?? 0, 0);

  toggleButton.setAttribute('aria-controls', sidebar.id);
  sidebar.isConnected = false;
  assert.throws(() => createController({ sidebar, toggleButton }), /connected/);
  assert.equal(toggleButton.listeners.get('click')?.size ?? 0, 0);
});
