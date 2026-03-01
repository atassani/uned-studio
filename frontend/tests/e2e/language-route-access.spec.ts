import { test, expect } from '@playwright/test';
import { setupTestDataRoutes } from './helpers';

const getStudioUrls = (baseURL?: string) => {
  const fallbackBase = 'http://localhost:3000/studio/';
  const resolved = new URL(baseURL ?? fallbackBase);
  const basePath = resolved.pathname.replace(/\/$/, '');
  return {
    languageEn: `${resolved.origin}${basePath}/en`,
    languageUnsupported: `${resolved.origin}${basePath}/fr`,
  };
};

test.describe('Language route access', () => {
  test('accessing /studio/en forces English login UI', async ({ page }) => {
    await setupTestDataRoutes(page);
    const { languageEn } = getStudioUrls(test.info().project.use.baseURL as string | undefined);
    const response = await page.goto(languageEn);

    expect(response?.status()).toBe(200);
    await expect(page.getByText('Continue as Guest')).toBeVisible({ timeout: 10000 });

    const state = await page.evaluate(() => localStorage.getItem('learningStudio') || '{}');
    expect(JSON.parse(state).language).toBe('en');
  });

  test('accessing /studio/fr returns 404', async ({ page }) => {
    const { languageUnsupported } = getStudioUrls(
      test.info().project.use.baseURL as string | undefined
    );
    const response = await page.goto(languageUnsupported);
    expect(response?.status()).toBe(404);
  });
});
