import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForQuizReady, startQuizByTestId } from './helpers';

test.describe('MCQ variable options (2–5)', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTestAuthenticated(page);
  });

  test('should render and allow keyboard shortcuts for MCQ with 2 options', async ({ page }) => {
    // Go to area with MCQ (e.g., IPC)
    await startQuizByTestId(page, 'mcq-tests', { order: 'sequential' });
    await waitForQuizReady(page);

    // Find a question with exactly 2 options
    // (Assume the first such question is present; if not, this test will fail and must be adjusted)
    let found = false;
    for (let i = 0; i < 10; ++i) {
      const options = await page.locator('.question-text ~ div > div').allTextContents();
      if (options.length === 2) {
        found = true;
        // Should show only A and B
        await expect(page.getByTestId('mcq-answer-A')).toBeVisible();
        await expect(page.getByTestId('mcq-answer-B')).toBeVisible();
        await expect(page.getByTestId('mcq-answer-C')).toHaveCount(0);
        // Try keyboard shortcut '1' and '2'
        await page.keyboard.press('1');
        await expect(page.getByTestId('quiz-result-text')).toBeVisible();
        await page.getByTestId('result-continue-button').click();
        await waitForQuizReady(page);
        break;
      } else {
        // Go to next question
        if (await page.getByTestId('result-continue-button').isVisible()) {
          await page.getByTestId('result-continue-button').click();
          await waitForQuizReady(page);
        }
      }
    }
    expect(found).toBe(true);
  });

  for (const count of [3, 4, 5]) {
    test(`should display ${count} answer buttons for MCQ with ${count} options`, async ({
      page,
    }) => {
      // Start quiz in area with MCQ (e.g., IPC)
      await startQuizByTestId(page, 'mcq-tests', { order: 'sequential' });
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
            await expect(page.getByTestId(`mcq-answer-${letter}`)).toBeVisible();
          }
          // There should not be a button for the next letter
          const nextLetter = String.fromCharCode(65 + count);

          await expect(page.getByTestId(`mcq-answer-${nextLetter}`)).toHaveCount(0);
          break;
        } else {
          // Goes to the next screen clicking on the first button
          await page.getByTestId('mcq-answer-A').click();
          await expect(page.getByTestId('quiz-result-text')).toBeVisible();
        }
        // Go to next question
        if (await page.getByTestId('result-continue-button').isVisible()) {
          await page.getByTestId('result-continue-button').click();
          await waitForQuizReady(page);
        }
      }
      expect(found).toBe(true);
    });
  }
});
