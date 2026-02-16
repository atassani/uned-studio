import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForQuizReady } from './helpers';

test.describe('Randomization Bugs', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTestAuthenticated(page);
  });

  test('random question order should randomize first question', async ({ page }) => {
    // Test multiple attempts to see if first question is always #1
    const firstQuestions: number[] = [];

    // Go to IPC area and select random order
    await page.getByTestId('area-ipc').click();
    for (let attempt = 0; attempt < 5; attempt++) {
      await page.getByTestId('order-random-button').click();
      await page.getByTestId('quiz-all-button').click();
      await waitForQuizReady(page);

      // Get the first question number
      const questionElement = await page.locator('.question-text').first();
      const questionText = await questionElement.innerText();
      const match = questionText.match(/^(\d+)\./);
      if (match) {
        firstQuestions.push(parseInt(match[1], 10));
      }
      await page.getByTestId('options-button').click();
      await page.getByTestId('reset-quiz-button').first().click();
    }

    // If randomization works, we shouldn't always get question 1
    const allSameQuestion = firstQuestions.every((q) => q === firstQuestions[0]);

    expect(allSameQuestion).toBe(false);
  });

  test('answer shuffling should randomize first option', async ({ page }) => {
    const firstOptions: string[] = [];
    await page.getByTestId('area-ipc').click();
    await page.getByTestId('answer-order-random-button').click(); // Enable answer shuffling

    for (let attempt = 0; attempt < 5; attempt++) {
      // Go to IPC area and enable answer shuffling
      await page.getByTestId('quiz-all-button').click();
      await waitForQuizReady(page);

      // Get the first option text
      const questionElement = await page.locator('.question-options').first();
      const questionText = await questionElement.innerText();
      const match = questionText.match(/^A\) (.+)/);
      firstOptions.push(match ? match[1] : 'UNKNOWN');

      await page.getByTestId('options-button').click();
      await page.getByTestId('reset-quiz-button').first().click();
    }

    // If shuffling works, we shouldn't always get the same first option
    const allSameOption = firstOptions.every((opt) => opt === firstOptions[0]);
    expect(allSameOption).toBe(false);
  });

  test('True/False areas should not show answer shuffling controls', async ({ page }) => {
    // Go to Lógica I (True/False area)
    await page.getByTestId('area-log1').click();

    // Should NOT see answer shuffling controls
    await expect(page.getByText('Orden de respuestas:')).not.toBeVisible();

    // But SHOULD see question order controls (since question order works for both types)
    await expect(page.getByText('Orden de preguntas:')).toBeVisible();
  });
});
