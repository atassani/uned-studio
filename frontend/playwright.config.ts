import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment files
process.env.DOTENV_CONFIG_QUIET = 'true';
dotenv.config({ path: path.resolve(__dirname, '.env.test'), quiet: true });

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const baseSuffix = basePath ? `${basePath}/` : '/';
const localPort = process.env.PLAYWRIGHT_PORT || '3100';
const localOrigin = `http://localhost:${localPort}`;
const baseUrl = `${localOrigin}${baseSuffix}`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. Not html. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  /* Global test timeout */
  timeout: 30000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: baseUrl,
    trace: 'on-first-retry',
    actionTimeout: 10000, // Individual action timeout
    navigationTimeout: 15000, // Page navigation timeout
  },
  webServer: {
    command: 'npm run dev:playwright',
    env: {
      ...process.env,
      PORT: localPort,
      NEXT_PUBLIC_DEFAULT_LANGUAGE: 'es',
      NEXT_PUBLIC_LANGUAGE_SELECTION_ENABLED: 'false',
    },
    url: baseUrl.replace(/\/$/, ''),
    reuseExistingServer: false,
    timeout: 120000, // Increase timeout for server startup
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* Test against other browsers. */
    // ,
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
