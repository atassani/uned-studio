import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForQuizReady } from './helpers';

test.describe('MCQ numeric keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
    await page.getByTestId('guest-login-btn').click();
  });

  test('should select the correct answer when pressing 1/2/3', async ({ page }) => {
    // Start quiz in area 2 (ipc, Multiple Choice)
    await page
      .getByRole('button', { name: /Estudiar Introducción al Pensamiento Científico/i })
      .click();
    await page.getByRole('button', { name: /todas las preguntas/i }).click();
    await waitForQuizReady(page);

    // Wait for MCQ options to appear
    const optionA = page.getByText(/^A\)/);
    const optionB = page.getByText(/^B\)/);
    await expect(optionA).toBeVisible();
    await expect(optionB).toBeVisible();

    // Check that no result is shown yet (result element should not exist)
    await expect(page.getByTestId('quiz-result-text')).toHaveCount(0);

    // Press '2' to select the second option (should be equivalent to 'B')
    await page.keyboard.press('2');

    // Assert that a result is now shown (must change after key press)
    await expect(page.getByTestId('quiz-result-text')).toBeVisible();
    await expect(page.getByTestId('quiz-result-text')).toHaveText(/¡Correcto!|Incorrecto/);

    // Go to next question if available
    const continuarBtn = page.getByRole('button', { name: /continuar/i });
    if (await continuarBtn.isVisible()) {
      await continuarBtn.click();
      await waitForQuizReady(page);
    }

    // Again, check that no result is shown yet (result element should not exist)
    await expect(page.getByTestId('quiz-result-text')).toHaveCount(0);

    // Press '1' to select the first option (should be equivalent to 'A')
    await page.keyboard.press('1');

    // Assert that a result is now shown
    await expect(page.getByTestId('quiz-result-text')).toBeVisible();
    await expect(page.getByTestId('quiz-result-text')).toHaveText(/¡Correcto!|Incorrecto/);
  });
});
