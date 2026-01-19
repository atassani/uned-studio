import { test, expect } from '@playwright/test';
import { setupSuperFreshTest, waitForQuizReady, waitForAppReady } from './helpers';

test.describe('MCQ shuffle option', () => {
  test('should randomize answer order when shuffle is enabled', async ({ page }) => {
    await setupSuperFreshTest(page);
    await waitForAppReady(page);
    // Enable shuffle (assume a toggle exists)
    await page.getByRole('button', { name: /MCQ/i }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    // Enable shuffle BEFORE starting quiz - click on "Secuencial" label instead of using .check()
    await page.getByRole('button', { name: 'Respuestas secuenciales' }).click();

    // Run quiz multiple times to see if order changes
    const ordersSeen = new Set<string>();
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /todas las preguntas/i }).click();
      await waitForQuizReady(page);
      const options = await page.locator('.question-text ~ div > div').allTextContents();
      ordersSeen.add(options.join(','));

      // Go back to menu
      await page.getByRole('button', { name: 'Options' }).click();
      await page.getByRole('button', { name: 'Volver a empezar' }).first().click();
    }

    // With shuffle enabled, we should see at least 2 different orders in 5 runs
    expect(ordersSeen.size).toBeGreaterThanOrEqual(2);
  });

  test('should keep answer order fixed when shuffle is disabled', async ({ page }) => {
    await setupSuperFreshTest(page);
    await waitForAppReady(page);
    await page.getByRole('button', { name: /MCQ/i }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    // Ensure shuffle is off BEFORE starting quiz - click on "Aleatorio" label
    await page.getByRole('button', { name: 'Aleatorizar respuestas' }).click();
    await page.getByRole('button', { name: /todas las preguntas/i }).click();
    await waitForQuizReady(page);
    const firstRunOptions = await page.locator('.question-text ~ div > div').allTextContents();
    // Restart quiz - go back to area selection
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppReady(page);
    await page.getByRole('button', { name: /MCQ/i }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: 'Aleatorizar respuestas' }).click();
    await page.getByRole('button', { name: /todas las preguntas/i }).click();
    await waitForQuizReady(page);
    const secondRunOptions = await page.locator('.question-text ~ div > div').allTextContents();
    // The order should be the same
    expect(firstRunOptions.join(',')).toBe(secondRunOptions.join(','));
  });
});
