const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { parse } = require('yaml');

const root = join(__dirname, '../..');
const packageJson = require('../../package.json');
const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');

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
    'actions/setup-node',
    'actions/upload-artifact'
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

test('CI fails when building changes committed generated outputs', () => {
  const runSteps = readValidationSteps()
    .filter((step) => typeof step.run === 'string')
    .map((step) => step.run.trim());
  const buildIndex = runSteps.indexOf('npm run build');
  const guardIndex = runSteps.indexOf('git diff --exit-code -- src/css/tokens.css src/js/');
  const typecheckIndex = runSteps.indexOf('npm run typecheck');

  assert.ok(buildIndex >= 0, 'CI must build generated outputs');
  assert.ok(guardIndex > buildIndex, 'CI must compare committed generated files after building');
  assert.ok(typecheckIndex > guardIndex, 'the generated-file guard must run before the remaining checks');
});

test('CI runs dependency review and workflow security linting with read-only permissions', () => {
  const workflowConfig = readWorkflowConfig();
  const dependencyReview = workflowConfig.jobs['dependency-review'];
  const workflowAudit = workflowConfig.jobs['workflow-audit'];

  assert.equal(dependencyReview.if, "github.event_name == 'pull_request'");
  assert.deepEqual(dependencyReview.permissions, {
    contents: 'read',
    'pull-requests': 'read'
  });
  assert.ok(dependencyReview.steps.some((step) => step.uses?.startsWith('actions/dependency-review-action@')));
  assert.ok(workflowAudit.steps.some((step) => step.uses?.startsWith('raven-actions/actionlint@')));
  const zizmor = workflowAudit.steps.find((step) => step.uses?.startsWith('zizmorcore/zizmor-action@'));
  assert.ok(zizmor, 'CI must scan workflows with zizmor');
  assert.equal(zizmor.with['advanced-security'], false);
  assert.deepEqual(workflowAudit.permissions, {
    actions: 'read',
    contents: 'read'
  });

  for (const [jobName, job] of Object.entries(workflowConfig.jobs)) {
    for (const step of job.steps || []) {
      if (!step.uses) continue;
      assert.match(step.uses.split('@')[1], /^[a-f0-9]{40}$/, `${jobName}: ${step.uses} must use a full commit SHA`);
    }
  }
});

test('CI installs every configured browser and uploads diagnostics only after failure', () => {
  const validationSteps = readValidationSteps();
  const browserInstall = validationSteps.find((step) => step.run?.startsWith('npx playwright install'));
  assert.ok(browserInstall, 'CI must have an npx playwright install step');
  assert.equal(browserInstall.run, 'npx playwright install --with-deps chromium firefox webkit');

  const artifactUpload = validationSteps.find((step) => step.uses?.startsWith('actions/upload-artifact@'));
  assert.ok(artifactUpload, 'CI must upload Playwright diagnostics');
  assert.equal(artifactUpload.if, 'failure()');
  assert.match(artifactUpload.with.path, /playwright-report\//);
  assert.match(artifactUpload.with.path, /test-results\//);
  assert.equal(artifactUpload.with['if-no-files-found'], 'ignore');
});

test('Dependabot checks npm and GitHub Actions weekly', () => {
  const dependabot = parse(readFileSync(join(root, '.github/dependabot.yml'), 'utf8'));
  assert.equal(dependabot.version, 2);
  assert.deepEqual(dependabot.updates.map(({ 'package-ecosystem': ecosystem, directory, schedule }) => ({
    ecosystem,
    directory,
    interval: schedule.interval
  })), [
    { ecosystem: 'npm', directory: '/', interval: 'weekly' },
    { ecosystem: 'github-actions', directory: '/', interval: 'weekly' }
  ]);
});

test('Playwright covers Chromium, Firefox, and WebKit and retains failure diagnostics', () => {
  const playwrightConfig = require('../../playwright.config');
  assert.deepEqual(
    playwrightConfig.projects.map((project) => project.use.browserName),
    ['chromium', 'firefox', 'webkit']
  );
  assert.equal(playwrightConfig.use.trace, 'retain-on-failure');
  assert.ok(Array.isArray(playwrightConfig.reporter));
  assert.ok(playwrightConfig.reporter.some(([name]) => name === 'html'));
});

test('CI runs with read-only repository permissions', () => {
  const workflowConfig = readWorkflowConfig();
  assert.deepEqual(workflowConfig.permissions, { contents: 'read' });
});
