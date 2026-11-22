import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import playwrightConfig from '../../playwright.config.ts';
import packageJson from '../../package.json';

const root = join(__dirname, '../..');
const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');

interface WorkflowStep {
  uses?: string;
  run?: string;
  if?: string;
  with?: Record<string, any>;
}

interface WorkflowJob {
  'timeout-minutes'?: number;
  permissions?: Record<string, string>;
  steps: WorkflowStep[];
  if?: string;
}

interface WorkflowConfig {
  jobs: Record<string, WorkflowJob>;
  on?: { schedule?: Array<{ cron: string }> };
  concurrency: Record<string, any>;
  permissions: Record<string, string>;
}

interface DependabotConfig {
  version: number;
  updates: Array<{
    'package-ecosystem': string;
    directory: string;
    schedule: { interval: string };
    cooldown: { 'default-days': number };
  }>;
}

interface PlaywrightConfigShape {
  webServer?: { command: string; timeout?: number } | Array<{ command: string; timeout?: number }>;
  projects?: Array<{ use?: { browserName?: string } }>;
  use?: { trace?: string };
  reporter?: unknown[];
}

const typedPlaywrightConfig = playwrightConfig as unknown as PlaywrightConfigShape;

function readWorkflowConfig(): WorkflowConfig {
  return parse(workflow) as WorkflowConfig;
}

function readValidationSteps(): WorkflowStep[] {
  const steps = readWorkflowConfig()?.jobs?.validation?.steps;
  assert.ok(Array.isArray(steps), 'CI workflow must define the validation job and its steps');
  return steps;
}

test('package metadata and CI select Node 26 or later', () => {
  assert.equal(packageJson.engines.node, '>=26.0.0');
  const validationSteps = readValidationSteps();
  const setupNode = validationSteps.find((step) => step.uses?.startsWith('actions/setup-node@'));
  assert.ok(setupNode, 'CI must configure Node');
  assert.equal(setupNode.with?.['node-version'], 26);
});

test('typecheck covers Node and browser TypeScript sources', () => {
  assert.match(packageJson.scripts.typecheck, /tsconfig\.node\.json/);
  assert.match(packageJson.scripts.typecheck, /tsconfig\.browser\.json/);
  assert.match(packageJson.scripts.typecheck, /tsconfig\.playwright\.json/);
});

test('the style-guide TypeScript build runs before its preview server', () => {
  assert.equal(packageJson.scripts['build:style-guide'], 'tsx scripts/build-style-guide.ts');
  assert.match(packageJson.scripts.build, /build:style-guide/);
  const webServer = typedPlaywrightConfig.webServer;
  assert.ok(webServer && !Array.isArray(webServer));
  const buildIndex = webServer.command.indexOf('npm run build:style-guide');
  const serverIndex = webServer.command.indexOf('npm run serve');
  assert.ok(buildIndex >= 0, 'Playwright must build the guide before serving it');
  assert.ok(serverIndex > buildIndex, 'the preview server must start after the guide build');
});

test('CI checkouts do not persist repository credentials', () => {
  const workflowConfig = readWorkflowConfig();
  const checkouts = Object.entries(workflowConfig.jobs).flatMap(([jobName, job]) =>
    job.steps
      .filter((step) => step.uses?.startsWith('actions/checkout@'))
      .map((step) => ({ jobName, step }))
  );
  assert.ok(checkouts.length > 0, 'CI must check out the repository');
  for (const { jobName, step } of checkouts) {
    assert.equal(step.with?.['persist-credentials'], false, `${jobName} checkout must not persist credentials`);
  }
});

test('CI jobs are bounded and superseded runs are canceled', () => {
  const workflowConfig = readWorkflowConfig();
  assert.ok(workflowConfig.jobs && Object.keys(workflowConfig.jobs).length > 0, 'CI workflow must define jobs');
  for (const [jobName, job] of Object.entries(workflowConfig.jobs)) {
    const timeout = job['timeout-minutes'];
    assert.ok(Number.isInteger(timeout) && typeof timeout === 'number' && timeout > 0, `${jobName} must have a positive timeout`);
  }
  assert.ok(workflowConfig.concurrency, 'CI workflow must define concurrency controls');
  assert.equal(workflowConfig.concurrency['cancel-in-progress'], true);
  assert.match(workflowConfig.concurrency.group, /github\.event\.pull_request\.number \|\| github\.ref/);
});

test('CI builds and typechecks before running the validation suites', () => {
  const validationSteps = readValidationSteps();
  const runSteps = validationSteps
    .filter((step): step is WorkflowStep & { run: string } => typeof step.run === 'string')
    .map((step) => step.run.trim());
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
    .filter((step): step is WorkflowStep & { run: string } => typeof step.run === 'string')
    .map((step) => step.run.trim());
  const buildIndex = runSteps.indexOf('npm run build');
  const guardIndex = runSteps.indexOf('git diff --exit-code -- src/css/tokens.css src/js/');
  const typecheckIndex = runSteps.indexOf('npm run typecheck');

  assert.ok(buildIndex >= 0, 'CI must build generated outputs');
  assert.ok(guardIndex > buildIndex, 'CI must compare committed generated files after building');
  assert.ok(typecheckIndex > guardIndex, 'the generated-file guard must run before the remaining checks');
});

test('CI runs dependency review and workflow security linting with least-privilege permissions', () => {
  const workflowConfig = readWorkflowConfig();
  const dependencyReview = workflowConfig.jobs['dependency-review'];
  const workflowAudit = workflowConfig.jobs['workflow-audit'];
  assert.ok(dependencyReview && workflowAudit, 'CI must define its dependency and workflow audit jobs');

  assert.equal(dependencyReview.if, "github.event_name == 'pull_request'");
  assert.deepEqual(dependencyReview.permissions, {
    contents: 'read',
    'pull-requests': 'read'
  });
  assert.ok(dependencyReview.steps.some((step) => step.uses?.startsWith('actions/dependency-review-action@')));
  assert.ok(workflowAudit.steps.some((step) => step.uses?.startsWith('raven-actions/actionlint@')));
  const zizmor = workflowAudit.steps.find((step) => step.uses?.startsWith('zizmorcore/zizmor-action@'));
  assert.ok(zizmor, 'CI must scan workflows with zizmor');
  assert.equal(zizmor.with?.['advanced-security'], true);
  assert.deepEqual(workflowAudit.permissions, {
    actions: 'read',
    contents: 'read',
    'security-events': 'write'
  });
});

test('CI runs weekly CodeQL analysis with scoped code-scanning permissions', () => {
  const workflowConfig = readWorkflowConfig();
  const codeql = workflowConfig.jobs.codeql;
  assert.ok(codeql, 'CI must define a CodeQL job');
  assert.deepEqual(workflowConfig.on?.schedule, [{ cron: '15 6 * * 1' }]);
  assert.deepEqual(codeql.permissions, {
    actions: 'read',
    contents: 'read',
    'security-events': 'write'
  });
  assert.ok(codeql.steps.some((step) => step.uses?.startsWith('github/codeql-action/init@')));
  assert.ok(codeql.steps.some((step) => step.uses?.startsWith('github/codeql-action/analyze@')));
  const init = codeql.steps.find((step) => step.uses?.startsWith('github/codeql-action/init@'));
  assert.equal(init?.with?.languages, 'javascript-typescript');
  assert.equal(init?.with?.['build-mode'], 'none');
});

test('CI pins every workflow action to a full commit SHA', () => {
  const workflowConfig = readWorkflowConfig();
  for (const [jobName, job] of Object.entries(workflowConfig.jobs)) {
    for (const step of job.steps || []) {
      if (!step.uses) continue;
      assert.match(step.uses.split('@')[1] ?? '', /^[a-f0-9]{40}$/, `${jobName}: ${step.uses} must use a full commit SHA`);
    }
  }
});

test('CI caches and installs every configured Playwright browser', () => {
  const validationSteps = readValidationSteps();
  const browserCache = validationSteps.find((step) => step.uses?.startsWith('actions/cache@'));
  assert.ok(browserCache, 'CI must cache Playwright browsers');
  assert.equal(browserCache.with?.path, '~/.cache/ms-playwright');
  assert.match(browserCache.with?.key ?? '', /hashFiles\('package-lock\.json'\)/);
  const browserInstall = validationSteps.find((step) => step.run?.startsWith('npx playwright install'));
  assert.ok(browserInstall, 'CI must have an npx playwright install step');
  const installMatch = /^npx playwright install --with-deps\s+(.+)$/.exec(browserInstall.run ?? '');
  assert.ok(installMatch, 'CI must install browsers and their system dependencies');
  const browserList = installMatch[1];
  assert.ok(browserList, 'CI must name the browsers to install');
  const installedBrowsers = browserList.trim().split(/\s+/).sort();
  const configuredBrowsers = (typedPlaywrightConfig.projects ?? []).map((project) => project.use?.browserName);
  assert.ok(configuredBrowsers.length > 0, 'Playwright must define browser projects');
  assert.ok(configuredBrowsers.every((browser): browser is string => typeof browser === 'string'));
  assert.deepEqual([...new Set(installedBrowsers)].sort(), [...new Set(configuredBrowsers as string[])].sort());
});

test('CI uploads browser diagnostics only after a failed validation run', () => {
  const validationSteps = readValidationSteps();
  const artifactUpload = validationSteps.find((step) => step.uses?.startsWith('actions/upload-artifact@'));
  assert.ok(artifactUpload, 'CI must upload Playwright diagnostics');
  assert.equal(artifactUpload.if, 'failure()');
  assert.match(artifactUpload.with?.path ?? '', /playwright-report\//);
  assert.match(artifactUpload.with?.path ?? '', /test-results\//);
  assert.equal(artifactUpload.with?.['if-no-files-found'], 'ignore');
});

test('Dependabot checks npm and GitHub Actions weekly with a cooldown', () => {
  const dependabot = parse(readFileSync(join(root, '.github/dependabot.yml'), 'utf8')) as DependabotConfig;
  assert.equal(dependabot.version, 2);
  assert.deepEqual(dependabot.updates.map(({ 'package-ecosystem': ecosystem, directory, schedule }) => ({
    ecosystem,
    directory,
    interval: schedule.interval
  })), [
    { ecosystem: 'npm', directory: '/', interval: 'weekly' },
    { ecosystem: 'github-actions', directory: '/', interval: 'weekly' }
  ]);
  assert.ok(dependabot.updates.every((update) => update.cooldown['default-days'] === 7));
});

test('Playwright covers Chromium, Firefox, and WebKit and retains failure diagnostics', () => {
  assert.deepEqual(
    typedPlaywrightConfig.projects?.map((project) => project.use?.browserName),
    ['chromium', 'firefox', 'webkit']
  );
  assert.equal(typedPlaywrightConfig.use?.trace, 'retain-on-failure');
  assert.ok(Array.isArray(typedPlaywrightConfig.reporter));
  assert.ok(typedPlaywrightConfig.reporter.some((reporter) => Array.isArray(reporter) && reporter[0] === 'html'));
});

test('CI runs with read-only repository permissions', () => {
  const workflowConfig = readWorkflowConfig();
  assert.deepEqual(workflowConfig.permissions, { contents: 'read' });
});
