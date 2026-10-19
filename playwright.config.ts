import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 3100);
// Locally you can use the installed Chrome (PW_CHANNEL=chrome). CI uses Playwright's Chromium.
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: [
    ['list'],
    ['json', { outputFile: 'results/results.json' }],
    ['html', { open: 'never', outputFolder: 'results/html' }],
  ],
  outputDir: 'results/artifacts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // the app registers a service worker in production builds; block it so
    // page.route() sees every request
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel }, grepInvert: /@desktop-only/ },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/masuk`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
