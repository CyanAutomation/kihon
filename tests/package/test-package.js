#!/usr/bin/env node

const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const esbuild = require('esbuild');
const postcss = require('postcss');
const packageJson = require('../../package.json');

const ROOT = path.join(__dirname, '..', '..');
const PACKAGE_NAME = '@cyanautomation/kihon';
const EXPECTED_FILES = [
  'dist/browser/dialogs.global.js',
  'dist/browser/sidebar.global.js',
  'dist/cjs/dialogs.cjs',
  'dist/cjs/sidebar.cjs',
  'dist/esm/dialogs.mjs',
  'dist/esm/sidebar.mjs',
  'dist/styles.css',
  'dist/types/dialogs.d.cts',
  'dist/types/dialogs.d.mts',
  'dist/types/sidebar.d.cts',
  'dist/types/sidebar.d.mts'
];

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    ...options
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with exit code ${result.status}.`,
      result.stdout,
      result.stderr
    ].filter(Boolean).join('\n'));
  }
  return result.stdout;
}

function packagePaths(exportsField) {
  const paths = [];
  const visit = (entry) => {
    if (typeof entry === 'string') paths.push(entry);
    else if (entry && typeof entry === 'object') Object.values(entry).forEach(visit);
  };
  Object.values(exportsField).forEach(visit);
  return paths;
}

function parsePackResult(stdout) {
  const start = stdout.indexOf('[');
  if (start < 0) throw new Error(`npm pack did not return JSON: ${stdout}`);
  return JSON.parse(stdout.slice(start));
}

async function writeConsumerFixtures(consumerRoot) {
  await fs.writeFile(path.join(consumerRoot, 'package.json'), JSON.stringify({
    name: 'kihon-local-package-consumer',
    private: true,
    type: 'module'
  }, null, 2));

  await fs.writeFile(path.join(consumerRoot, 'consumer.mjs'), `
import assert from 'node:assert/strict';
import { openDialog, closeDialog, disposeDialog } from '${PACKAGE_NAME}/dialogs';
import { createSidebarController } from '${PACKAGE_NAME}/sidebar';

assert.equal(typeof openDialog, 'function');
assert.equal(typeof closeDialog, 'function');
assert.equal(typeof disposeDialog, 'function');
assert.equal(typeof createSidebarController, 'function');
assert.throws(() => openDialog({}), TypeError);
assert.throws(() => createSidebarController(null), TypeError);
assert.match(import.meta.resolve('${PACKAGE_NAME}/styles.css'), /\\/dist\\/styles\\.css$/);
assert.throws(() => import.meta.resolve('${PACKAGE_NAME}/src/ts/dialogs.ts'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
assert.throws(() => import.meta.resolve('${PACKAGE_NAME}/dist/esm/dialogs.mjs'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
await assert.rejects(import('${PACKAGE_NAME}'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
`);

  await fs.writeFile(path.join(consumerRoot, 'consumer.cjs'), `
const assert = require('node:assert/strict');
const { openDialog, closeDialog, disposeDialog } = require('${PACKAGE_NAME}/dialogs');
const { createSidebarController } = require('${PACKAGE_NAME}/sidebar');

assert.equal(typeof openDialog, 'function');
assert.equal(typeof closeDialog, 'function');
assert.equal(typeof disposeDialog, 'function');
assert.equal(typeof createSidebarController, 'function');
assert.throws(() => openDialog({}), TypeError);
assert.throws(() => createSidebarController(null), TypeError);
assert.match(require.resolve('${PACKAGE_NAME}/styles.css'), /\\/dist\\/styles\\.css$/);
assert.throws(() => require.resolve('${PACKAGE_NAME}/src/ts/dialogs.ts'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
assert.throws(() => require.resolve('${PACKAGE_NAME}/dist/cjs/dialogs.cjs'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
assert.throws(() => require.resolve('${PACKAGE_NAME}'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
`);

  const typeRoot = path.join(consumerRoot, 'type-consumers');
  const nodeNextRoot = path.join(typeRoot, 'nodenext');
  const bundlerRoot = path.join(typeRoot, 'bundler');
  await fs.mkdir(nodeNextRoot, { recursive: true });
  await fs.mkdir(bundlerRoot, { recursive: true });
  await fs.writeFile(path.join(nodeNextRoot, 'consumer.mts'), `
import { closeDialog, disposeDialog, openDialog, type DialogOpenOptions, type KihonDialogsAPI } from '${PACKAGE_NAME}/dialogs';
import { createSidebarController, type KihonSidebarAPI, type SidebarController, type SidebarOptions } from '${PACKAGE_NAME}/sidebar';

declare const dialog: HTMLDialogElement;
declare const button: HTMLButtonElement;
declare const nav: HTMLElement;
const options: DialogOpenOptions = { trigger: button, initialFocus: button };
openDialog(dialog, options);
closeDialog(dialog, 'saved');
disposeDialog(dialog);
const sidebarOptions: SidebarOptions = { sidebar: nav, toggleButton: button, initialExpanded: true };
const controller: SidebarController = createSidebarController(sidebarOptions);
const dialogsApi: KihonDialogsAPI = { openDialog, closeDialog, disposeDialog };
const sidebarApi: KihonSidebarAPI = { createSidebarController };
window.KihonDialogs?.openDialog(dialog, options);
window.KihonSidebar?.createSidebarController(sidebarOptions);
controller.expand();
controller.collapse();
controller.toggle();
controller.dispose();
// @ts-expect-error dialogs require a native HTMLDialogElement
openDialog({});
// @ts-expect-error dialog results are strings
closeDialog(dialog, 42);
// @ts-expect-error the sidebar toggle must be a native button
createSidebarController({ sidebar: nav, toggleButton: nav });
void dialogsApi;
void sidebarApi;
`);
  await fs.writeFile(path.join(nodeNextRoot, 'consumer.cts'), `
import dialogs = require('${PACKAGE_NAME}/dialogs');
import sidebar = require('${PACKAGE_NAME}/sidebar');
import type { KihonDialogsAPI } from '${PACKAGE_NAME}/dialogs';
import type { KihonSidebarAPI } from '${PACKAGE_NAME}/sidebar';

declare const dialog: HTMLDialogElement;
declare const nav: HTMLElement;
declare const button: HTMLButtonElement;
dialogs.openDialog(dialog);
dialogs.closeDialog(dialog);
const controller = sidebar.createSidebarController({ sidebar: nav, toggleButton: button });
const dialogsApi: KihonDialogsAPI = dialogs;
const sidebarApi: KihonSidebarAPI = sidebar;
controller.dispose();
void dialogsApi;
void sidebarApi;
`);
  await fs.writeFile(path.join(nodeNextRoot, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      types: [],
      lib: ['ES2022', 'DOM', 'DOM.Iterable']
    },
    include: ['consumer.mts', 'consumer.cts']
  }, null, 2));

  await fs.writeFile(path.join(bundlerRoot, 'consumer.ts'), `
import { openDialog, type DialogOpenOptions } from '${PACKAGE_NAME}/dialogs';
import { createSidebarController } from '${PACKAGE_NAME}/sidebar';

declare const dialog: HTMLDialogElement;
declare const button: HTMLButtonElement;
declare const nav: HTMLElement;
const options: DialogOpenOptions = { trigger: button };
openDialog(dialog, options);
createSidebarController({ sidebar: nav, toggleButton: button }).toggle();
// @ts-expect-error the dialog parameter is required
openDialog();
`);
  await fs.writeFile(path.join(bundlerRoot, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      types: [],
      lib: ['ES2022', 'DOM', 'DOM.Iterable']
    },
    include: ['consumer.ts']
  }, null, 2));

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="./node_modules/${PACKAGE_NAME}/dist/styles.css">
    <title>Kihon package consumer</title>
  </head>
  <body>
    <div id="shell" class="kh-app-shell kh-app-shell--with-nav">
      <header class="kh-app-shell__header">
        <button id="sidebar-toggle" class="kh-button kh-button--secondary" type="button"
          aria-controls="primary-navigation" aria-expanded="false" hidden>Toggle navigation</button>
      </header>
      <nav id="primary-navigation" class="kh-sidebar" aria-label="Primary navigation">
        <ul class="kh-sidebar__list">
          <li class="kh-sidebar__item"><a class="kh-sidebar__link" href="#main" aria-current="page">Home</a></li>
          <li class="kh-sidebar__item"><a class="kh-sidebar__link" href="#main">Settings</a></li>
        </ul>
      </nav>
      <main id="main" class="kh-app-shell__main">
        <header class="kh-page-header">
          <div class="kh-page-header__content">
            <h1 class="kh-page-header__title">Package consumer</h1>
            <p class="kh-page-header__description">Styles and helpers loaded from the archive.</p>
          </div>
          <div class="kh-page-header__actions">
            <button id="open-dialog" class="kh-button" type="button">Open dialog</button>
          </div>
        </header>
        <section class="kh-surface">
          <label class="kh-field"><span class="kh-label">Project name</span>
            <input class="kh-input" value="Kihon"></label>
        </section>
        <dialog id="test-dialog" class="kh-dialog" aria-labelledby="dialog-title">
          <header class="kh-dialog__header"><h2 id="dialog-title" class="kh-dialog__title">Native dialog</h2></header>
          <div class="kh-dialog__body"><button id="close-dialog" class="kh-button" type="button">Close</button></div>
        </dialog>
      </main>
    </div>
    <script src="./node_modules/${PACKAGE_NAME}/dist/browser/dialogs.global.js"></script>
    <script src="./node_modules/${PACKAGE_NAME}/dist/browser/sidebar.global.js"></script>
    <script>
      window.sidebarController = window.KihonSidebar.createSidebarController({
        sidebar: document.getElementById('primary-navigation'),
        toggleButton: document.getElementById('sidebar-toggle'),
        initialExpanded: true
      });
      const dialog = document.getElementById('test-dialog');
      const openButton = document.getElementById('open-dialog');
      openButton.addEventListener('click', () => window.KihonDialogs.openDialog(dialog, {
        trigger: openButton,
        initialFocus: document.getElementById('close-dialog')
      }));
      document.getElementById('close-dialog').addEventListener('click', () => window.KihonDialogs.closeDialog(dialog, 'done'));
    </script>
  </body>
</html>`;
  await fs.writeFile(path.join(consumerRoot, 'index.html'), html);
}

async function buildConsumerCss(consumerRoot) {
  const entryPoint = path.join(consumerRoot, 'consumer.css');
  const bundlePath = path.join(consumerRoot, 'consumer-bundle.css');
  await fs.writeFile(entryPoint, `@import "${PACKAGE_NAME}/styles.css";\n`);
  await esbuild.build({
    absWorkingDir: consumerRoot,
    entryPoints: [entryPoint],
    outfile: bundlePath,
    bundle: true,
    minify: false,
    logLevel: 'silent'
  });
  const bundle = await fs.readFile(bundlePath, 'utf8');
  assert.doesNotMatch(bundle, /@import\b/i, 'the application CSS build should resolve the package export');
  assert.doesNotMatch(bundle, /(?:^|[\\/])src[\\/]css[\\/]/, 'the CSS bundle must not refer back to Kihon source files');
  postcss.parse(bundle, { from: bundlePath });

  const indexHtml = await fs.readFile(path.join(consumerRoot, 'index.html'), 'utf8');
  const bundledHtml = indexHtml.replace(
    `./node_modules/${PACKAGE_NAME}/dist/styles.css`,
    './consumer-bundle.css'
  );
  assert.notEqual(bundledHtml, indexHtml, 'the browser fixture should reference its application-built CSS file');
  await fs.writeFile(path.join(consumerRoot, 'bundled.html'), bundledHtml);
}

async function verifyBrowserConsumer(consumerRoot) {
  const { chromium } = require('playwright');
  const launchOptions = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const browser = await chromium.launch(launchOptions);
  const server = http.createServer(async (request, response) => {
    try {
      const requestPath = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).replace(/^\/+/, '') || 'index.html';
      const filePath = path.resolve(consumerRoot, requestPath);
      if (filePath !== consumerRoot && !filePath.startsWith(`${consumerRoot}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const contents = await fs.readFile(filePath);
      const extension = path.extname(filePath);
      const contentType = {
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.mjs': 'text/javascript; charset=utf-8'
      }[extension] || 'application/octet-stream';
      response.writeHead(200, { 'content-type': contentType });
      response.end(contents);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const consumerUrl = `http://127.0.0.1:${address.port}/index.html`;
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(consumerUrl);

    assert.equal(await page.evaluate(() => typeof window.KihonDialogs.openDialog), 'function');
    assert.equal(await page.evaluate(() => typeof window.KihonSidebar.createSidebarController), 'function');
    await page.evaluate(() => { document.documentElement.dataset.khTheme = 'light'; });
    const stylesheetState = await page.evaluate(() => {
      const button = document.querySelector('.kh-button');
      const input = document.querySelector('.kh-input');
      return {
        sheetCount: document.styleSheets.length,
        buttonPadding: getComputedStyle(button).paddingInlineStart,
        inputBorderRadius: getComputedStyle(input).borderTopLeftRadius,
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        backgroundToken: getComputedStyle(document.documentElement).getPropertyValue('--kh-color-background').trim()
      };
    });
    assert.ok(stylesheetState.sheetCount > 0, 'the packaged stylesheet should load');
    assert.notEqual(stylesheetState.buttonPadding, '0px', 'button component styles should apply');
    assert.notEqual(stylesheetState.inputBorderRadius, '0px', 'form component styles should apply');
    assert.ok(stylesheetState.backgroundToken, 'the packaged stylesheet should include design tokens');
    assert.notEqual(stylesheetState.bodyBackground, 'rgba(0, 0, 0, 0)', 'base body styles should apply');

    const lightBackground = stylesheetState.backgroundToken;
    const darkBackground = await page.evaluate(() => {
      document.documentElement.dataset.khTheme = 'dark';
      return getComputedStyle(document.documentElement).getPropertyValue('--kh-color-background').trim();
    });
    assert.notEqual(lightBackground, darkBackground, `light and dark token themes should both be included (${lightBackground} vs ${darkBackground})`);

    const toggle = page.locator('#sidebar-toggle');
    await toggle.focus();
    await page.keyboard.press('Enter');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('#primary-navigation').isHidden(), true);
    await page.keyboard.press('Enter');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('#primary-navigation').isVisible(), true);

    await page.locator('#open-dialog').click();
    assert.equal(await page.locator('#test-dialog').evaluate((element) => element.open), true);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'close-dialog');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#test-dialog').evaluate((element) => element.open), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'open-dialog');

    await page.setViewportSize({ width: 320, height: 700 });
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    assert.ok(widths.content <= widths.viewport, `the package CSS should reflow at 320px (${widths.content}px > ${widths.viewport}px)`);
    assert.deepEqual(pageErrors, [], `browser helper errors: ${pageErrors.join('; ')}`);

    const noScriptContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });
    try {
      const noScriptPage = await noScriptContext.newPage();
      await noScriptPage.goto(consumerUrl);
      const noScriptState = await noScriptPage.evaluate(() => ({
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        sidebarVisible: getComputedStyle(document.querySelector('#primary-navigation')).display !== 'none',
        toggleHidden: document.querySelector('#sidebar-toggle').hidden
      }));
      assert.notEqual(noScriptState.bodyBackground, 'rgba(0, 0, 0, 0)', 'CSS should work without JavaScript');
      assert.equal(noScriptState.sidebarVisible, true, 'native sidebar navigation should remain visible without JavaScript');
      assert.equal(noScriptState.toggleHidden, true, 'the optional controller toggle should remain hidden without JavaScript');
    } finally {
      await noScriptContext.close();
    }

    const bundledPage = await browser.newPage({ viewport: { width: 768, height: 600 } });
    await bundledPage.goto(consumerUrl.replace('/index.html', '/bundled.html'));
    const bundledStyle = await bundledPage.evaluate(() => ({
      buttonPadding: getComputedStyle(document.querySelector('.kh-button')).paddingInlineStart,
      backgroundToken: getComputedStyle(document.documentElement).getPropertyValue('--kh-color-background').trim()
    }));
    assert.notEqual(bundledStyle.buttonPadding, '0px', 'the application-built CSS bundle should apply component styles');
    assert.ok(bundledStyle.backgroundToken, 'the application-built CSS bundle should include design tokens');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function testPackage() {
  assert.equal(packageJson.name, PACKAGE_NAME);
  assert.equal(packageJson.private, true, 'internal package must remain private');
  assert.equal(packageJson.license, 'UNLICENSED', 'internal package must remain unlicensed');
  assert.match(packageJson.version, /^\d+\.\d+\.\d+-draft\.\d+$/);
  assert.deepEqual(packageJson.files, ['dist/']);
  assert.equal(packageJson.publishConfig, undefined, 'no registry publishing configuration is permitted');
  for (const scriptName of ['prepublish', 'prepublishOnly', 'publish', 'postpublish']) {
    assert.equal(packageJson.scripts[scriptName], undefined, `publishing lifecycle ${scriptName} must not be added`);
  }

  const outputPaths = packagePaths(packageJson.exports);
  assert.ok(outputPaths.length > 0);
  assert.ok(outputPaths.every((target) => target.startsWith('./dist/')), 'all exports must resolve inside dist/');
  assert.ok(packageJson.dependencies === undefined || Object.keys(packageJson.dependencies).length === 0,
    'the runtime package must not declare dependencies');

  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kihon-pack-consumer-'));
  try {
    const archiveDirectory = path.join(temporaryRoot, 'archive');
    const consumerRoot = path.join(temporaryRoot, 'consumer');
    const npmCache = path.join(temporaryRoot, 'npm-cache');
    await fs.mkdir(archiveDirectory, { recursive: true });
    await fs.mkdir(consumerRoot, { recursive: true });
    await fs.mkdir(npmCache, { recursive: true });
    const npmEnvironment = { ...process.env, npm_config_cache: npmCache };

    const packStdout = run('npm', ['pack', '--json', '--pack-destination', archiveDirectory], ROOT, { env: npmEnvironment });
    const [packed] = parsePackResult(packStdout);
    assert.equal(packed.name, PACKAGE_NAME);
    assert.equal(packed.version, packageJson.version);
    const packedFiles = packed.files.map((file) => file.path).sort();
    assert.ok(packedFiles.includes('package.json'));
    assert.ok(packedFiles.includes('README.md'));
    assert.deepEqual(packedFiles.filter((file) => file.startsWith('dist/')), [...EXPECTED_FILES].sort());
    assert.deepEqual(packedFiles.filter((file) => !file.startsWith('dist/') && file !== 'package.json' && file !== 'README.md'), []);

    const archivePath = path.join(archiveDirectory, packed.filename);
    const archivePaths = execFileSync('tar', ['-tzf', archivePath], { encoding: 'utf8' })
      .trim().split('\n').map((file) => file.replace(/^package\//, '')).filter(Boolean).sort();
    assert.deepEqual(archivePaths, packedFiles, 'the actual archive must match npm pack inventory');

    const archivedPackageJson = JSON.parse(execFileSync('tar', ['-xOf', archivePath, 'package/package.json'], { encoding: 'utf8' }));
    assert.equal(archivedPackageJson.private, true);
    assert.equal(archivedPackageJson.license, 'UNLICENSED');
    for (const target of outputPaths) {
      assert.ok(archivePaths.includes(target.slice(2)), `export target ${target} is missing from the archive`);
    }

    await writeConsumerFixtures(consumerRoot);
    run('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', archivePath], consumerRoot, { env: npmEnvironment });
    await buildConsumerCss(consumerRoot);
    run(process.execPath, ['consumer.mjs'], consumerRoot);
    run(process.execPath, ['consumer.cjs'], consumerRoot);

    const tsc = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
    run(process.execPath, [tsc, '--project', path.join(consumerRoot, 'type-consumers', 'nodenext', 'tsconfig.json')], consumerRoot);
    run(process.execPath, [tsc, '--project', path.join(consumerRoot, 'type-consumers', 'bundler', 'tsconfig.json')], consumerRoot);

    const installedRuntimePackages = (await fs.readdir(path.join(consumerRoot, 'node_modules')))
      .filter((entry) => !entry.startsWith('.'));
    assert.deepEqual(installedRuntimePackages, ['@cyanautomation'], 'consumer runtime install should contain no development toolchain');
    await verifyBrowserConsumer(consumerRoot);
    console.log(`✓ Packed and installed ${PACKAGE_NAME}@${packageJson.version}; ESM, CommonJS, TypeScript, exports, CSS, and browser consumers passed.`);
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
}

testPackage().catch((error) => {
  console.error(`Package consumer validation failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
