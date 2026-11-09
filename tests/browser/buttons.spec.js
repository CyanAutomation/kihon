const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/style-guide/');
});

async function tokenColor(page, tokenName) {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, tokenName);
}

async function expectTokenColor(page, locator, property, tokenName) {
  const expected = await tokenColor(page, tokenName);
  await expect.poll(() => locator.evaluate((element, name) => getComputedStyle(element)[name], property))
    .toBe(expected);
}

test('variants use semantic theme colours and the default class remains primary', async ({ page }) => {
  const defaultButton = page.locator('#default-button-example');
  const primary = page.locator('#primary-example');
  const secondary = page.locator('#secondary-example');
  const quiet = page.locator('#quiet-example');
  const destructive = page.locator('#destructive-example');

  await expect(defaultButton).toHaveClass('kh-button');
  expect(await defaultButton.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(await tokenColor(page, '--kh-color-accent'));
  expect(await primary.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(await tokenColor(page, '--kh-color-accent'));
  expect(await secondary.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(await tokenColor(page, '--kh-color-surface'));
  expect(await secondary.evaluate((element) => getComputedStyle(element).borderColor))
    .toBe(await tokenColor(page, '--kh-color-border-strong'));
  await expectTokenColor(page, quiet, 'color', '--kh-color-accent');
  await expectTokenColor(page, destructive, 'color', '--kh-color-danger');

  const linkStyle = await page.evaluate(() => {
    const link = document.createElement('a');
    link.className = 'kh-button kh-button--primary';
    link.href = '#buttons';
    document.body.append(link);
    const style = getComputedStyle(link);
    const result = { display: style.display, backgroundColor: style.backgroundColor };
    link.remove();
    return result;
  });
  expect(linkStyle.display).toBe('inline');
  expect(linkStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');

  await primary.hover();
  await expectTokenColor(page, primary, 'backgroundColor', '--kh-color-button-primary-hover');
});

test('size modifiers establish compact, standard, and prominent control targets', async ({ page }) => {
  const sizes = await page.evaluate(() => ['small', 'medium', 'large'].map((name) => {
    const button = document.querySelector(`#size-${name}`);
    const style = getComputedStyle(button);
    return { name, minHeight: parseFloat(style.minHeight), fontSize: parseFloat(style.fontSize) };
  }));

  expect(sizes[0].minHeight).toBeLessThan(sizes[1].minHeight);
  expect(sizes[1].minHeight).toBeLessThan(sizes[2].minHeight);
  expect(sizes[0].fontSize).toBeLessThan(sizes[1].fontSize);
  expect(sizes[1].fontSize).toBeLessThan(sizes[2].fontSize);
  expect(sizes.map(({ minHeight }) => minHeight)).toEqual([40, 48, 56]);
});

test('keyboard focus is visible and Enter and Space activate native buttons', async ({ page }) => {
  const actionButton = page.locator('[data-kh-demo-action]');
  const status = page.locator('[data-kh-demo-action-status]');
  const focusButton = page.locator('#interaction-example');

  await page.keyboard.press('Tab');
  await focusButton.focus();
  await expect.poll(() => focusButton.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  expect(await focusButton.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  expect(await focusButton.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe('2px');
  expect(await focusButton.evaluate((element) => getComputedStyle(element).outlineColor))
    .toBe(await tokenColor(page, '--kh-color-focus-ring'));

  const focusBox = await focusButton.boundingBox();
  await page.mouse.move(focusBox.x + focusBox.width / 2, focusBox.y + focusBox.height / 2);
  await page.mouse.down();
  await expect.poll(() => focusButton.evaluate((element) =>
    new DOMMatrixReadOnly(getComputedStyle(element).transform).m42
  )).toBeGreaterThan(0);
  await page.mouse.up();

  await actionButton.focus();
  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Example action completed 1 times.');

  await actionButton.focus();
  await page.keyboard.press('Space');
  await expect(status).toHaveText('Example action completed 2 times.');
});

test('disabled and loading buttons retain native behavior and announce status in context', async ({ page }) => {
  const disabledButton = page.locator('#loading-example');
  await expect(disabledButton).toBeDisabled();
  await disabledButton.evaluate((element) => element.click());
  await expect(page.locator('[data-kh-demo-action-status]')).toHaveText('No action has run yet.');

  const loadingButton = page.locator('[data-kh-demo-loading]');
  const status = page.locator('[data-kh-demo-loading-status]');
  await loadingButton.click();
  await expect(loadingButton).toBeDisabled();
  await expect(loadingButton).toHaveClass(/kh-button--loading/);
  await expect(loadingButton).toHaveText('Saving…');
  await expect(status).toHaveText('Saving changes…');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(loadingButton).toBeEnabled({ timeout: 3000 });
  await expect(loadingButton).toHaveText('Save asynchronously');
  await expect(status).toHaveText('Changes saved.');
});

test('light and dark themes update all variants and loading respects reduced motion', async ({ page }) => {
  const primary = page.locator('#primary-example');
  const secondary = page.locator('#secondary-example');
  const destructive = page.locator('#destructive-example');

  for (const theme of ['light', 'dark']) {
    await page.locator(`[data-kh-theme-toggle="${theme}"]`).click();
    await expectTokenColor(page, primary, 'backgroundColor', '--kh-color-accent');
    await expectTokenColor(page, secondary, 'color', '--kh-color-text-primary');
    await expectTokenColor(page, destructive, 'color', '--kh-color-danger');
  }

  const loadingDemo = page.locator('[data-kh-demo-loading]');
  await loadingDemo.evaluate((element) => element.classList.add('kh-button--loading'));
  const animatedSpinner = await loadingDemo.evaluate((element) => {
    const spinner = getComputedStyle(element, '::before');
    return { content: spinner.content, display: spinner.display, animation: spinner.animationName };
  });
  expect(animatedSpinner.content).not.toBe('none');
  expect(animatedSpinner.display).not.toBe('none');
  expect(animatedSpinner.animation).toBe('kh-button-spin');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const spinnerStyles = await loadingDemo.evaluate((element) => {
    const spinner = getComputedStyle(element, '::before');
    return { content: spinner.content, display: spinner.display, animation: spinner.animationName };
  });
  expect(spinnerStyles.content).not.toBe('none');
  expect(spinnerStyles.display).toBe('none');
  expect(spinnerStyles.animation).toBe('none');
});

test('icon-only names, long labels, and compact layouts remain usable at narrow widths', async ({ page }) => {
  await expect(page.locator('#icon-only-example')).toBeVisible();
  await expect(page.locator('#long-label-example')).toBeVisible();

  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
      longButtonWidth: document.querySelector('#long-label-example').getBoundingClientRect().width,
      longButtonScrollWidth: document.querySelector('#long-label-example').scrollWidth
    }));
    expect(dimensions.pageWidth, `page overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewportWidth);
    expect(dimensions.longButtonScrollWidth).toBeLessThanOrEqual(dimensions.longButtonWidth);
  }

  await page.setViewportSize({ width: 320, height: 900 });
  const defaultHeight = await page.locator('#long-label-example').evaluate((element) => element.getBoundingClientRect().height);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const zoomed = await page.evaluate(() => {
    const section = document.querySelector('#buttons');
    const sectionRect = section.getBoundingClientRect();
    const button = document.querySelector('#long-label-example');
    const buttonRect = button.getBoundingClientRect();
    const overflowing = Array.from(section.querySelectorAll('*')).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        id: element.id,
        className: String(element.className),
        text: element.textContent.trim().slice(0, 60),
        left: rect.left,
        right: rect.right,
        width: rect.width,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth
      };
    }).filter((element) =>
      element.scrollWidth > element.clientWidth + 1 ||
      element.right > sectionRect.right + 1 ||
      element.left < sectionRect.left - 1
    ).slice(0, 8);
    return {
      section: { width: sectionRect.width, left: sectionRect.left, right: sectionRect.right, scrollWidth: section.scrollWidth },
      document: { width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      buttonScrollWidth: button.scrollWidth,
      overflowing
    };
  });
  expect(zoomed.section.scrollWidth, JSON.stringify(zoomed.overflowing)).toBeLessThanOrEqual(zoomed.section.width);
  expect(zoomed.buttonScrollWidth).toBeLessThanOrEqual(zoomed.buttonWidth);
  expect(zoomed.buttonHeight).toBeGreaterThan(defaultHeight);
});
