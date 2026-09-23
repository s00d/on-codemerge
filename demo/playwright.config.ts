import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4177',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm preview --host 127.0.0.1 --port 4177',
    url: 'http://127.0.0.1:4177',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
