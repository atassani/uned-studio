import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, setupTestDataRoutes } from './helpers';

const getStudioUrls = (baseURL?: string) => {
  const fallbackBase = 'http://localhost:3000/studio/';
  const resolved = new URL(baseURL ?? fallbackBase);
  const basePath = resolved.pathname.replace(/\/$/, '');
  return {
    languageEn: `${resolved.origin}${basePath}/en`,
    languageUnsupported: `${resolved.origin}${basePath}/fr`,
  };
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testdataDir = path.resolve(__dirname, '../testdata');

async function setupMultilangAreasRoute(page: Parameters<typeof test>[0]['page']) {
  await setupTestDataRoutes(page);
  await page.route('**/areas.json*', async (route) => {
    const body = fs.readFileSync(path.join(testdataDir, 'areas-multilang-tests.json'), 'utf8');
    await route.fulfill({
      status: 200,
      body,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  });
}

test.describe('Language route access', () => {
  test('accessing /studio/en forces English login UI', async ({ page }) => {
    await setupMultilangAreasRoute(page);
    const { languageEn } = getStudioUrls(test.info().project.use.baseURL as string | undefined);
    const response = await page.goto(languageEn);

    expect(response?.status()).toBe(200);
    await expect(page.getByText('Continue as Guest')).toBeVisible({ timeout: 10000 });

    const state = await page.evaluate(() => localStorage.getItem('learningStudio') || '{}');
    expect(JSON.parse(state).language).toBe('en');
  });

  test('guest login from /studio/en keeps forced language in state', async ({ page }) => {
    await setupMultilangAreasRoute(page);
    const { languageEn } = getStudioUrls(test.info().project.use.baseURL as string | undefined);
    await page.goto(languageEn);

    await expect(page.getByTestId('guest-login-btn')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('guest-login-btn').click();

    await expect(page.getByTestId('google-login-btn')).toHaveCount(0, { timeout: 10000 });
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const raw = localStorage.getItem('learningStudio');
            if (!raw) return null;
            return JSON.parse(raw).language ?? null;
          }),
        { timeout: 10000 }
      )
      .toBe('en');
  });

  test('authenticated /studio/en with no EN progress falls back to safe route', async ({
    page,
  }) => {
    await setupMultilangAreasRoute(page);
    await setupFreshTestAuthenticated(page, 'lang-route-fallback@example.com');
    await page.evaluate(() => {
      localStorage.setItem(
        'learningStudio',
        JSON.stringify({
          language: 'ca',
          currentArea: 'mcq-tests-ca',
          areas: {
            'mcq-tests-ca': { currentQuestion: 1, quizStatus: { 1: 'pending' } },
          },
        })
      );
    });

    const { languageEn } = getStudioUrls(test.info().project.use.baseURL as string | undefined);
    await page.goto(languageEn);

    await expect(page).toHaveURL(/\/studio\/(areas|areas\/configure)\/?$/);
    const configureView = page.getByTestId('area-configuration-view');
    if (await configureView.isVisible().catch(() => false)) {
      await expect(page.getByText('Configure areas')).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.getByText('What do you want to study?')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('area-mcq-tests-en')).toBeVisible();
    }
  });

  test('authenticated /studio/en with EN progress resumes EN context', async ({ page }) => {
    const email = 'lang-route-resume@example.com';
    await setupMultilangAreasRoute(page);
    await setupFreshTestAuthenticated(page, email);

    await page.evaluate((userEmail) => {
      localStorage.setItem(
        'learningStudio',
        JSON.stringify({
          language: 'ca',
          currentArea: 'mcq-tests-en',
          areas: {
            'mcq-tests-en': { currentQuestion: 1, quizStatus: { 1: 'pending' } },
          },
          areaConfigByUser: {
            [`${userEmail}::lang:en`]: { allowedAreaShortNames: ['mcq-tests-en'] },
            [`${userEmail}::lang:ca`]: { allowedAreaShortNames: ['mcq-tests-ca'] },
          },
        })
      );
    }, email);

    const { languageEn } = getStudioUrls(test.info().project.use.baseURL as string | undefined);
    await page.goto(languageEn);

    await expect
      .poll(
        async () => {
          try {
            return await page.evaluate(() => {
              const raw = localStorage.getItem('learningStudio');
              if (!raw) return { language: null, currentArea: null };
              const parsed = JSON.parse(raw);
              return { language: parsed.language ?? null, currentArea: parsed.currentArea ?? null };
            });
          } catch {
            return { language: null, currentArea: null };
          }
        },
        { timeout: 10000 }
      )
      .toEqual({ language: 'en', currentArea: 'mcq-tests-en' });
  });

  test('accessing /studio/fr returns 404', async ({ page }) => {
    const { languageUnsupported } = getStudioUrls(
      test.info().project.use.baseURL as string | undefined
    );
    const response = await page.goto(languageUnsupported);
    expect(response?.status()).toBe(404);
  });
});
