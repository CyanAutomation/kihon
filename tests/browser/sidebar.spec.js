const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/style-guide/');
});

test('sidebar exposes a named navigation landmark, grouped lists, and one current page', async ({ page }) => {
  const navigation = page.getByRole('navigation', { name: 'Workspace navigation' });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('heading', { name: 'Workspace', level: 3 })).toBeVisible();
  await expect(navigation.getByRole('heading', { name: 'Account', level: 3 })).toBeVisible();
  await expect(navigation.getByRole('list')).toHaveCount(2);
  await expect(navigation.getByText('Alert history, delivery status, and service health')).toBeVisible();
  await expect(navigation.locator('[aria-current="page"]')).toHaveText(/Overview/);
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
});

test('native links navigate to local destinations and update the current-page state', async ({ page }) => {
  const navigation = page.getByRole('navigation', { name: 'Workspace navigation' });
  const projectsLink = navigation.getByRole('link', { name: 'Projects' });
  await projectsLink.focus();
  await expect(projectsLink).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/#sidebar-demo-projects$/);
  await expect(projectsLink).toHaveAttribute('aria-current', 'page');
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('[data-kh-sidebar-status]')).toHaveText('Current demonstration destination: Projects.');
});

test('controller keeps its labelled toggle and hidden state in sync', async ({ page }) => {
  const shell = page.locator('#sidebar-demo');
  const navigation = page.getByRole('navigation', { name: 'Workspace navigation' });
  const toggle = page.getByRole('button', { name: 'Toggle navigation' }).last();

  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-controls', 'sidebar-demo-nav');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).toBeHidden();
  await expect(shell).toHaveClass(/kh-app-shell--nav-collapsed/);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).toBeVisible();
  await expect(shell).not.toHaveClass(/kh-app-shell--nav-collapsed/);
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
});

test('collapsed navigation is skipped by keyboard focus and reveal remains reachable', async ({ page }) => {
  const navigation = page.getByRole('navigation', { name: 'Workspace navigation' });
  const toggle = page.locator('#sidebar-demo-toggle');
  await toggle.click();
  await toggle.focus();
  await page.keyboard.press('Tab');

  const focusStayedOutOfHiddenNavigation = await page.evaluate(() => {
    const nav = document.querySelector('#sidebar-demo-nav');
    return !nav.contains(document.activeElement);
  });
  expect(focusStayedOutOfHiddenNavigation).toBe(true);
  await expect(navigation).toBeHidden();

  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(navigation).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toBeFocused();
});

test('collapse restores focus to the toggle before hiding focused navigation', async ({ page }) => {
  const result = await page.evaluate(() => {
    const shell = document.createElement('div');
    shell.className = 'kh-app-shell kh-app-shell--with-nav';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Toggle test navigation';
    const nav = document.createElement('nav');
    nav.id = 'focus-restoration-sidebar';
    nav.setAttribute('aria-label', 'Focus restoration test');
    nav.innerHTML = '<a href="#focus-target">Focus target</a>';
    toggle.setAttribute('aria-controls', nav.id);
    const main = document.createElement('div');
    main.className = 'kh-app-shell__main';
    shell.append(toggle, nav, main);
    document.body.append(shell);

    const controller = window.KihonSidebar.createSidebarController({ sidebar: nav, toggleButton: toggle, shell });
    nav.querySelector('a').focus();
    controller.collapse();
    return {
      focusOnToggle: document.activeElement === toggle,
      hidden: nav.hidden,
      expanded: toggle.getAttribute('aria-expanded')
    };
  });

  expect(result).toEqual({ focusOnToggle: true, hidden: true, expanded: 'false' });
});

test('two-column and three-column shells reclaim their navigation track', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  const twoColumnShell = page.locator('#app-shell-nav-main');
  const twoColumnToggle = page.locator('#app-shell-nav-main-toggle');
  await expect(twoColumnToggle).toBeVisible();
  await twoColumnToggle.click();
  await expect(twoColumnShell).toHaveClass(/kh-app-shell--nav-collapsed/);
  const twoColumnsAfterCollapse = await twoColumnShell.evaluate((shell) =>
    getComputedStyle(shell).gridTemplateColumns.trim().split(/\s+/).length
  );
  expect(twoColumnsAfterCollapse).toBe(1);
  await twoColumnToggle.click();
  await expect(twoColumnShell.locator('.kh-sidebar')).toBeVisible();

  const threeColumnShell = page.locator('#sidebar-demo');
  const threeColumnMain = threeColumnShell.locator('.kh-app-shell__main');
  const before = await threeColumnMain.evaluate((main) => main.getBoundingClientRect().width);
  const threeColumnToggle = page.locator('#sidebar-demo-toggle');
  await threeColumnToggle.click();
  await expect(threeColumnShell.locator('.kh-app-shell__details')).toBeVisible();
  const after = await threeColumnMain.evaluate((main) => main.getBoundingClientRect().width);
  expect(after).toBeGreaterThan(before);
  const tracksAfterCollapse = await threeColumnShell.evaluate((shell) =>
    getComputedStyle(shell).gridTemplateColumns.trim().split(/\s+/).length
  );
  expect(tracksAfterCollapse).toBe(2);
});

test('navigation remains available on narrow screens and the collapsed shell reflows', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const shell = page.locator('#sidebar-demo');
  const navigation = page.locator('#sidebar-demo-nav');
  const toggle = page.locator('#sidebar-demo-toggle');
  await expect(navigation).toBeVisible();

  const expandedLayout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    navTop: document.querySelector('#sidebar-demo-nav').getBoundingClientRect().top,
    mainTop: document.querySelector('#sidebar-demo-main').getBoundingClientRect().top
  }));
  expect(expandedLayout.document).toBeLessThanOrEqual(expandedLayout.viewport);
  expect(expandedLayout.navTop).toBeLessThan(expandedLayout.mainTop);

  await toggle.click();
  await expect(navigation).toBeHidden();
  const collapsedLayout = await shell.evaluate((element) => ({
    tracks: getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length,
    mainTop: element.querySelector('.kh-app-shell__main').getBoundingClientRect().top,
    detailsTop: element.querySelector('.kh-app-shell__details').getBoundingClientRect().top
  }));
  expect(collapsedLayout.tracks).toBe(1);
  expect(collapsedLayout.mainTop).toBeLessThan(collapsedLayout.detailsTop);

  await toggle.click();
  await expect(navigation).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(navigation).toBeVisible();
});

test('navigation is visible without JavaScript and hides the inactive toggle', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${baseURL}/style-guide/`);
  await expect(page.getByRole('navigation', { name: 'Workspace navigation' })).toBeVisible();
  await expect(page.locator('#sidebar-demo-toggle')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();
  await context.close();
});

test('repeated toggle use is stable and controller disposal removes its listener', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const toggle = page.locator('#sidebar-demo-toggle');
  for (let index = 0; index < 6; index += 1) await toggle.click();
  expect(pageErrors).toEqual([]);

  const disposed = await page.evaluate(() => {
    const shell = document.createElement('div');
    shell.className = 'kh-app-shell kh-app-shell--with-nav';
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.textContent = 'Dispose test navigation';
    const sidebar = document.createElement('nav');
    sidebar.id = 'dispose-test-sidebar';
    sidebar.setAttribute('aria-label', 'Dispose test navigation');
    toggleButton.setAttribute('aria-controls', sidebar.id);
    shell.append(toggleButton, sidebar, Object.assign(document.createElement('div'), { className: 'kh-app-shell__main' }));
    document.body.append(shell);

    const controller = window.KihonSidebar.createSidebarController({ sidebar, toggleButton, shell });
    controller.collapse();
    controller.dispose();
    toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return {
      hidden: sidebar.hidden,
      expanded: toggleButton.getAttribute('aria-expanded'),
      ready: toggleButton.hasAttribute('data-kh-sidebar-ready')
    };
  });
  expect(disposed).toEqual({ hidden: false, expanded: 'true', ready: false });
});

test('long labels wrap at 320px and remain usable with larger text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const label = page.locator('#sidebar-demo-nav .kh-sidebar__label').filter({ hasText: 'Deployment notifications' });
  await expect(label).toBeVisible();

  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    nav: document.querySelector('#sidebar-demo-nav').getBoundingClientRect()
  }));
  expect(layout.document).toBeLessThanOrEqual(layout.viewport);
  expect(layout.nav.right).toBeLessThanOrEqual(layout.viewport + 1);

  const labelLayout = await label.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    height: element.getBoundingClientRect().height
  }));
  expect(labelLayout.scrollWidth).toBeLessThanOrEqual(labelLayout.clientWidth);
  expect(labelLayout.height).toBeGreaterThan(24);
});

test('light, dark, forced-colours, and reduced-motion states retain clear cues', async ({ page }) => {
  const selected = page.locator('#sidebar-demo-nav [aria-current="page"]');
  const lightColours = await page.evaluate(() => ({
    token: getComputedStyle(document.documentElement).getPropertyValue('--kh-color-background').trim(),
    selected: getComputedStyle(document.querySelector('#sidebar-demo-nav [aria-current="page"]')).backgroundColor
  }));
  await page.locator('html').evaluate((element) => element.setAttribute('data-kh-theme', 'dark'));
  const darkColours = await page.evaluate(() => ({
    token: getComputedStyle(document.documentElement).getPropertyValue('--kh-color-background').trim(),
    selected: getComputedStyle(document.querySelector('#sidebar-demo-nav [aria-current="page"]')).backgroundColor
  }));
  expect(darkColours.token).not.toBe(lightColours.token);
  await expect.poll(() => selected.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(lightColours.selected);

  await page.emulateMedia({ forcedColors: 'active' });
  const forcedColors = await selected.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineColor: style.outlineColor, border: style.borderInlineStartColor };
  });
  expect(forcedColors.outlineStyle).toBe('solid');
  expect(forcedColors.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(forcedColors.border).not.toBe('rgba(0, 0, 0, 0)');

  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'reduce' });
  const transitionDuration = await selected.evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transitionDuration.split(',').every((duration) => parseFloat(duration) <= 0.01)).toBe(true);
});

test('a constrained shell remains usable on a wide viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const layout = await page.locator('#sidebar-demo').evaluate((shell) => {
    shell.style.inlineSize = '56rem';
    const nav = shell.querySelector('.kh-app-shell__nav').getBoundingClientRect();
    const main = shell.querySelector('.kh-app-shell__main').getBoundingClientRect();
    const details = shell.querySelector('.kh-app-shell__details').getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      shellWidth: shell.getBoundingClientRect().width,
      document: document.documentElement.scrollWidth,
      navRight: nav.right,
      mainLeft: main.left,
      mainWidth: main.width,
      mainRight: main.right,
      detailsLeft: details.left,
      detailsRight: details.right
    };
  });

  expect(layout.shellWidth).toBeLessThan(layout.viewport);
  expect(layout.document).toBeLessThanOrEqual(layout.viewport);
  expect(layout.navRight).toBeLessThanOrEqual(layout.mainLeft + 1);
  expect(layout.mainWidth).toBeGreaterThanOrEqual(300);
  expect(layout.mainRight).toBeLessThanOrEqual(layout.detailsLeft + 1);
  expect(layout.detailsRight).toBeLessThanOrEqual(layout.viewport);
});

test('existing shell buttons and dialogs remain functional beside sidebar examples', async ({ page }) => {
  await page.getByRole('button', { name: 'About this application' }).click();
  await expect(page.getByRole('dialog', { name: 'About this application' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'About this application' })).toBeHidden();

  await expect(page.getByRole('button', { name: 'New project' })).toBeEnabled();
  await expect(page.locator('#app-shell-main-action')).toBeEnabled();
});
