const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('kihon-theme'));
});

test('experience index links to all three reference screens', async ({ page }) => {
  await page.goto('/style-guide/experience/');
  await expect(page.getByRole('heading', { name: 'One product, three ways to work' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open session capture' })).toHaveAttribute('href', 'iphone-session.html');
  await expect(page.getByRole('link', { name: 'Open adaptive library' })).toHaveAttribute('href', 'ipad-library.html');
  await expect(page.getByRole('link', { name: 'Open analytics' })).toHaveAttribute('href', 'macos-analytics.html');
});

test('iPhone session capture supports themes, touch targets, and a local form response', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/style-guide/experience/iphone-session.html');

  const pageBackground = async () => page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  const darkBackground = await pageBackground();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect.poll(pageBackground).not.toBe(darkBackground);
  await expect(page.locator('[data-kh-theme-toggle="light"]')).toHaveAttribute('aria-pressed', 'true');

  const targetHeights = await page.locator('.xp-save-button, .xp-tab-bar a').evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().height))
  );
  expect(targetHeights.every((height) => height >= 44)).toBe(true);

  await page.locator('#session-type').selectOption({ label: 'Randori' });
  await page.locator('#session-notes').fill('Grip transitions');
  await page.getByRole('button', { name: 'Save session' }).click();
  await expect(page.getByRole('status')).toContainText('No data was sent or stored');

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth, 'unexpected horizontal overflow at ' + width + 'px').toBeLessThanOrEqual(width);
  }
});

test('iPad library adapts list and detail and preserves an accessible return path', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/style-guide/experience/ipad-library.html');

  const library = page.locator('.xp-tablet-shell');
  const secondSession = page.getByRole('button', { name: /Movement and foot sweeps/ });
  await expect(page.getByRole('heading', { name: 'Randori and grip transitions' })).toBeHidden();
  await secondSession.click();
  await expect(page.getByRole('heading', { name: 'Movement and foot sweeps' })).toBeFocused();
  await expect(page.locator('.xp-session-list')).toBeHidden();
  await page.getByRole('button', { name: 'Back to sessions' }).click();
  await expect(page.locator('.xp-session-list')).toBeVisible();
  await expect(secondSession).toBeFocused();

  await page.getByRole('searchbox', { name: 'Search sessions' }).fill('Newaza');
  await expect(page.getByRole('button', { name: /Newaza transitions/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Newaza transitions/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Newaza transitions/ }).click();
  await expect(page.getByRole('heading', { name: 'Newaza transitions' })).toBeVisible();

  for (const [width, expectedTracks] of [[390, 1], [768, 2], [1024, 2], [1280, 3]]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await library.evaluate((element) => ({
      columns: getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length,
      documentWidth: document.documentElement.scrollWidth
    }));
    expect(layout.columns, 'unexpected column count at ' + width + 'px').toBe(expectedTracks);
    expect(layout.documentWidth, 'unexpected horizontal overflow at ' + width + 'px').toBeLessThanOrEqual(width);
  }
});

test('iPad list and detail remain available without the demo behavior script', async ({ page }) => {
  await page.route('**/experience.js', (route) => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/style-guide/experience/ipad-library.html');
  await expect(page.locator('.xp-session-list')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Randori and grip transitions' })).toBeVisible();
  await expect(page.locator('.xp-tablet-shell')).not.toHaveAttribute('data-interactive', 'true');
});

test('macOS analytics keeps data readable at narrow widths and exports a sample', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/style-guide/experience/macos-analytics.html');
  await expect(page.getByRole('navigation', { name: 'Training workspace' }).getByRole('link', { name: 'Training history' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('table', { name: 'Session count by training week' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Recent training sessions' })).toBeVisible();

  const gridColumns = async () => page.locator('.xp-desktop-shell').evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
  );
  expect(await gridColumns()).toBe(3);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await gridColumns()).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.getByLabel('Date range').selectOption('month');
  await expect(page.getByRole('status')).toContainText('illustrative');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('kihon-training-sample.csv');
});

test('each reference screen can switch between dark and light appearance', async ({ page }) => {
  for (const screen of ['iphone-session.html', 'ipad-library.html', 'macos-analytics.html']) {
    await page.goto('/style-guide/experience/' + screen);
    const before = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.getByRole('button', { name: 'Light', exact: true }).click();
    await expect.poll(() => page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(before);
    await expect(page.locator('[data-kh-theme-toggle="light"]')).toHaveAttribute('aria-pressed', 'true');
  }
});
