const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const root = path.join(__dirname, '..', '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('generated tokens and foundation styles parse as CSS', () => {
  for (const file of ['src/css/tokens.css', 'src/css/base.css', 'style-guide/styles.css']) {
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
