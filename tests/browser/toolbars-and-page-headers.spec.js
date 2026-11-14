const { test, expect } = require('@playwright/test');

const LAYOUT_EPSILON = 0.01;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/style-guide/');
});

test('page headers expose heading context, descriptions, and native page actions', async ({ page }) => {
  await expect(page.getByRole('main')).toHaveCount(1);

  const contentOnlyShell = page.locator('#app-shell-content-only');
  await expect(contentOnlyShell.getByRole('heading', { name: 'Activity', level: 4 })).toBeVisible();
  await expect(contentOnlyShell.getByRole('searchbox', { name: 'Search activity' })).toBeVisible();
  expect(await contentOnlyShell.evaluate((shell) => getComputedStyle(shell).gridTemplateColumns.trim().split(/\s+/).length)).toBe(1);

  const shell = page.locator('#app-shell-full');
  const title = shell.getByRole('heading', { name: 'Overview', level: 4 });
  await expect(title).toHaveAttribute('aria-describedby', 'app-shell-page-description');
  await expect(page.locator('#app-shell-page-description')).toContainText('Project information stays in the main reading order');

  const actions = shell.getByRole('group', { name: 'Overview page actions' });
  await expect(actions.getByRole('button', { name: 'Share report' })).toBeVisible();
  await expect(actions.getByRole('button', { name: 'Create project' })).toBeVisible();
  expect(await actions.locator('button').evaluateAll((buttons) => buttons.every((button) => button.tagName === 'BUTTON'))).toBe(true);
});

test('toolbar controls have names, preserve native keyboard operation, and follow document order', async ({ page }) => {
  const toolbar = page.locator('#app-shell-full .kh-toolbar');
  const search = toolbar.getByRole('searchbox', { name: 'Search projects' });
  const sort = toolbar.getByRole('combobox', { name: 'Sort by' });
  const refresh = toolbar.getByRole('button', { name: 'Refresh' });

  await expect(search).toBeVisible();
  await expect(sort).toBeVisible();
  await expect(toolbar.locator('label[for="app-shell-search"]')).toBeVisible();
  await expect(toolbar.locator('label[for="app-shell-sort"]')).toBeVisible();
  await expect(toolbar.getByRole('group', { name: 'Project filters' })).toBeVisible();
  expect(await toolbar.locator('[role="toolbar"]').count()).toBe(0);

  await search.focus();
  await page.keyboard.press('Tab');
  await expect(sort).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(sort).toHaveValue('updated');
  const focus = await sort.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focus.outlineStyle).toBe('solid');
  expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Tab');
  await expect(refresh).toBeFocused();
});

test('page headers and toolbar groups wrap at supported widths without clipping controls', async ({ page }) => {
  const shell = page.locator('#sidebar-demo');
  const main = shell.locator('.kh-app-shell__main');
  const header = main.locator('.kh-page-header');
  const content = header.locator('.kh-page-header__content');
  const actions = header.locator('.kh-page-header__actions');
  const toolbar = main.locator('.kh-toolbar');

  for (const width of [320, 480, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await page.evaluate(() => {
      const mainElement = document.querySelector('#sidebar-demo-main');
      const toolbarElement = mainElement.querySelector('.kh-toolbar');
      const toolbarRect = toolbarElement.getBoundingClientRect();
      const groups = [...toolbarElement.querySelectorAll('.kh-toolbar__group')].map((group) => {
        const rect = group.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width, scrollWidth: group.scrollWidth, clientWidth: group.clientWidth };
      });
      return {
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        toolbar: { left: toolbarRect.left, right: toolbarRect.right, width: toolbarRect.width, scrollWidth: toolbarElement.scrollWidth, clientWidth: toolbarElement.clientWidth },
        groups
      };
    });

    expect(geometry.document, `page overflow at ${width}px`).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.toolbar.scrollWidth).toBeLessThanOrEqual(geometry.toolbar.clientWidth);
    for (const group of geometry.groups) {
      expect(group.left).toBeGreaterThanOrEqual(geometry.toolbar.left - 1);
      expect(group.right).toBeLessThanOrEqual(geometry.toolbar.right + 1);
      expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
    }
  }

  await page.setViewportSize({ width: 320, height: 900 });
  const headerRects = await page.evaluate(() => {
    const headerElement = document.querySelector('#sidebar-demo-main .kh-page-header');
    const contentRect = headerElement.querySelector('.kh-page-header__content').getBoundingClientRect();
    const actionsRect = headerElement.querySelector('.kh-page-header__actions').getBoundingClientRect();
    return { contentBottom: contentRect.bottom, actionsTop: actionsRect.top };
  });
  expect(headerRects.actionsTop).toBeGreaterThanOrEqual(headerRects.contentBottom - 1);
  await expect(actions.getByRole('button', { name: 'Invite member' })).toBeVisible();
  await expect(toolbar.getByRole('searchbox', { name: 'Search workspace' })).toBeVisible();
});

test('long page-header and toolbar labels remain readable at narrow widths and 200 percent text size', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });

  const longTitle = page.getByRole('heading', { name: 'Deployment notification preferences for critical services' });
  const longAction = page.getByRole('button', { name: 'Show all recent deployment notifications' });
  const titleGeometry = await longTitle.evaluate((element) => ({
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
    height: element.getBoundingClientRect().height
  }));
  const actionGeometry = await longAction.evaluate((element) => ({
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
    height: element.getBoundingClientRect().height
  }));
  const pageWidth = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));

  expect(titleGeometry.scrollWidth).toBeLessThanOrEqual(titleGeometry.width);
  expect(titleGeometry.height).toBeGreaterThan(32);
  expect(actionGeometry.scrollWidth).toBeLessThanOrEqual(actionGeometry.width);
  expect(actionGeometry.height).toBeGreaterThan(44);
  expect(pageWidth.document).toBeLessThanOrEqual(pageWidth.viewport);
});

test('shell region combinations support compact embedded layouts and sidebar collapse', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  const twoRegion = page.locator('#app-shell-nav-main');
  const threeRegion = page.locator('#app-shell-full');
  const twoRegionToggle = twoRegion.getByRole('button', { name: 'Toggle navigation' });
  const threeRegionToggle = threeRegion.getByRole('button', { name: 'Toggle project navigation' });
  const twoRegionMain = twoRegion.locator('.kh-app-shell__main');
  const threeRegionMain = threeRegion.locator('.kh-app-shell__main');
  await twoRegion.evaluate((shell) => { shell.style.inlineSize = '38rem'; });
  await threeRegion.evaluate((shell) => { shell.style.inlineSize = '38rem'; });

  const constrained = await threeRegion.evaluate((shell) => {
    const main = shell.querySelector('.kh-app-shell__main');
    const mainStyle = getComputedStyle(main);
    return {
      mainTrack: main.getBoundingClientRect().width,
      usableMain: main.clientWidth - parseFloat(mainStyle.paddingInlineStart) - parseFloat(mainStyle.paddingInlineEnd),
      gridTracks: getComputedStyle(shell).gridTemplateColumns.trim().split(/\s+/).length
    };
  });
  expect(constrained.gridTracks).toBe(3);
  expect(constrained.usableMain).toBeLessThan(256);

  const threeRegionBeforeCollapse = await threeRegionMain.evaluate((element) => element.getBoundingClientRect().width);
  await threeRegionToggle.click();
  await expect(page.getByRole('navigation', { name: 'Primary project navigation' })).toBeHidden();
  const threeRegionAfterCollapse = await threeRegionMain.evaluate((element) => element.getBoundingClientRect().width);
  expect(threeRegionAfterCollapse).toBeGreaterThan(threeRegionBeforeCollapse);
  await threeRegionToggle.click();

  const twoRegionBeforeCollapse = await twoRegionMain.evaluate((element) => element.getBoundingClientRect().width);
  await twoRegionToggle.click();
  await expect(page.getByRole('navigation', { name: 'Example project navigation' })).toBeHidden();
  const twoRegionAfterCollapse = await twoRegionMain.evaluate((element) => element.getBoundingClientRect().width);
  expect(twoRegionAfterCollapse).toBeGreaterThan(twoRegionBeforeCollapse);
  await twoRegionToggle.click();

  await twoRegion.evaluate((shell) => shell.classList.add('kh-app-shell--compact'));
  await threeRegion.evaluate((shell) => shell.classList.add('kh-app-shell--compact'));
  const stacked = await threeRegion.evaluate((shell) => {
    const box = (selector) => shell.querySelector(selector).getBoundingClientRect();
    const nav = box('.kh-app-shell__nav');
    const main = box('.kh-app-shell__main');
    const details = box('.kh-app-shell__details');
    return {
      navTop: nav.top,
      mainTop: main.top,
      mainBottom: main.bottom,
      detailsTop: details.top,
      tracks: getComputedStyle(shell).gridTemplateColumns.trim().split(/\s+/).length
    };
  });
  expect(stacked.tracks).toBe(1);
  expect(stacked.navTop).toBeLessThan(stacked.mainTop);
  expect(stacked.mainBottom).toBeLessThanOrEqual(stacked.detailsTop + LAYOUT_EPSILON);
  expect(await twoRegion.evaluate((shell) => getComputedStyle(shell).gridTemplateColumns.trim().split(/\s+/).length)).toBe(1);

  const nav = page.getByRole('navigation', { name: 'Primary project navigation' });
  const beforeCompactCollapse = await threeRegionMain.evaluate((element) => element.getBoundingClientRect().width);
  await threeRegionToggle.click();
  await expect(nav).toBeHidden();
  const afterCompactCollapse = await threeRegionMain.evaluate((element) => element.getBoundingClientRect().width);
  expect(afterCompactCollapse).toBeGreaterThanOrEqual(beforeCompactCollapse - 1);
  await expect(threeRegion.getByRole('searchbox', { name: 'Search projects' })).toBeVisible();
  await threeRegionToggle.click();
  await expect(nav).toBeVisible();

  await twoRegionToggle.click();
  await expect(page.getByRole('navigation', { name: 'Example project navigation' })).toBeHidden();
  const twoRegionContent = await twoRegionMain.evaluate((element) => element.getBoundingClientRect().width);
  expect(twoRegionContent).toBeGreaterThan(500);

  await expect(threeRegion.getByRole('searchbox', { name: 'Search projects' })).toBeVisible();
  await expect(threeRegion.getByRole('combobox', { name: 'Sort by' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
});

test('light, dark, forced-colours, reduced-motion, and visible focus states remain usable', async ({ page }) => {
  const description = page.locator('#app-shell-page-description');
  await page.locator('html').evaluate((element) => element.setAttribute('data-kh-theme', 'light'));
  const lightText = await description.evaluate((element) => getComputedStyle(element).color);
  await page.locator('html').evaluate((element) => element.setAttribute('data-kh-theme', 'dark'));
  const darkText = await description.evaluate((element) => getComputedStyle(element).color);
  expect(darkText).not.toBe(lightText);

  const search = page.locator('#app-shell-full').getByRole('searchbox', { name: 'Search projects' });
  await search.focus();
  await page.emulateMedia({ forcedColors: 'active' });
  const forcedFocus = await search.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, borderStyle: style.borderTopStyle };
  });
  expect(forcedFocus.outlineStyle).toBe('solid');
  expect(parseFloat(forcedFocus.outlineWidth)).toBeGreaterThanOrEqual(2);
  expect(forcedFocus.borderStyle).toBe('solid');

  const separatorColour = await page.locator('#app-shell-full .kh-toolbar__separator').evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(separatorColour).not.toBe('rgba(0, 0, 0, 0)');

  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'reduce' });
  const transitionDuration = await search.evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transitionDuration.split(',').every((duration) => parseFloat(duration) <= 0.01)).toBe(true);
});

test('page headers and toolbar controls remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
  try {
    const noScriptPage = await context.newPage();
    await noScriptPage.goto(`${baseURL}/style-guide/`);

    const shell = noScriptPage.locator('#app-shell-full');
    await expect(shell.getByRole('heading', { name: 'Overview', level: 4 })).toBeVisible();
    await expect(shell.getByRole('group', { name: 'Overview page actions' })).toBeVisible();
    await expect(shell.getByRole('button', { name: 'Create project' })).toBeEnabled();
    await expect(shell.getByRole('searchbox', { name: 'Search projects' })).toBeVisible();
    await expect(shell.getByRole('combobox', { name: 'Sort by' })).toBeVisible();
    await expect(shell.locator('[role="toolbar"]')).toHaveCount(0);
    await expect(noScriptPage.getByRole('main')).toHaveCount(1);
    expect(await noScriptPage.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  } finally {
    await context.close();
  }
});
