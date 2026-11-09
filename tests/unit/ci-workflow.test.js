const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const packageJson = require('../../package.json');
const workflow = readFileSync(join(__dirname, '../../.github/workflows/ci.yml'), 'utf8');

test('package metadata and CI select Node 24 or later', () => {
  assert.equal(packageJson.engines.node, '>=24.0.0');
  assert.match(workflow, /^\s+node-version:\s*24\s*$/m);
});

test('CI pins action revisions and does not persist checkout credentials', () => {
  const actionReferences = [...workflow.matchAll(/^\s*-\s*uses:\s*(actions\/(?:checkout|setup-node))@([a-f0-9]{40})(?:\s+#.*)?\s*$/gm)];
  assert.deepEqual(actionReferences.map(([, action]) => action), [
    'actions/checkout',
    'actions/setup-node'
  ]);
  assert.match(workflow, /^\s+persist-credentials:\s*false\s*$/m);
});

test('CI uses a fixed runner label, a job timeout, and superseded-run cancellation', () => {
  assert.match(workflow, /^\s+runs-on:\s*ubuntu-24\.04\s*$/m);
  assert.match(workflow, /^\s+timeout-minutes:\s*30\s*$/m);
  assert.match(workflow, /^concurrency:\s*$/m);
  assert.match(workflow, /^\s+group:\s*\$\{\{ github\.workflow \}\}-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref \}\}\s*$/m);
  assert.match(workflow, /^\s+cancel-in-progress:\s*true\s*$/m);
});

test('CI builds generated runtime files and checks TypeScript before running tests', () => {
  assert.match(workflow, /^\s*- run: npm ci\s*$/m);
  assert.match(workflow, /^\s*- run: npm run build\s*$/m);
  assert.match(workflow, /^\s*- run: npm run typecheck\s*$/m);
  assert.match(workflow, /^\s*- run: npm test\s*$/m);
  assert.match(workflow, /^\s*- run: npm run test:package\s*$/m);
});

test('CI only validates local package archives and has no publishing permissions', () => {
  assert.match(workflow, /^permissions:\s*\n\s+contents:\s*read\s*$/m);
  assert.doesNotMatch(workflow, /npm publish|packages:\s*write|gh release create/i);
});
