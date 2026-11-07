const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const root = path.join(__dirname, '..', '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('generated tokens, foundation, button component, and guide styles parse as CSS', () => {
  for (const file of [
    'src/css/tokens.css', 'src/css/base.css', 'src/css/components/buttons.css', 'style-guide/styles.css'
  ]) {
    assert.doesNotThrow(() => postcss.parse(read(file), { from: file }), `${file} should parse`);
  }
});

test('base control styling is opt-in and preserves native select appearance', () => {
  const css = postcss.parse(read('src/css/base.css'));
  const controlTags = /(^|[\s,>+~])(?:button|input|select|textarea)(?=$|[\s.#:[,>+~])/i;
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

test('base.css imports the token and button styles in a deterministic order', () => {
  const css = postcss.parse(read('src/css/base.css'));
  const imports = css.nodes.filter((node) => node.type === 'atrule' && node.name === 'import').map((node) => node.params);

  assert.deepEqual(imports, ["url('./tokens.css')", "url('./components/buttons.css')"]);
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
