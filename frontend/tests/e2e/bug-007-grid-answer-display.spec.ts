import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForQuizReady, startQuizByTestId } from './helpers';

test.describe('BUG-007 Grid Answer Display', () => {
  test('shows user answer with letter in grid overlay', async ({ page }) => {
    await setupFreshTestAuthenticated(page);

    // Go to MCQ area and start quiz
    await startQuizByTestId(page, 'mcq-tests', { order: 'sequential' });
    await waitForQuizReady(page);

    // Answer the first question (q1, capital of France) incorrectly with "B" (London)
    await page.getByTestId('mcq-answer-A').click();

    // Show the result overlay
    await expect(page.getByText('Respuesta esperada B) Option 2.')).toBeVisible();

    // Continue to next question
    await page.getByTestId('result-continue-button').click();

    // Now go to the status grid
    await page.getByTestId('options-button').click();
    await page.locator('.cursor-pointer[title*="Ver detalles"]').first().click();

    const failedAnswer = await page.getByTestId('failed-answer-text').innerText();
    expect(failedAnswer).toBe('❌ A) Option 1..');
  });
});
