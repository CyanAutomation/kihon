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

  closest(selector) {
    return selector === '.kh-app-shell' ? this.shell ?? null : null;
  }
}

function createFixture({ expanded = true } = {}) {
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
  sidebar.shell = shell;
  shell.children.add(sidebar);
  const controller = createSidebarController({ sidebar, toggleButton, initialExpanded: expanded });
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

test('collapse moves focus out of navigation before hiding its links', () => {
  const { document, sidebar, toggleButton, link, controller } = createFixture();
  link.focus();
  controller.collapse();

  assert.equal(document.activeElement, toggleButton);
  assert.equal(sidebar.hidden, true);
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
