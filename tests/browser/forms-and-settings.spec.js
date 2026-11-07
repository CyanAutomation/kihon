const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/style-guide/');
});

test('form controls have visible names and associated help and error text', async ({ page }) => {
  await expect(page.locator('#guide-text')).toHaveAccessibleName('Application name');
  await expect(page.locator('#guide-text')).toHaveAccessibleDescription('Used to identify this application.');
  await expect(page.locator('#guide-text')).toHaveAttribute('required', '');
  await expect(page.locator('#guide-invalid')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#guide-invalid')).toHaveAccessibleDescription(/Correct the address before saving.*Enter an email address/);
  await expect(page.locator('#guide-invalid-error')).toContainText('Enter an email address');
});

test('native required validation blocks incomplete submission and accepts valid input', async ({ page }) => {
  const form = page.locator('[data-kh-demo-native-form]');
  const name = page.locator('#guide-text');
  const status = page.locator('[data-kh-demo-native-status]');

  await form.locator('button[type="submit"]').click();
  await expect(name).toBeFocused();
  expect(await name.evaluate((control) => control.validity.valueMissing)).toBe(true);
  await expect(status).toHaveText('Submitting this form sends no data.');

  await name.fill('Local example');
  await form.locator('button[type="submit"]').click();
  await expect(status).toHaveText('Native constraints passed. No data was sent or saved.');
});

test('checkbox, radio, select, disabled, read-only, and focus states stay native', async ({ page }) => {
  const checkbox = page.locator('#guide-notice-updates');
  const checkboxLabel = page.locator('label').filter({ has: checkbox });
  expect(await checkbox.boundingBox()).toMatchObject({ width: 24, height: 24 });
  expect((await checkboxLabel.boundingBox()).height).toBeGreaterThanOrEqual(48);
  await checkboxLabel.click();
  await expect(checkbox).toBeChecked();

  const system = page.locator('#guide-appearance-system');
  const light = page.locator('#guide-appearance-light');
  await system.focus();
  await page.keyboard.press('ArrowDown');
  await expect(light).toBeChecked();

  const select = page.locator('#guide-select');
  await select.focus();
  await expect(select).toBeFocused();
  await select.press('s');
  await expect(select).toHaveValue('staging');

  await expect(page.locator('#guide-disabled')).toBeDisabled();
  const readOnly = page.locator('#guide-readonly');
  await expect(readOnly).toHaveAttribute('readonly', '');
  await readOnly.focus();
  await expect(readOnly).toBeFocused();

  const outline = await readOnly.evaluate((control) => getComputedStyle(control).outlineStyle);
  expect(outline).toBe('solid');
});

test('application-owned validation associates errors and focuses the summary', async ({ page }) => {
  const form = page.locator('[data-kh-demo-custom-form]');
  const summary = page.locator('[data-kh-demo-error-summary]');
  const name = page.locator('#guide-custom-name');
  const email = page.locator('#guide-custom-email');

  await form.locator('button[type="submit"]').click();
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(summary.locator('a')).toHaveCount(2);
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription(/Use a monitored address.*Enter contact email/);

  await name.fill('Local application');
  await email.fill('team@example.com');
  await form.locator('button[type="submit"]').click();
  await expect(summary).toBeHidden();
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-kh-demo-custom-status]')).toHaveText('The example passed native constraints. No data was sent or saved.');
});

test('settings controls are label-activated and announce their changed value', async ({ page }) => {
  const checkbox = page.locator('#guide-auto-updates');
  await page.locator('label[for="guide-auto-updates"]').click();
  await expect(checkbox).toBeChecked();
  await expect(page.locator('[data-kh-demo-settings-status]')).toHaveText(/Automatic updates: on/);

  await page.locator('#guide-settings-appearance').selectOption('Dark');
  await expect(page.locator('[data-kh-demo-settings-status]')).toHaveText(/Theme: Dark/);

  await page.locator('#guide-display-name').fill('Local team');
  await expect(page.locator('[data-kh-demo-settings-status]')).toHaveText(/Display name: Local team/);
  await expect(page.locator('[data-kh-demo-settings-status]')).toHaveAttribute('role', 'status');
});

test('forms and settings reflow at narrow widths and with enlarged text', async ({ page }) => {
  // A 320 CSS px viewport is the available layout width for a 1280px window at 400% browser zoom.
  for (const width of [320, 480]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }

  const firstRow = page.locator('.kh-settings-row').first();
  const rowLayout = await firstRow.evaluate((row) => {
    const content = row.querySelector('.kh-settings-row-content').getBoundingClientRect();
    const control = row.querySelector('.kh-settings-row-control').getBoundingClientRect();
    return { contentBottom: content.bottom, controlTop: control.top };
  });
  expect(rowLayout.controlTop).toBeGreaterThanOrEqual(rowLayout.contentBottom);

  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.setViewportSize({ width: 320, height: 900 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.locator('#guide-display-name')).toBeVisible();
});

test('form styling follows light and dark semantic tokens and reduced motion', async ({ page }) => {
  const input = page.locator('#guide-text');
  const lightBackground = await input.evaluate((control) => getComputedStyle(control).backgroundColor);

  await page.locator('html').evaluate((element) => element.setAttribute('data-kh-theme', 'dark'));
  const darkBackground = await input.evaluate((control) => getComputedStyle(control).backgroundColor);
  expect(darkBackground).not.toBe(lightBackground);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const transition = await input.evaluate((control) => getComputedStyle(control).transitionProperty);
  expect(transition).toBe('none');
});

test('invalid controls and grouped surfaces remain distinguishable in forced-colors mode', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await expect.poll(() => page.locator('#guide-invalid').evaluate((control) => getComputedStyle(control).borderTopStyle)).toBe('dashed');
  await expect.poll(() => page.locator('.kh-settings-list').first().evaluate((group) => getComputedStyle(group).borderTopStyle)).toBe('solid');
});
