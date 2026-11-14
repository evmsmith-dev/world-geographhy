// Automatic checks for World Geography Quiz. See tests/README.md.
import { defineConfig, devices } from '@playwright/test';

// WebKit is the engine inside Safari on iPhone and iPad. It runs on GitHub; set CHROMIUM_ONLY=1 where WebKit isn't installed.
const ipadBrowser = process.env.CHROMIUM_ONLY ? {browserName: 'chromium'} : {};

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.js',
  timeout: 120_000,
  expect: {timeout: 10_000},
  fullyParallel: true,
  workers: 4,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', {open: 'never'}]] : 'list',
  use: {
    baseURL: 'http://localhost:8781',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {name: 'data', testMatch: 'data.spec.js', use: {browserName: 'chromium'}},
    {name: 'phone', testIgnore: 'data.spec.js', use: {browserName: 'chromium', viewport: {width: 384, height: 832}, deviceScaleFactor: 3, isMobile: true, hasTouch: true}},
    {name: 'ipad', testIgnore: 'data.spec.js', use: {...devices['iPad (gen 7)'], ...ipadBrowser}},
  ],
  // serve the game from the folder above this one, the same way GitHub Pages does
  webServer: {command: 'python3 -m http.server 8781 --directory ..', url: 'http://localhost:8781/index.html', reuseExistingServer: !process.env.CI},
});
