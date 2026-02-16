import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForAppReady, startQuizByTestId } from './helpers';

test.beforeEach(async ({ page }) => {
  await setupFreshTestAuthenticated(page);
});

test('True/False quiz works for Lógica I area', async ({ page }) => {
  await waitForAppReady(page);
  await startQuizByTestId(page, 'log1');
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
  await startQuizByTestId(page, 'ipc');
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
