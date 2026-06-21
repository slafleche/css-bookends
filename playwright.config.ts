import { defineConfig } from '@playwright/test';

/**
 * Browser-tier tests: the "oracle" that validates what our cheap Vitest unit tests
 * ASSUME against a real engine. Run occasionally via `pnpm test:browser`, NOT part
 * of the fast `pnpm test` gate. See two-tier testing notes.
 *
 * No webServer: these tests load CSS via `page.setContent()` and assert through
 * `getComputedStyle()` / `CSS.supports()`. There is no app to serve.
 */
export default defineConfig({
  testDir: 'tests/browser',
  outputDir: 'test-results/browser',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: 'list',
  use: {
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
