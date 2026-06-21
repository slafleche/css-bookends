import { expect, test } from '@playwright/test';

/**
 * Harness smoke test. Proves the browser tier works end to end: load inline
 * content, read computed styles, and query feature support. This is the shape every
 * color-fallback oracle test will use; it asserts nothing project-specific yet.
 */

test('setContent + getComputedStyle works', async ({ page }) => {
  await page.setContent(
    '<div id="t" style="color: rgb(45 122 200)">x</div>',
  );
  const color = await page.evaluate(() => {
    const el = document.getElementById('t')!;
    return getComputedStyle(el).color;
  });
  // Chromium serializes computed color to rgb(...) form.
  expect(color).toBe('rgb(45, 122, 200)');
});

test('CSS.supports reports modern color syntax', async ({ page }) => {
  await page.setContent('<div>x</div>');
  const support = await page.evaluate(() => ({
    oklch: CSS.supports('color', 'oklch(0 0 0)'),
    displayP3: CSS.supports('color', 'color(display-p3 0 0 0)'),
    bogus: CSS.supports('color', 'color(acme 0 0 0)'),
  }));
  // Current chromium supports oklch and display-p3; an unknown space is rejected.
  expect(support.oklch).toBe(true);
  expect(support.displayP3).toBe(true);
  expect(support.bogus).toBe(false);
});
