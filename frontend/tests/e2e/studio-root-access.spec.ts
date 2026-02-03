import { test, expect } from '@playwright/test';

test.describe('Studio root access', () => {
  test('accessing /studio should work without trailing slash', async ({ page }) => {
    // Go to the root /studio path (without trailing slash)
    const response = await page.goto('https://humblyproud.com/studio');

    // Should not get a 403 error
    expect(response?.status()).not.toBe(403);
    expect(response?.status()).toBe(200);

    // Should load the actual app content
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 10000 });
  });

  test('accessing /studio/index.html should also work', async ({ page }) => {
    // Go to the explicit index.html path (this already works)
    const response = await page.goto('https://humblyproud.com/studio/index.html');

    expect(response?.status()).toBe(200);

    // Should load the actual app content
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 10000 });
  });
});
