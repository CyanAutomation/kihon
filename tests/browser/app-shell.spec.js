const { test, expect } = require('@playwright/test');

const LAYOUT_EPSILON = 0.01;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/style-guide/');
});

test('supported region combinations use only the columns they need', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  const columns = async (selector) => page.locator(selector).evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
  );
  expect(await columns('#app-shell-content-only')).toBe(1);
  expect(await columns('#app-shell-nav-main')).toBe(2);
  expect(await columns('#app-shell-main-details')).toBe(2);
  expect(await columns('#app-shell-full')).toBe(3);

  const geometry = await page.locator('#app-shell-full').evaluate((shell) => {
    const box = (selector) => {
      const rect = shell.querySelector(selector).getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    };
    return {
      nav: box('.kh-app-shell__nav'),
      main: box('.kh-app-shell__main'),
      details: box('.kh-app-shell__details')
    };
  });
  expect(geometry.nav.right).toBeLessThanOrEqual(geometry.main.left + 1);
  expect(geometry.main.right).toBeLessThanOrEqual(geometry.details.left + 1);
});

test('navigation has a current-page link and the guide keeps one primary main landmark', async ({ page }) => {
  const navigation = page.getByRole('navigation', { name: 'Primary project navigation' });
  await expect(navigation.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('complementary', { name: 'Project details' })).toBeVisible();
});

test('keyboard focus follows the document order through header, navigation, content and details', async ({ page }) => {
  await page.locator('#app-shell-about-trigger').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'New project' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Toggle project navigation' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#app-shell-overview')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#app-shell-activity')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('navigation', { name: 'Primary project navigation' }).getByRole('link', { name: 'Settings' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Share report' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Create project' }).last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox', { name: 'Search projects' }).last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', { name: 'Sort by' }).last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#app-shell-refresh')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Export project activity' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#app-shell-project-name')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#app-shell-main-action')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Return to project overview' })).toBeFocused();
});

test('skip navigation moves focus to the shell main content', async ({ page }) => {
  await page.locator('.kh-sg-skip-link[href="#app-shell-main"]').click();
  await expect(page.locator('#app-shell-main')).toBeFocused();
});

test('shell regions stack at narrow widths and remain within the viewport', async ({ page }) => {
  for (const width of [320, 480, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    const layout = await page.evaluate(() => {
      const shell = document.querySelector('#app-shell-full');
      const rect = (selector) => {
        const bounds = shell.querySelector(selector).getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
      };
      const shellBounds = shell.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        shell: {
          left: shellBounds.left,
          right: shellBounds.right,
          top: shellBounds.top,
          bottom: shellBounds.bottom
        },
        nav: rect('.kh-app-shell__nav'),
        main: rect('.kh-app-shell__main'),
        details: rect('.kh-app-shell__details')
      };
    });
    expect(layout.documentWidth, `page overflow at ${width}px`).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.shell.left).toBeGreaterThanOrEqual(0);
    expect(layout.shell.right).toBeLessThanOrEqual(width);

    if (width <= 896) {
      expect(layout.nav.top).toBeLessThan(layout.main.top);
      expect(layout.main.bottom).toBeLessThanOrEqual(layout.details.top + LAYOUT_EPSILON);
    } else {
      expect(layout.nav.left).toBeLessThan(layout.main.left);
      expect(layout.main.left).toBeLessThan(layout.details.left);
    }
  }
});

test('200 percent text size reflows the shell without clipping focus targets', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });

  const geometry = await page.locator('#app-shell-full').evaluate((shell) => {
    const getRect = (selector) => {
      const rect = shell.querySelector(selector).getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    };
    return {
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      nav: getRect('.kh-app-shell__nav'),
      main: getRect('.kh-app-shell__main'),
      details: getRect('.kh-app-shell__details')
    };
  });
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.nav.top).toBeLessThan(geometry.main.top);
  expect(geometry.main.bottom).toBeLessThanOrEqual(geometry.details.top);

  await page.locator('#app-shell-main-action').scrollIntoViewIfNeeded();
  await page.locator('#app-shell-main-action').focus();
  const visibleAndUncovered = await page.locator('#app-shell-main-action').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return rect.top >= 0 && rect.bottom <= window.innerHeight && (hit === element || element.contains(hit));
  });
  expect(visibleAndUncovered).toBe(true);
});

test('main content and long code remain reachable without page-level horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const code = page.locator('#app-shell-content-only pre code');
  await code.evaluate((element) => {
    element.textContent += ' long_identifier_without_breaks_'.repeat(80);
  });
  const overflow = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: window.innerWidth
  }));
  const codeOverflow = await page.locator('#app-shell-content-only pre').evaluate((element) =>
    element.scrollWidth > element.clientWidth
  );
  expect(overflow.page).toBeLessThanOrEqual(overflow.viewport);
  expect(codeOverflow).toBe(true);

  await page.locator('#app-shell-main-action').scrollIntoViewIfNeeded();
  await page.locator('#app-shell-main-action').focus();
  const focused = await page.locator('#app-shell-main-action').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  });
  expect(focused).toBe(true);
});

test('shell follows light and dark themes and remains visible in forced colours', async ({ page }) => {
  const navigation = page.locator('#app-shell-full .kh-app-shell__nav');
  await page.locator('html').evaluate((element) => element.setAttribute('data-kh-theme', 'light'));
  const lightSurface = await navigation.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.locator('html').evaluate((element) => element.setAttribute('data-kh-theme', 'dark'));
  const darkSurface = await navigation.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(darkSurface).not.toBe(lightSurface);

  await page.emulateMedia({ forcedColors: 'active' });
  const borderStyle = await navigation.evaluate((element) => getComputedStyle(element).borderInlineEndStyle);
  expect(borderStyle).toBe('solid');
});

test('shell respects reduced motion and keyboard focus remains visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const aboutButton = page.locator('#app-shell-about-trigger');
  await aboutButton.focus();
  await page.keyboard.press('Tab');
  const styles = await page.getByRole('button', { name: 'New project' }).evaluate((element) => {
    const computed = getComputedStyle(element);
    return { outlineStyle: computed.outlineStyle, transitionDuration: computed.transitionDuration };
  });
  expect(styles.outlineStyle).toBe('solid');
  expect(styles.transitionDuration.split(',').every((duration) => parseFloat(duration) <= 0.01)).toBe(true);
});

test('application-shell button opens the existing TypeScript-generated dialog helper', async ({ page }) => {
  await page.getByRole('button', { name: 'About Kihon' }).click();
  await expect(page.getByRole('dialog', { name: 'About this application' })).toBeVisible();
  await expect(page.locator('#about-dialog-close')).toBeFocused();
  await page.locator('#about-dialog-close').click();
  await expect(page.locator('#about-dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'About Kihon' })).toBeFocused();
});
