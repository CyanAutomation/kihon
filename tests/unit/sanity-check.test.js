const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { collectCssPaths, collectHtmlPaths, runSanityChecks } = require('../../scripts/sanity-check');

async function createFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kihon-css-inventory-'));
  await fs.mkdir(path.join(root, 'src', 'css', 'components'), { recursive: true });
  await fs.mkdir(path.join(root, 'style-guide'), { recursive: true });
  await fs.writeFile(path.join(root, 'src', 'css', 'tokens.css'), ':root { --kh-color-background: white; }\n');
  await fs.writeFile(path.join(root, 'src', 'css', 'base.css'), [
    "@import url('./tokens.css') layer(kh.tokens);",
    "@import url('./components/sidebar.css') layer(kh.components);",
    ''
  ].join('\n'));
  await fs.writeFile(path.join(root, 'src', 'css', 'components', 'sidebar.css'), '.kh-sidebar { display: block; }\n');
  await fs.writeFile(path.join(root, 'style-guide', 'styles.css'), '.example { color: black; }\n');
  await fs.writeFile(path.join(root, 'style-guide', 'index.html'), '<!doctype html><html lang="en"><head><title>Test</title></head><body></body></html>');
  return root;
}

test('CSS validation discovers and parses every component stylesheet in stable order', async () => {
  const paths = collectCssPaths();
  const componentsDirectory = path.resolve(__dirname, '../../src/css/components');
  const diskComponents = (await fs.readdir(componentsDirectory)).filter((file) => file.endsWith('.css')).sort();
  const discovered = paths.filter((file) => path.dirname(file) === componentsDirectory).map((file) => path.basename(file));

  assert.deepEqual(discovered, diskComponents);
  assert.ok(discovered.includes('sidebar.css'));
  assert.ok(paths.includes(path.resolve(__dirname, '../../style-guide/experience/experience.css')));
  const htmlPaths = collectHtmlPaths();
  assert.ok(htmlPaths.includes(path.resolve(__dirname, '../../style-guide/experience/iphone-session.html')));
  assert.ok(htmlPaths.includes(path.resolve(__dirname, '../../style-guide/experience/ipad-library.html')));
  assert.ok(htmlPaths.includes(path.resolve(__dirname, '../../style-guide/experience/macos-analytics.html')));
  assert.deepEqual(await runSanityChecks(), []);
});

test('nested style-guide HTML and CSS are included in validation', async () => {
  const root = await createFixture();
  try {
    const experienceDirectory = path.join(root, 'style-guide', 'experience');
    await fs.mkdir(experienceDirectory, { recursive: true });
    await fs.writeFile(path.join(experienceDirectory, 'example.html'), '<!doctype html><html lang="en"><head><title>Example</title></head><body><img src="sample.png"></body></html>');
    await fs.writeFile(path.join(experienceDirectory, 'experience.css'), '.broken {\n color: red;\n');

    const errors = await runSanityChecks(root);
    assert.ok(errors.some((error) => error.startsWith('style-guide/experience/example.html:')));
    assert.ok(errors.some((error) => error.startsWith('style-guide/experience/experience.css:') && error.includes('CSS parse error')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('a new component stylesheet cannot escape validation or the base import graph', async () => {
  const root = await createFixture();
  try {
    await fs.writeFile(path.join(root, 'src', 'css', 'components', 'new-component.css'), '.broken {\n color: red\n');
    const errors = await runSanityChecks(root);
    assert.ok(errors.some((error) => error.includes('src/css/components/new-component.css:') && error.includes('CSS parse error')));
    assert.ok(errors.some((error) => error.includes('base.css is missing required stylesheet import ./components/new-component.css')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('missing imported CSS is reported as a build-graph error', async () => {
  const root = await createFixture();
  try {
    const basePath = path.join(root, 'src', 'css', 'base.css');
    await fs.appendFile(basePath, "@import url('./components/missing.css') layer(kh.components);\n");
    const errors = await runSanityChecks(root);
    assert.ok(errors.some((error) => error.includes('base.css:3 referenced stylesheet does not exist: ./components/missing.css')));
    assert.ok(errors.every((error) => !error.includes('CSS parse error')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('CSS syntax errors include their file and PostCSS position, while read failures remain filesystem errors', async () => {
  const root = await createFixture();
  try {
    const sidebarPath = path.join(root, 'src', 'css', 'components', 'sidebar.css');
    await fs.writeFile(sidebarPath, '.kh-sidebar {\n  color: red;\n');
    const errors = await runSanityChecks(root);
    assert.ok(errors.some((error) => /^src\/css\/components\/sidebar\.css:\d+:\d+ CSS parse error:/.test(error)));

    await fs.rm(path.join(root, 'src', 'css', 'tokens.css'));
    await assert.rejects(runSanityChecks(root), { code: 'ENOENT' });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
