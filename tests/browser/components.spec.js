const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/style-guide/');
});

test('reusable cards and badges use semantic tokens in dark and light appearances', async ({ page }) => {
  const card = page.locator('#component-card-demo');
  const neutralBadge = page.locator('#component-badge-neutral');
  const accentBadge = page.locator('#component-badge-accent');
  const successBadge = page.locator('#component-badge-success');

  const tokenColor = async (name) => page.evaluate((token) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${token})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);

  await expect(card).toBeVisible();
  await expect(neutralBadge).toHaveText('Queued');
  await expect(accentBadge).toHaveText('In progress');
  await expect(successBadge).toHaveText('Observed recently');
  await expect.poll(() => card.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(await tokenColor('--kh-color-surface'));
  await expect.poll(() => accentBadge.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(await tokenColor('--kh-color-accent'));
  await expect.poll(() => successBadge.evaluate((element) => getComputedStyle(element).color))
    .toBe(await tokenColor('--kh-color-success'));

  await page.locator('[data-kh-theme-toggle="light"]').click();
  await expect.poll(() => card.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(await tokenColor('--kh-color-surface'));
  await expect.poll(() => accentBadge.evaluate((element) => getComputedStyle(element).color))
    .toBe(await tokenColor('--kh-color-on-accent'));
  await expect.poll(() => successBadge.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(await tokenColor('--kh-color-success-background'));
});

test('reusable card grid reflows from one column to a multi-column collection', async ({ page }) => {
  const grid = page.locator('#component-card-grid-demo');
  await expect(grid).toBeVisible();
  await expect(grid.locator('.kh-card')).toHaveCount(3);

  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await grid.evaluate((element) => ({
      columns: getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length,
      width: element.getBoundingClientRect().width,
      scrollWidth: element.scrollWidth
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1);
    if (width === 320) expect(layout.columns).toBe(1);
    if (width === 1280) expect(layout.columns).toBeGreaterThan(1);
  }
});
