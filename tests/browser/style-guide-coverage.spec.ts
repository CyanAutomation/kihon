import { test, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

test('Chromium records source-mapped style-guide coverage for Fallow', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Playwright JavaScript coverage is supported by Chromium only');

  const browserCoverage = [];
  await page.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymousScripts: true });

  await page.goto('/style-guide/');
  await page.locator('[data-kh-theme-toggle="light"]').click();
  await page.locator('[data-kh-theme-toggle="dark"]').click();
  await page.locator('[data-kh-demo-action]').first().click();
  await page.locator('input[type="text"][data-kh-demo-setting]').first().fill('coverage');
  await page.locator('#sidebar-demo-nav a[href="#sidebar-demo-projects"]').click();
  browserCoverage.push(...await page.coverage.stopJSCoverage());

  await page.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymousScripts: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/style-guide/experience/ipad-library.html');
  await page.getByRole('button', { name: /Movement and foot sweeps/ }).click();
  await page.getByRole('button', { name: 'Back to sessions' }).click();
  const search = page.getByRole('searchbox', { name: 'Search sessions' });
  await search.fill('Newaza');
  await search.clear();
  browserCoverage.push(...await page.coverage.stopJSCoverage());

  const generatedDirectory = path.resolve('style-guide/generated');
  const generatedPrefix = `${new URL('/style-guide/generated/', page.url()).origin}/style-guide/generated/`;
  const scripts = new Map();
  for (const entry of browserCoverage.filter((item) => item.url.startsWith(generatedPrefix))) {
    if (!scripts.has(entry.url)) scripts.set(entry.url, entry);
  }
  const sourceMapCache: Record<string, { lineLengths: number[]; data: unknown; url: null }> = {};
  const result = [];

  for (const [index, entry] of [...scripts.values()].entries()) {
    const relativePath = decodeURIComponent(new URL(entry.url).pathname.slice('/style-guide/generated/'.length));
    const scriptPath = path.resolve(generatedDirectory, relativePath);
    const script = await readFile(scriptPath, 'utf8');
    const map = JSON.parse(await readFile(`${scriptPath}.map`, 'utf8'));
    const url = pathToFileURL(scriptPath).href;

    result.push({ scriptId: String(index + 1), url, functions: entry.functions });
    sourceMapCache[url] = {
      lineLengths: script.split('\n').map((line) => line.length),
      data: map,
      url: null
    };
  }

  expect(result.map((entry) => entry.url)).toEqual(expect.arrayContaining([
    pathToFileURL(path.join(generatedDirectory, 'buttons.js')).href,
    pathToFileURL(path.join(generatedDirectory, 'settings.js')).href,
    pathToFileURL(path.join(generatedDirectory, 'theme.js')).href,
    pathToFileURL(path.join(generatedDirectory, 'experience', 'experience.js')).href
  ]));

  const coverageDirectory = path.resolve('coverage/v8');
  await mkdir(coverageDirectory, { recursive: true });
  const outputPath = path.join(coverageDirectory, `coverage-browser-${process.pid}-${testInfo.workerIndex}-${Date.now()}.json`);
  await writeFile(outputPath, JSON.stringify({ result, timestamp: Date.now() / 1000, 'source-map-cache': sourceMapCache }));
});
