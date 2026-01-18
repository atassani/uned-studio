import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForQuizReady } from './helpers';

test.describe('MCQ variable options (2–5)', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
  });

  test('should render and allow keyboard shortcuts for MCQ with 2 options', async ({ page }) => {
    // Go to area with MCQ (e.g., IPC)
    await page.getByRole('button', { name: /MCQ/i }).click();
    await page.getByText('Orden secuencial').click();
    await page.getByRole('button', { name: /todas las preguntas/i }).click();
    await waitForQuizReady(page);

    // Find a question with exactly 2 options
    // (Assume the first such question is present; if not, this test will fail and must be adjusted)
    let found = false;
    for (let i = 0; i < 10; ++i) {
      const options = await page.locator('.question-text ~ div > div').allTextContents();
      if (options.length === 2) {
        found = true;
        // Should show only A and B
        await expect(page.getByText(/^A\)/)).toBeVisible();
        await expect(page.getByText(/^B\)/)).toBeVisible();
        await expect(page.getByText(/^C\)/)).toHaveCount(0);
        // Try keyboard shortcut '1' and '2'
        await page.keyboard.press('1');
        await expect(page.locator('.text-2xl')).toBeVisible();
        await page.getByRole('button', { name: /continuar/i }).click();
        await waitForQuizReady(page);
        break;
      } else {
        // Go to next question
        if (await page.getByRole('button', { name: /continuar/i }).isVisible()) {
          await page.getByRole('button', { name: /continuar/i }).click();
          await waitForQuizReady(page);
        }
      }
    }
    expect(found).toBe(true);
  });

  for (const count of [3, 4, 5]) {
    test(`should display ${count} answer buttons for MCQ with ${count} options`, async ({ page }) => {
      // Start quiz in area with MCQ (e.g., IPC)
      await page.getByRole('button', { name: /MCQ/i }).click();
      await page.getByText('Orden secuencial').click();
      await page.getByRole('button', { name: /todas las preguntas/i }).click();
      await waitForQuizReady(page);

      // Find a question with the right number of options
      // (Assume at least one exists; otherwise, this test will need to be adjusted)
      let found = false;
      for (let i = 0; i < 10; ++i) {
        const options = await page.locator('.question-text ~ div > div').allTextContents();
        if (options.length === count) {
          found = true;
          // Check that the answer buttons are A..(A+count-1)
          for (let j = 0; j < count; ++j) {
            const letter = String.fromCharCode(65 + j); // 'A', 'B', ...
            await expect(page.locator(`button:has-text("${letter}"):not([aria-label])`).first()).toBeVisible();
          }
          // There should not be a button for the next letter
          const nextLetter = String.fromCharCode(65 + count);
          
          await expect(page.locator(`button:has-text("${nextLetter}"):not([aria-label])`).first()).not.toBeVisible();
          break;
        } else {
          // Goes to the next screen clicking on the first button  
          await page.locator('button:has-text("A"):not([aria-label])').first().click();
          await expect(page.locator('.text-2xl')).toBeVisible();
        }
        // Go to next question
        if (await page.getByRole('button', { name: /continuar/i }).isVisible()) {
          
          await page.getByRole('button', { name: /continuar/i }).click();
          await waitForQuizReady(page);
        }
      }
      expect(found).toBe(true);
    });
  }
});
