import { test, expect, type Page } from '@playwright/test';
import { setupTestDataRoutes } from './helpers';

const getStudioUrls = (baseURL?: string) => {
  const fallbackBase = 'http://localhost:3000/studio/';
  const resolved = new URL(baseURL ?? fallbackBase);
  const basePath = resolved.pathname.replace(/\/$/, '');
  return {
    rootNoSlash: `${resolved.origin}${basePath}`,
    rootIndex: `${resolved.origin}${basePath}/index.html`,
  };
};

const ensureGuestLoginIfPresent = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  const guestLogin = page.getByTestId('guest-login-btn');
  if (await guestLogin.count()) {
    await guestLogin.click();
  }
};

test.describe('Studio root access', () => {
  test('accessing /studio should work without trailing slash', async ({ page }) => {
    await setupTestDataRoutes(page);

    // Go to the root /studio path (without trailing slash)
    const { rootNoSlash } = getStudioUrls(test.info().project.use.baseURL as string | undefined);
    const response = await page.goto(rootNoSlash);

    // Should not get a 403 error
    expect(response?.status()).not.toBe(403);
    expect(response?.status()).toBe(200);

    await ensureGuestLoginIfPresent(page);

    // Should load the actual app content
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 10000 });
  });

  test('accessing /studio/index.html should return 404', async ({ page }) => {
    // We no longer generate an index.html route in Next export.
    const { rootIndex } = getStudioUrls(test.info().project.use.baseURL as string | undefined);
    const response = await page.goto(rootIndex);

    expect(response?.status()).toBe(404);
  });
});
