const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { parse } = require('yaml');

const packageJson = require('../../package.json');
const workflow = readFileSync(join(__dirname, '../../.github/workflows/ci.yml'), 'utf8');

function readWorkflowConfig() {
  return parse(workflow);
}

function readValidationSteps() {
  const steps = readWorkflowConfig()?.jobs?.validation?.steps;
  assert.ok(Array.isArray(steps), 'CI workflow must define the validation job and its steps');
  return steps;
}

test('package metadata and CI select Node 26 or later', () => {
  assert.equal(packageJson.engines.node, '>=26.0.0');
  const validationSteps = readValidationSteps();
  const setupNode = validationSteps.find((step) => step.uses?.startsWith('actions/setup-node@'));
  assert.ok(setupNode, 'CI must configure Node');
  assert.equal(setupNode.with['node-version'], 26);
});

test('CI pins action revisions and does not persist checkout credentials', () => {
  const validationSteps = readValidationSteps();
  const actions = validationSteps.filter((step) => step.uses);
  assert.deepEqual(actions.map((step) => step.uses.split('@')[0]), [
    'actions/checkout',
    'actions/setup-node'
  ]);
  for (const action of actions) {
    assert.match(action.uses.split('@')[1], /^[a-f0-9]{40}$/, `${action.uses} must use a full commit SHA`);
  }
  assert.equal(actions[0].with['persist-credentials'], false);
});

test('CI jobs are bounded and superseded runs are canceled', () => {
  const workflowConfig = readWorkflowConfig();
  assert.ok(workflowConfig.jobs && Object.keys(workflowConfig.jobs).length > 0, 'CI workflow must define jobs');
  for (const [jobName, job] of Object.entries(workflowConfig.jobs)) {
    assert.ok(Number.isInteger(job['timeout-minutes']) && job['timeout-minutes'] > 0, `${jobName} must have a positive timeout`);
  }
  assert.ok(workflowConfig.concurrency, 'CI workflow must define concurrency controls');
  assert.equal(workflowConfig.concurrency['cancel-in-progress'], true);
  assert.match(workflowConfig.concurrency.group, /github\.event\.pull_request\.number \|\| github\.ref/);
});

test('CI builds and typechecks before running the validation suites', () => {
  const validationSteps = readValidationSteps();
  const runSteps = validationSteps.filter((step) => typeof step.run === 'string').map((step) => step.run.trim());
  const requiredOrder = [
    'npm ci',
    'npm run build',
    'npm run typecheck',
    'npm test',
    'npm run test:package'
  ];

  let previousIndex = -1;
  for (const command of requiredOrder) {
    const index = runSteps.indexOf(command);
    assert.notEqual(index, -1, `CI run step is missing: ${command}`);
    assert.ok(index > previousIndex, `${command} must run after the preceding validation step`);
    previousIndex = index;
  }
});

test('CI runs with read-only repository permissions', () => {
  const workflowConfig = readWorkflowConfig();
  assert.deepEqual(workflowConfig.permissions, { contents: 'read' });
});
