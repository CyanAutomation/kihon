const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true
  },
  webServer: {
    command: 'node scripts/serve.js',
    url: 'http://127.0.0.1:4173/style-guide/',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000
  }
});
