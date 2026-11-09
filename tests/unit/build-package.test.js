const test = require('node:test');
const assert = require('node:assert/strict');
const { buildJavaScriptOutput } = require('../../scripts/build-package');

test('unsupported JavaScript package formats fail with a clear build error', async () => {
  for (const format of ['umd', 'toString', '__proto__']) {
    await assert.rejects(
      buildJavaScriptOutput({ name: 'dialogs', globalName: 'KihonDialogs' }, format),
      { message: `Unknown build format: ${format}. Expected one of: esm, cjs, browser.` }
    );
  }
});
