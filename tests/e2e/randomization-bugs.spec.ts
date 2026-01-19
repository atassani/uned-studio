import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForQuizReady } from './helpers';

test.describe('Randomization Bugs', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
  });

  test('random question order should randomize first question', async ({ page }) => {
    // Test multiple attempts to see if first question is always #1
    const firstQuestions: number[] = [];

    for (let attempt = 0; attempt < 5; attempt++) {
      // Reset and start fresh for each attempt
      await setupFreshTest(page);

      // Go to IPC area and select random order
      await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
      await page.getByRole('button', { name: 'Orden aleatorio' }).click();
      await page.getByRole('button', { name: 'Todas las preguntas' }).click();
      await waitForQuizReady(page);

      // Get the first question number
      const questionElement = await page.locator('.question-text').first();
      const questionText = await questionElement.innerText();
      const match = questionText.match(/^(\d+)\./);
      if (match) {
        firstQuestions.push(parseInt(match[1], 10));
      }
    }

    // If randomization works, we shouldn't always get question 1
    const allSameQuestion = firstQuestions.every((q) => q === firstQuestions[0]);
    expect(allSameQuestion).toBe(false); // This should fail, showing the bug

    // Log the results for debugging
    console.log('First questions seen:', firstQuestions);
  });

  test('answer shuffling should randomize first option', async ({ page }) => {
    // Go to IPC area and enable answer shuffling
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Aleatorio' }).click(); // Enable answer shuffling

    const firstOptions: string[] = [];

    for (let attempt = 0; attempt < 5; attempt++) {
      await page.getByRole('button', { name: 'Todas las preguntas' }).click();
      await waitForQuizReady(page);

      // Get the first option text (button A)
      const firstOptionButton = await page.getByRole('button', { name: 'A', exact: true });
      const firstOptionText = await firstOptionButton.innerText();
      firstOptions.push(firstOptionText);

      // Reset for next attempt by going back to main menu
      await setupFreshTest(page);
      await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
      await page.getByRole('button', { name: 'Aleatorio' }).click();
    }

    // If shuffling works, we shouldn't always get the same first option
    const allSameOption = firstOptions.every((opt) => opt === firstOptions[0]);
    expect(allSameOption).toBe(false); // This should fail, showing the bug

    // Log the results for debugging
    console.log('First options seen:', firstOptions);
  });

  test('True/False areas should not show answer shuffling controls', async ({ page }) => {
    // Go to Lógica I (True/False area)
    await page.getByRole('button', { name: /Lógica I/ }).click();

    // Should NOT see answer shuffling controls
    await expect(page.getByText('Orden de respuestas:')).not.toBeVisible();

    // But SHOULD see question order controls (since question order works for both types)
    await expect(page.getByText('Orden de preguntas:')).toBeVisible();
  });
});
