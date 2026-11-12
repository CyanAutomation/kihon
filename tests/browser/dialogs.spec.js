const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/style-guide/');
});

test('information dialog opens as a named modal, focuses Close, and restores focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'About this application' });
  const dialog = page.getByRole('dialog', { name: 'About this application' });

  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription('Kihon is a framework-free UI foundation. This example sends and stores no data.');
  await expect(page.locator('#about-dialog-close')).toBeFocused();
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);

  await page.evaluate(() => document.querySelector('#default-button-example')?.focus());
  await expect(page.locator('#about-dialog-close')).toBeFocused();

  // Calling the optional helper again while the same modal is open is safe.
  expect(await page.evaluate(() => window.KihonDialogs.openDialog(document.querySelector('#about-dialog')))).toBe(false);

  await page.locator('#about-dialog-close').click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('Escape dismisses the information dialog and restores its trigger', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'About this application' });
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#about-dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('programmatic closure records its result and restores the invoking control', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'About this application' });
  await trigger.click();
  expect(await page.evaluate(() => window.KihonDialogs.closeDialog(document.querySelector('#about-dialog'), 'programmatic'))).toBe(true);
  await expect(page.locator('#about-dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.locator('#about-dialog').evaluate((dialog) => dialog.returnValue)).toBe('programmatic');
});

test('focus-restoration listeners can be disposed after close', async ({ page }) => {
  const result = await page.evaluate(() => {
    const dialog = document.querySelector('#about-dialog');
    const trigger = document.querySelector('#about-dialog-trigger');
    window.KihonDialogs.openDialog(dialog, {
      trigger,
      initialFocus: document.querySelector('#about-dialog-close'),
      fallbackFocus: document.querySelector('#dialogs-heading')
    });
    const closed = window.KihonDialogs.closeDialog(dialog, 'done');
    const disposed = window.KihonDialogs.disposeDialog(dialog);
    const secondClose = window.KihonDialogs.closeDialog(dialog, 'again');
    return { closed, disposed, secondClose };
  });

  expect(result).toEqual({ closed: true, disposed: true, secondClose: false });
  await expect(page.getByRole('button', { name: 'About this application' })).toBeFocused();
});

test('the optional helper rejects an already-open nonmodal dialog', async ({ page }) => {
  const result = await page.evaluate(() => {
    const dialog = document.querySelector('#about-dialog');
    dialog.show();
    let rejected = false;
    try {
      window.KihonDialogs.openDialog(dialog);
    } catch (error) {
      rejected = error instanceof Error;
    }
    dialog.close();
    return { rejected, modal: dialog.matches(':modal') };
  });

  expect(result.rejected).toBe(true);
  expect(result.modal).toBe(false);
});

test('native dialog keyboard scope keeps background controls inert', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit preferences' }).click();
  const dialog = page.locator('#preferences-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#preferences-name')).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  const backwardFocus = await page.evaluate(() => ({
    tag: document.activeElement.tagName,
    insideDialog: document.querySelector('#preferences-dialog').contains(document.activeElement),
    backgroundControl: !document.querySelector('#preferences-dialog').contains(document.activeElement)
      && document.activeElement.matches('a, button, input, select, textarea')
  }));
  expect(backwardFocus.insideDialog || backwardFocus.tag === 'BODY').toBe(true);
  expect(backwardFocus.backgroundControl).toBe(false);
  await page.keyboard.press('Tab');
  await expect(page.locator('#preferences-name')).toBeFocused();

  await page.locator('#preferences-save').focus();
  await page.keyboard.press('Tab');
  const forwardFocus = await page.evaluate(() => ({
    tag: document.activeElement.tagName,
    insideDialog: document.querySelector('#preferences-dialog').contains(document.activeElement),
    backgroundControl: !document.querySelector('#preferences-dialog').contains(document.activeElement)
      && document.activeElement.matches('a, button, input, select, textarea')
  }));
  expect(forwardFocus.insideDialog || forwardFocus.tag === 'BODY').toBe(true);
  expect(forwardFocus.backgroundControl).toBe(false);
  await page.keyboard.press('Shift+Tab');
  const reverseFocus = await page.evaluate(() => ({
    tag: document.activeElement.tagName,
    insideDialog: document.querySelector('#preferences-dialog').contains(document.activeElement),
    backgroundControl: !document.querySelector('#preferences-dialog').contains(document.activeElement)
      && document.activeElement.matches('a, button, input, select, textarea')
  }));
  expect(reverseFocus.insideDialog || reverseFocus.tag === 'BODY').toBe(true);
  expect(reverseFocus.backgroundControl).toBe(false);
});

test('removed trigger focus moves to the supplied connected fallback', async ({ page }) => {
  await page.evaluate(() => {
    const trigger = document.querySelector('#about-dialog-trigger');
    window.KihonDialogs.openDialog(document.querySelector('#about-dialog'), {
      trigger,
      initialFocus: document.querySelector('#about-dialog-close'),
      fallbackFocus: document.querySelector('#dialogs-heading')
    });
    trigger.remove();
  });

  await page.locator('#about-dialog-close').click();
  await expect(page.locator('#dialogs-heading')).toBeFocused();
});

test('invalid preferences stay open with associated errors, then valid input completes', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit preferences' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit application preferences' });
  const name = page.locator('#preferences-name');
  const summary = page.locator('#preferences-error-summary');

  await page.locator('#preferences-save').click();
  await expect(dialog).toBeVisible();
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription(/Used to identify this local example.*Enter an application name/);

  await name.fill('Example application');
  await page.locator('#preferences-save').click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-kh-dialog-status]')).toHaveText('Preferences updated for this example. Nothing was saved.');
  await expect(page.getByRole('button', { name: 'Edit preferences' })).toBeFocused();
});

test('cancelling preferences does not save', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit preferences' }).click();
  await page.locator('#preferences-name').fill('Unsaved example');
  await page.locator('#preferences-cancel').click();

  await expect(page.locator('#preferences-dialog')).toBeHidden();
  await expect(page.locator('[data-kh-dialog-status]')).toHaveText('Preferences cancelled. Nothing was saved.');
  await expect(page.getByRole('button', { name: 'Edit preferences' })).toBeFocused();
});

test('reopened saved preferences start with a cancelled returnValue when Escape is pressed', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Edit preferences' });
  const dialog = page.locator('#preferences-dialog');

  await trigger.click();
  await page.locator('#preferences-name').fill('Saved example');
  await page.locator('#preferences-save').click();
  await expect(dialog).toBeHidden();
  expect(await dialog.evaluate((element) => element.returnValue)).toBe('save');

  await trigger.click();
  expect(await dialog.evaluate((element) => element.returnValue)).toBe('');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-kh-dialog-status]')).toHaveText('Preferences cancelled. Nothing was saved.');
  expect(await dialog.evaluate((element) => element.returnValue)).toBe('');
});

test('destructive confirmation starts on Cancel and executes at most once', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete saved configuration' }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete saved configuration?' });

  await expect(dialog).toBeVisible();
  await expect(page.locator('#delete-dialog-cancel')).toBeFocused();
  await expect(page.locator('#delete-dialog-confirm')).not.toBeFocused();
  await page.locator('#delete-dialog-cancel').click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-kh-dialog-status]')).toHaveText('Deletion cancelled. No configuration was deleted.');

  await page.getByRole('button', { name: 'Delete saved configuration' }).click();
  await page.evaluate(() => {
    const confirm = document.querySelector('#delete-dialog-confirm');
    confirm.click();
    confirm.click();
  });
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-kh-dialog-status]')).toHaveText('Confirmation ran once. No real data was deleted.');
});

test('reopened destructive confirmation does not reuse the previous confirm result after Escape', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Delete saved configuration' });
  const dialog = page.locator('#delete-dialog');

  await trigger.click();
  await page.locator('#delete-dialog-confirm').click();
  await expect(dialog).toBeHidden();
  expect(await dialog.evaluate((element) => element.returnValue)).toBe('confirm');

  await trigger.click();
  expect(await dialog.evaluate((element) => element.returnValue)).toBe('');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-kh-dialog-status]')).toHaveText('Deletion cancelled. No configuration was deleted.');
  expect(await dialog.evaluate((element) => element.returnValue)).toBe('');
});

test('dialogs follow themes and remain usable with long content at narrow widths', async ({ page }) => {
  const dialog = page.locator('#preferences-dialog');
  const body = dialog.locator('.kh-dialog__body');
  await page.locator('html').evaluate((element) => element.setAttribute('data-kh-theme', 'light'));
  await page.getByRole('button', { name: 'Edit preferences' }).click();
  const lightSurface = await dialog.evaluate((element) => getComputedStyle(element).backgroundColor);

  await page.locator('html').evaluate((element) => element.setAttribute('data-kh-theme', 'dark'));
  const darkSurface = await dialog.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(darkSurface).not.toBe(lightSurface);

  await page.setViewportSize({ width: 320, height: 480 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await body.evaluate((element) => {
    const longContent = document.createElement('p');
    longContent.textContent = 'Additional preference details. '.repeat(100);
    element.append(longContent);
  });

  const dimensions = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
  });
  expect(dimensions.left).toBeGreaterThanOrEqual(0);
  expect(dimensions.right).toBeLessThanOrEqual(320);
  expect(dimensions.height).toBeLessThanOrEqual(480);
  expect(await body.evaluate((element) => element.scrollHeight)).toBeGreaterThan(await body.evaluate((element) => element.clientHeight));
  await body.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(page.locator('#preferences-save')).toBeVisible();
});

test('dialog backdrop uses a dark scrim in both light and dark themes', async ({ page }) => {
  const dialog = page.locator('#about-dialog');
  await page.getByRole('button', { name: 'About this application' }).click();

  for (const [theme, alpha] of [['light', '0.38'], ['dark', '0.48']]) {
    await page.locator('html').evaluate((element, mode) => element.setAttribute('data-kh-theme', mode), theme);
    const backdrop = await dialog.evaluate((element) => getComputedStyle(element, '::backdrop').backgroundColor);
    expect(backdrop).toBe(`rgba(0, 0, 0, ${alpha})`);
  }
});

test('dialog boundaries and focus remain visible in forced colours and reduced motion', async ({ page }) => {
  await page.getByRole('button', { name: 'About this application' }).click();
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });

  const dialog = page.locator('#about-dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => getComputedStyle(element).borderBlockStartStyle)).toBe('solid');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  expect(await page.locator('#about-dialog-close').evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  expect(await dialog.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
});

test('settings controls expose their accessible names and descriptions', async ({ page }) => {
  await expect(page.locator('#guide-managed-setting')).toHaveAccessibleName('Managed preference');
  await expect(page.locator('#guide-readonly')).toHaveAccessibleDescription('This value is read-only but remains focusable and copyable.');
  await expect(page.getByRole('textbox', { name: 'Focusable input' })).toHaveCount(1);
});
