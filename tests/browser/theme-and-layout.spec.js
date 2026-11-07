const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/style-guide/');
});

test('System remains selected while dark mode follows the operating system', async ({ page }) => {
  const system = page.locator('[data-kh-theme-toggle="system"]');
  await expect(system).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-kh-theme-toggle="dark"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-kh-theme-status]')).toHaveText('Selected mode: system. Current appearance: dark.');
  await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).colorScheme)).toBe('dark');

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('[data-kh-theme-status]')).toHaveText('Selected mode: system. Current appearance: light.');
  await expect(system).toHaveAttribute('aria-pressed', 'true');
});

test('explicit theme choice is persisted and can return to System mode', async ({ page }) => {
  await page.locator('[data-kh-theme-toggle="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-kh-theme', 'light');
  await expect(page.locator('[data-kh-theme-toggle="light"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-kh-theme-status]')).toHaveText('Selected mode: light. Current appearance: light.');
  expect(await page.evaluate(() => localStorage.getItem('kihon-theme'))).toBe('light');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-kh-theme', 'light');
  await expect(page.locator('[data-kh-theme-toggle="light"]')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('[data-kh-theme-toggle="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-kh-theme', 'dark');
  await expect(page.locator('[data-kh-theme-toggle="dark"]')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('[data-kh-theme-toggle="system"]').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-kh-theme');
  await expect(page.locator('[data-kh-theme-toggle="system"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('kihon-theme'))).toBeNull();
  await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).colorScheme)).toBe('dark');
});

test('theme controls still work when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage unavailable'); } });
  });
  await page.reload();

  await page.locator('[data-kh-theme-toggle="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-kh-theme', 'light');
  await expect(page.locator('[data-kh-theme-toggle="light"]')).toHaveAttribute('aria-pressed', 'true');
});

test('focus is visible and the guide fits common responsive widths', async ({ page }) => {
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveClass(/kh-sg-skip-link/);
  await expect.poll(() => focused.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');

  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasHorizontalOverflow, `unexpected horizontal overflow at ${width}px`).toBe(false);
  }
});

test('every in-page link targets an existing element', async ({ page }) => {
  const brokenTargets = await page.locator('a[href^="#"]').evaluateAll((links) => links
    .map((link) => link.getAttribute('href'))
    .filter((href) => href === '#' || !document.getElementById(decodeURIComponent(href.slice(1)))));

  expect(brokenTargets).toEqual([]);
});
