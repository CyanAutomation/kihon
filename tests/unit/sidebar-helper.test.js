const test = require('node:test');
const assert = require('node:assert/strict');
const { createSidebarController } = require('../../src/js/sidebar.js');

class FakeClassList {
  values = new Set();

  toggle(name, force) {
    const enabled = force ?? !this.values.has(name);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeDocument {
  elements = new Map();
  activeElement = null;

  getElementById(id) {
    return this.elements.get(id) ?? null;
  }
}

class FakeElement {
  attributes = new Map();
  children = new Set();
  listeners = new Map();
  classList = new FakeClassList();
  hidden = false;
  isConnected = true;
  textContent = '';
  type = '';
  nodeType = 1;

  constructor(ownerDocument, localName, id = '') {
    this.ownerDocument = ownerDocument;
    this.localName = localName;
    this.id = id;
    if (id) ownerDocument.elements.set(id, this);
  }

  addEventListener(type, listener) {
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(listener);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type) {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  contains(element) {
    return element === this || this.children.has(element);
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  blur() {
    if (this.ownerDocument.activeElement === this) this.ownerDocument.activeElement = null;
  }

  closest(selector) {
    return selector === '.kh-app-shell' ? this.shell ?? null : null;
  }
}

function createFixture({ expanded = true, passShell = false, autoDetectShell = true, initialize = true } = {}) {
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
  const options = { sidebar, toggleButton, initialExpanded: expanded };
  if (passShell) options.shell = shell;
  const controller = initialize ? createSidebarController(options) : null;
  return { document, shell, sidebar, toggleButton, link, controller };
}

test('controller synchronizes visibility, ARIA state, and app-shell tracks idempotently', () => {
  const { shell, sidebar, toggleButton, controller } = createFixture();
  assert.equal(sidebar.hidden, false);
  assert.equal(toggleButton.getAttribute('aria-expanded'), 'true');
  assert.equal(toggleButton.getAttribute('data-kh-sidebar-ready'), '');
  assert.equal(toggleButton.getAttribute('hidden'), null);
  assert.equal(toggleButton.listeners.get('click').size, 1);

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
  assert.equal(toggleButton.listeners.get('click').size, 0);
  assert.equal(shell.classList.contains('kh-app-shell--nav-collapsed'), false);

  toggleButton.dispatch('click');
  assert.equal(sidebar.hidden, false);
  assert.doesNotThrow(() => controller.dispose());
  assert.throws(() => controller.toggle(), /disposed/);
});

test('repeated initialization is rejected and disposal permits a new controller', () => {
  const { sidebar, toggleButton, controller } = createFixture();
  assert.throws(() => createSidebarController({ sidebar, toggleButton }), /already active/);
  assert.equal(toggleButton.listeners.get('click').size, 1);

  controller.dispose();
  const replacement = createSidebarController({ sidebar, toggleButton });
  assert.equal(toggleButton.listeners.get('click').size, 1);
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
    () => createSidebarController({ sidebar, toggleButton, shell, initialExpanded: false }),
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
  const retry = createSidebarController({ sidebar, toggleButton, shell });
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
    () => createSidebarController({ sidebar, toggleButton, shell, initialExpanded: false }),
    /simulated shell-state failure/
  );
  assert.equal(sidebar.hidden, false);
  assert.equal(toggleButton.getAttribute('aria-expanded'), 'true');
  assert.equal(toggleButton.getAttribute('hidden'), '');
  assert.equal(toggleButton.getAttribute('data-kh-sidebar-ready'), null);
  assert.equal(toggleButton.listeners.get('click')?.size ?? 0, 0);
  assert.equal(shell.classList.contains('kh-app-shell--nav-collapsed'), false);

  shell.classList.toggle = originalToggle;
  const retry = createSidebarController({ sidebar, toggleButton, shell });
  assert.equal(toggleButton.listeners.get('click')?.size, 1);
  retry.dispose();
});

test('disposal removes listeners and releases the controller even if state restoration throws', () => {
  const { sidebar, shell, toggleButton, controller } = createFixture();
  controller.collapse();
  const originalToggle = shell.classList.toggle;
  shell.classList.toggle = () => { throw new Error('simulated class-list failure'); };

  assert.throws(() => controller.dispose(), /simulated class-list failure/);
  assert.equal(toggleButton.listeners.get('click').size, 0);
  assert.equal(toggleButton.getAttribute('data-kh-sidebar-ready'), null);
  assert.equal(toggleButton.getAttribute('hidden'), '');
  assert.equal(sidebar.hidden, false);

  shell.classList.toggle = originalToggle;
  const replacement = createSidebarController({ sidebar, toggleButton, shell });
  replacement.dispose();
});

test('invalid and disconnected elements fail before registering a listener', () => {
  const { sidebar, toggleButton, controller } = createFixture();
  controller.dispose();

  toggleButton.setAttribute('aria-controls', 'missing-sidebar');
  assert.throws(() => createSidebarController({ sidebar, toggleButton }), /aria-controls/);
  assert.equal(toggleButton.listeners.get('click').size, 0);

  toggleButton.setAttribute('aria-controls', sidebar.id);
  sidebar.isConnected = false;
  assert.throws(() => createSidebarController({ sidebar, toggleButton }), /connected/);
  assert.equal(toggleButton.listeners.get('click').size, 0);
});
