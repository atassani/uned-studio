import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated } from './helpers';

test.beforeEach(async ({ page }) => {
  await setupFreshTestAuthenticated(page);
});

test('shows area selection screen first', async ({ page }) => {
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
  await expect(page.getByTestId('area-log1')).toBeVisible();
  await expect(page.getByTestId('area-ipc')).toBeVisible();
});

test('can select an area and proceed to question selection', async ({ page }) => {
  await page.getByTestId('area-log1').click();
  await expect(page.getByTestId('selection-menu')).toBeVisible();
  await expect(page.getByTestId('quiz-all-button')).toBeVisible();
  await expect(page.getByTestId('quiz-sections-button')).toBeVisible();
  await expect(page.getByTestId('quiz-questions-button')).toBeVisible();
  await expect(page.getByTestId('change-area-button')).toBeVisible();
});

test('can go back to area selection from question selection', async ({ page }) => {
  await page.getByTestId('area-log1').click();
  await page.getByTestId('change-area-button').click();
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
});
