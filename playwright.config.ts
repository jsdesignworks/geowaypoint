import { defineConfig } from '@playwright/test';

/**
 * Placeholder — no e2e specs yet (bootstrap).
 * Add projects under `tests/e2e` when auth and shell exist.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
});
