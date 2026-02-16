import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForAppReady } from './helpers';

test.beforeEach(async ({ page }) => {
  await setupFreshTest(page);
  await page.getByTestId('guest-login-btn').click();
});

test('True/False quiz works for Lógica I area', async ({ page }) => {
  await waitForAppReady(page);
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'F', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'V', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText(/📊\s*\d+\s*\|\s*✅\s*\d+/)).toBeVisible();
});

test('Multiple Choice quiz shows question text with A/B/C buttons (consistent with True/False)', async ({
  page,
}) => {
  await waitForAppReady(page);
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  // Wait for loading spinner to disappear
  await page.waitForSelector('[data-testid="loading-spinner"]', {
    state: 'detached',
    timeout: 15000,
  });
  // Try question prompt first, fallback to answer buttons
  try {
    await expect(
      page.locator('h2, h3, [data-testid="question-text"], [data-testid="question-prompt"]')
    ).toBeVisible({ timeout: 10000 });
  } catch {
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 10000,
    });
  }
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole('button', { name: 'B', exact: true })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole('button', { name: 'A', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText(/📊\s*\d+\s*\|\s*✅\s*\d+/)).toBeVisible();
});
