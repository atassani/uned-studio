import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForQuizReady } from './helpers';

test.describe('MCQ review mode', () => {
  test('can view question details from results grid after quiz', async ({ page }) => {
    await setupFreshTest(page);
    await page.getByTestId('guest-login-btn').click();
    // Go to MCQ area and start quiz
    await page.getByTestId('area-mcq-tests').click();
    await page.getByTestId('order-sequential-button').click();
    await page.getByTestId('quiz-all-button').click();
    await waitForQuizReady(page);
    await page.getByTestId('mcq-answer-A').click();
    await page.getByTestId('result-continue-button').click();

    // Answer all remaining questions
    while (!(await page.getByText('Quiz Completado').isVisible())) {
      await page.getByTestId('mcq-answer-B').click();
      await page.getByTestId('result-continue-button').click();
    }

    // On results page, find a failed question (should be first)
    const failBox = await page.locator('.grid .text-2xl:has-text("❌")').first();
    await failBox.click();

    // Should show question detail, correct answer, and explanation
    await expect(page.locator('.question-text')).toBeVisible();
    await expect(page.getByText(/Respuesta correcta/)).toBeVisible();
    //await expect(page.getByText(/Explicación/)).toBeVisible();

    await page.getByRole('button', { name: /Volver al resumen/i }).click();
    await expect(page.locator('.grid .text-2xl').first()).toBeVisible();
  });
});
