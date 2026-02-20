import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForQuizReady } from './helpers';

test.describe('Resume Quiz Fresh Experience', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTestAuthenticated(page);
  });

  test('Clicking area resumes at last question if progress exists', async ({ page }) => {
    // Go to IPC (Multiple Choice), answer 2 questions
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('area-ipc').waitFor();
    await page.getByTestId('area-ipc').click();
    await page.getByTestId('order-sequential-button').click();
    await page.getByTestId('quiz-all-button').click();

    // Wait for quiz to load and answer 2 questions
    await page.getByTestId('mcq-answer-A').waitFor();
    for (let i = 0; i < 2; i++) {
      try {
        await page.getByTestId('mcq-answer-A').click();
      } catch (e) {
        throw e;
      }
      await page.getByTestId('result-continue-button').click();
      if (i < 1) await page.getByTestId('mcq-answer-A').waitFor();
    }

    await page.getByTestId('options-button').click();
    await page.getByTestId('change-area-button').first().click();
    await page.getByTestId('area-fdl').waitFor();
    await page.getByTestId('area-fdl').click();
    await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
    await page.getByTestId('quiz-all-button').click();
    await page.getByTestId('mcq-answer-A').click();

    await page.getByTestId('options-button').click();
    await page.getByTestId('change-area-button').first().click();
    await page.getByTestId('area-ipc').waitFor();
    await page.getByTestId('area-ipc').click();

    // Wait for page to load completely
    await page.getByTestId('question-view').waitFor();

    // Should resume at question 3 (index 2)
    const isVisible = await page.getByText(/3\./).first().isVisible();
    expect(isVisible).toBe(true);
  }, 30000);

  test('Clicking "Todas las preguntas" always starts fresh', async ({ page }) => {
    // Go to IPC, answer 2 questions
    await page.getByTestId('area-ipc').click();
    await page.getByTestId('order-sequential-button').click();
    await page.getByTestId('quiz-all-button').click();
    await waitForQuizReady(page);
    for (let i = 0; i < 2; i++) {
      try {
        await page.getByTestId('mcq-answer-A').click();
      } catch (e) {
        throw e;
      }
      await page.getByTestId('result-continue-button').click();
    }
    // Go back to menu
    await page.getByTestId('options-button').click();
    await page.getByTestId('reset-quiz-button').first().click();
    // Click "Todas las preguntas" again
    await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
    await page.getByTestId('quiz-all-button').click();
    await waitForQuizReady(page);
    // Should be on question 1
    //await expect(page.getByText(/1\./)).toBeVisible();
    const isVisible = await page.getByText(/1\./).first().isVisible();
    expect(isVisible).toBe(true);
  });
});
