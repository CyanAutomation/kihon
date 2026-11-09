const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const root = path.join(__dirname, '..', '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('generated tokens, foundation, component, and guide styles parse as CSS', () => {
  for (const file of [
    'src/css/tokens.css', 'src/css/base.css', 'src/css/components/buttons.css',
    'src/css/components/forms.css', 'src/css/components/settings.css', 'src/css/components/app-shell.css',
    'src/css/components/dialogs.css', 'src/css/components/sidebar.css',
    'src/css/components/page-header.css', 'src/css/components/toolbar.css', 'style-guide/styles.css'
  ]) {
    assert.doesNotThrow(() => postcss.parse(read(file), { from: file }), `${file} should parse`);
  }
});

test('base control styling is opt-in and preserves native select appearance', () => {
  const css = postcss.parse(read('src/css/base.css'));
  const controlTags = /(^|[\s,>+~])(?:button|input|select|textarea|label|fieldset|legend)(?=$|[\s.#:[,>+~])/i;
  const unsafeRules = [];

  css.walkRules((rule) => {
    if (rule.selectors?.some((selector) => controlTags.test(selector) && !selector.includes('.kh-'))) {
      unsafeRules.push(rule.selector);
    }
  });

  assert.deepEqual(unsafeRules, []);
  assert.doesNotMatch(read('src/css/base.css'), /font-size:\s*16px\s*;/);
  assert.doesNotMatch(read('src/css/base.css'), /appearance:\s*none\s*;/);
  assert.doesNotMatch(read('src/css/base.css'), /outline:\s*none\s*;/);
});

test('base.css imports tokens and components in a deterministic order', () => {
  const css = postcss.parse(read('src/css/base.css'));
  const imports = css.nodes.filter((node) => node.type === 'atrule' && node.name === 'import').map((node) => node.params);

  assert.deepEqual(imports, [
    "url('./tokens.css')", "url('./components/buttons.css')",
    "url('./components/forms.css')", "url('./components/settings.css')",
    "url('./components/dialogs.css')", "url('./components/app-shell.css')",
    "url('./components/sidebar.css')", "url('./components/page-header.css')",
    "url('./components/toolbar.css')"
  ]);
});

test('dialog styles are opt-in, namespaced, token-based, and expose the documented API', () => {
  const css = postcss.parse(read('src/css/components/dialogs.css'));
  const selectors = [];
  const declarations = [];
  css.walkRules((rule) => selectors.push(...(rule.selectors || [])));
  css.walkDecls((decl) => declarations.push(decl));

  for (const selector of selectors) {
    assert.match(selector, /\.kh-dialog/, `dialog selector must be opt-in: ${selector}`);
    assert.doesNotMatch(selector, /\.kh-sg-/i, `dialog component CSS must not depend on the guide: ${selector}`);
  }

  for (const decl of declarations) {
    assert.doesNotMatch(decl.value, /#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i, `hard-coded colour in ${decl.prop}`);
  }

  for (const selector of [
    '.kh-dialog', '.kh-dialog__header', '.kh-dialog__title', '.kh-dialog__description',
    '.kh-dialog__body', '.kh-dialog__footer', '.kh-dialog--sm', '.kh-dialog--lg',
    'dialog.kh-dialog::backdrop'
  ]) {
    assert.ok(selectors.some((candidate) => candidate.includes(selector)), `missing selector ${selector}`);
  }
});

test('form and settings styles expose opt-in classes without global control resets', () => {
  const forms = postcss.parse(read('src/css/components/forms.css'));
  const settings = postcss.parse(read('src/css/components/settings.css'));
  const formSelectors = [];
  const settingsSelectors = [];
  forms.walkRules((rule) => formSelectors.push(...(rule.selectors || [])));
  settings.walkRules((rule) => settingsSelectors.push(...(rule.selectors || [])));

  for (const selector of [...formSelectors, ...settingsSelectors]) {
    assert.match(selector, /\.kh-[\w-]+/, `component selector must be opt-in: ${selector}`);
    assert.doesNotMatch(selector, /\.kh-sg-/i, `component CSS must not depend on the guide: ${selector}`);
  }

  const globalSelectors = [...formSelectors, ...settingsSelectors].filter((selector) =>
    /^(?:input|select|textarea|button|fieldset|legend)(?:$|[\s:[.#])/i.test(selector.trim())
  );
  assert.deepEqual(globalSelectors, []);
  assert.doesNotMatch(read('src/css/components/forms.css'), /appearance\s*:\s*none/i);
  for (const file of ['src/css/components/forms.css', 'src/css/components/settings.css']) {
    assert.doesNotMatch(read(file), /#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i, `${file} must use semantic color tokens`);
  }

  for (const selector of [
    '.kh-field', '.kh-label', '.kh-label--choice', '.kh-help', '.kh-error', '.kh-required',
    '.kh-input', '.kh-textarea', '.kh-select', '.kh-checkbox', '.kh-radio',
    '.kh-fieldset', '.kh-legend'
  ]) {
    assert.ok(formSelectors.some((candidate) => candidate.includes(selector)), `missing selector ${selector}`);
  }

  for (const selector of [
    '.kh-settings-group', '.kh-settings-heading', '.kh-settings-description',
    '.kh-settings-list', '.kh-settings-row', '.kh-settings-row-content',
    '.kh-settings-row-title', '.kh-settings-row-description', '.kh-settings-row-control'
  ]) {
    assert.ok(settingsSelectors.some((candidate) => candidate.includes(selector)), `missing selector ${selector}`);
  }
});

test('button component exposes namespaced variants, sizes, states, and token-based colours', () => {
  const css = postcss.parse(read('src/css/components/buttons.css'));
  const rules = [];
  css.walkRules((rule) => {
    if (rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return;
    rules.push(rule);
  });

  const selectors = rules.flatMap((rule) => rule.selectors || []);
  const requiredSelectors = [
    '.kh-button', '.kh-button--primary', '.kh-button--secondary', '.kh-button--quiet',
    '.kh-button--destructive', '.kh-button--sm', '.kh-button--md', '.kh-button--lg',
    '.kh-button:active:not(:disabled)', '.kh-button:focus-visible', '.kh-button:disabled',
    '.kh-button--loading::before'
  ];

  for (const selector of requiredSelectors) {
    assert.ok(selectors.some((candidate) => candidate.includes(selector)), `missing selector ${selector}`);
  }

  for (const selector of selectors) {
    assert.match(selector, /^button\.kh-/i, `component selector must target a namespaced native button: ${selector}`);
    assert.doesNotMatch(selector, /\.kh-sg-/i, `component selector must not depend on the style guide: ${selector}`);
    assert.doesNotMatch(selector, /(^|[\s>+~,])button(?!\.kh-[\w-]+)/i, `unclassed button selector: ${selector}`);
  }

  const declarations = [];
  css.walkDecls((decl) => declarations.push(decl));
  for (const decl of declarations) {
    assert.doesNotMatch(decl.value, /#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i, `hard-coded colour in ${decl.prop}`);
  }
  assert.ok(declarations.some((decl) => decl.prop === 'background-color' && decl.value.includes('var(--kh-color-accent)')));
  assert.ok(declarations.some((decl) => decl.prop === 'outline' && decl.value.includes('var(--kh-color-focus-ring)')));
});

test('application-shell styles are opt-in, token-based, responsive, and independent of guide CSS', () => {
  const css = postcss.parse(read('src/css/components/app-shell.css'));
  const selectors = [];
  const declarations = [];
  css.walkRules((rule) => selectors.push(...(rule.selectors || [])));
  css.walkDecls((decl) => declarations.push(decl));

  for (const selector of selectors) {
    assert.match(selector, /^\.kh-app-shell/, `shell selector must be namespaced: ${selector}`);
    assert.doesNotMatch(selector, /\.kh-sg-/i, `component CSS must not depend on the guide: ${selector}`);
  }
  for (const decl of declarations) {
    assert.doesNotMatch(decl.value, /#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i, `hard-coded colour in ${decl.prop}`);
  }

  for (const selector of [
    '.kh-app-shell', '.kh-app-shell__header', '.kh-app-shell__nav', '.kh-app-shell__main',
    '.kh-app-shell__details', '.kh-app-shell--with-nav', '.kh-app-shell--with-details',
    '.kh-app-shell--with-nav-and-details', '.kh-app-shell--nav-collapsed', '.kh-app-shell--compact',
    '.kh-app-shell__nav[hidden]'
  ]) {
    assert.ok(selectors.some((candidate) => candidate.includes(selector)), `missing selector ${selector}`);
  }
  assert.ok(declarations.some((decl) => decl.prop === 'grid-template-columns'));
  assert.ok(declarations.some((decl) => decl.value.includes('var(--kh-color-border-subtle)')));
  assert.ok(css.nodes.some((node) => node.type === 'atrule' && node.name === 'media' && node.params.includes('56rem')));
  assert.doesNotMatch(read('src/css/components/app-shell.css'), /overflow:\s*hidden/i);
});

test('page-header and toolbar styles are opt-in, namespaced, token-based, and presentational', () => {
  const components = [
    {
      file: 'src/css/components/page-header.css',
      classes: [
        '.kh-page-header', '.kh-page-header__content', '.kh-page-header__title',
        '.kh-page-header__description', '.kh-page-header__actions', '.kh-page-header__meta'
      ]
    },
    {
      file: 'src/css/components/toolbar.css',
      classes: [
        '.kh-toolbar', '.kh-toolbar__group', '.kh-toolbar__group--end',
        '.kh-toolbar__separator', '.kh-toolbar__label'
      ]
    }
  ];

  for (const component of components) {
    const css = postcss.parse(read(component.file));
    const selectors = [];
    const declarations = [];
    css.walkRules((rule) => selectors.push(...(rule.selectors || [])));
    css.walkDecls((decl) => declarations.push(decl));

    for (const selector of selectors) {
      assert.match(selector, /^\.kh-(?:page-header|toolbar)/, `selector must be public and namespaced: ${selector}`);
      assert.doesNotMatch(selector, /\.kh-sg-/i, `component CSS must not depend on the guide: ${selector}`);
      assert.doesNotMatch(selector, /(^|[\s>+~,])(?:h[1-6]|button|input|select)(?![\w-])/i, `component CSS must not reset global elements: ${selector}`);
    }
    for (const decl of declarations) {
      assert.doesNotMatch(decl.value, /#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i, `hard-coded colour in ${component.file}`);
    }
    for (const className of component.classes) {
      assert.ok(selectors.some((selector) => selector.includes(className)), `missing selector ${className}`);
    }
    assert.ok(css.nodes.some((node) => node.type === 'atrule' && node.name === 'media' && node.params.includes('forced-colors')));
    assert.ok(declarations.some((decl) => decl.value.includes('var(--kh-space-')));
    assert.ok(declarations.some((decl) => decl.value.includes('var(--kh-type-')));
  }

  assert.doesNotMatch(read('src/css/components/toolbar.css'), /role\s*=\s*["']toolbar/i);
  assert.doesNotMatch(read('src/css/components/page-header.css'), /<main/i);
});

test('sidebar styles are opt-in, token-based, semantic, and independent of the guide', () => {
  const css = postcss.parse(read('src/css/components/sidebar.css'));
  const selectors = [];
  const declarations = [];
  css.walkRules((rule) => selectors.push(...(rule.selectors || [])));
  css.walkDecls((decl) => declarations.push(decl));

  for (const selector of selectors) {
    assert.match(selector, /\.kh-sidebar/, `sidebar selector must be namespaced: ${selector}`);
    assert.doesNotMatch(selector, /\.kh-sg-/i, `component CSS must not depend on the guide: ${selector}`);
  }
  for (const decl of declarations) {
    assert.doesNotMatch(decl.value, /#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i, `hard-coded colour in ${decl.prop}`);
  }

  for (const selector of [
    '.kh-sidebar', '.kh-sidebar__header', '.kh-sidebar__section', '.kh-sidebar__section-title',
    '.kh-sidebar__list', '.kh-sidebar__item', '.kh-sidebar__link',
    '.kh-sidebar__link[aria-current="page"]', '.kh-sidebar__icon', '.kh-sidebar__label',
    '.kh-sidebar__description', '.kh-sidebar__footer', '.kh-sidebar[hidden]',
    'button.kh-sidebar-toggle:not([data-kh-sidebar-ready])'
  ]) {
    assert.ok(selectors.some((candidate) => candidate.includes(selector)), `missing selector ${selector}`);
  }
  assert.ok(declarations.some((decl) => decl.value.includes('var(--kh-color-surface)')));
  assert.ok(declarations.some((decl) => decl.value.includes('var(--kh-color-focus-ring)')));
  assert.ok(css.nodes.some((node) => node.type === 'atrule' && node.name === 'media' && node.params.includes('prefers-reduced-motion')));
  assert.ok(css.nodes.some((node) => node.type === 'atrule' && node.name === 'media' && node.params.includes('forced-colors')));
  assert.doesNotMatch(read('src/css/components/sidebar.css'), /role\s*=\s*["'](?:menu|menuitem|tree)/i);
});
