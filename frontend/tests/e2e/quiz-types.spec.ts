import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForAppReady } from './helpers';

test.beforeEach(async ({ page }) => {
  await setupFreshTest(page);
  await page.getByTestId('guest-login-btn').click();
});

test('True/False quiz works for Lógica I area', async ({ page }) => {
  await waitForAppReady(page);
  await page.getByTestId('area-log1').click();
  await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
  await page.getByTestId('quiz-all-button').click();
  await expect(page.getByTestId('tf-answer-true')).toBeVisible();
  await expect(page.getByTestId('tf-answer-false')).toBeVisible();
  await page.getByTestId('tf-answer-true').click();
  await page.getByTestId('result-continue-button').click();
  await expect(page.getByText(/📊\s*\d+\s*\|\s*✅\s*\d+/)).toBeVisible();
});

test('Multiple Choice quiz shows question text with A/B/C buttons (consistent with True/False)', async ({
  page,
}) => {
  await waitForAppReady(page);
  await page.getByTestId('area-ipc').click();
  await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
  await page.getByTestId('quiz-all-button').click();
  // Wait for loading spinner to disappear
  await page.waitForSelector('[data-testid="loading-spinner"]', {
    state: 'detached',
    timeout: 15000,
  });
  await expect(page.getByTestId('question-view')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('mcq-answer-A')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('mcq-answer-B')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('mcq-answer-C')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('mcq-answer-A').click();
  await page.getByTestId('result-continue-button').click();
  await expect(page.getByText(/📊\s*\d+\s*\|\s*✅\s*\d+/)).toBeVisible();
});
