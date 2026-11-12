const test = require('node:test');
const assert = require('node:assert/strict');
const { buildJavaScriptOutput, getPackageOutputs } = require('../../scripts/build-package');

test('unsupported JavaScript package formats fail with a clear build error', async () => {
  for (const format of ['umd', 'toString', '__proto__']) {
    await assert.rejects(
      buildJavaScriptOutput({ name: 'dialogs', globalName: 'KihonDialogs' }, format),
      { message: `Unknown build format: ${format}. Expected one of: esm, cjs, browser.` }
    );
  }
});

test('bundled stylesheet preserves the declared cascade layers', async () => {
  const outputs = await getPackageOutputs();
  const stylesheet = outputs.find((output) => output.path.endsWith('styles.css'));
  assert.ok(stylesheet, 'package build produces its stylesheet');

  const css = Buffer.from(stylesheet.contents).toString('utf8');
  assert.match(css, /^@layer kh\.tokens, kh\.base, kh\.components;/);
  assert.match(css, /@layer kh\.tokens\s*\{/);
  assert.match(css, /@layer kh\.components\s*\{/);
  assert.match(css, /@layer kh\.base\s*\{/);
  assert.doesNotMatch(css, /@import\s/);
});

test('legacy compatibility stylesheet unwraps layers while preserving component rules', async () => {
  const outputs = await getPackageOutputs();
  const stylesheet = outputs.find((output) => output.path.endsWith('styles.compat.css'));
  assert.ok(stylesheet, 'package build produces an unlayered compatibility stylesheet');

  const css = Buffer.from(stylesheet.contents).toString('utf8');
  assert.doesNotMatch(css, /@layer\s/);
  assert.match(css, /\.kh-button--primary/);
  assert.match(css, /--kh-color-accent/);
});
