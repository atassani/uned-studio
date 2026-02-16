import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForQuizReady, startQuizByTestId } from './helpers';

test.describe('MCQ variable number of answers', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTestAuthenticated(page);
  });

  test('should show correct number of answer buttons for different option counts', async ({
    page,
  }) => {
    // Use test data with MCQ questions having 2, 3, 4, 5 options in order
    // Set to sequential order to ensure predictable question order
    await startQuizByTestId(page, 'mcq-tests', { order: 'sequential' });
    await waitForQuizReady(page);

    // Question 1: 2 options
    let options = await page.locator('.question-text ~ div > div').allTextContents();
    expect(options.length).toBe(2);
    await expect(page.getByTestId('mcq-answer-A')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-B')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-C')).toHaveCount(0);

    // Move to next question
    await page.getByTestId('mcq-answer-A').click();
    await expect(page.getByTestId('quiz-result-text')).toBeVisible();
    await page.getByTestId('result-continue-button').click();
    await waitForQuizReady(page);

    // Question 2: 3 options
    options = await page.locator('.question-text ~ div > div').allTextContents();
    expect(options.length).toBe(3);
    await expect(page.getByTestId('mcq-answer-A')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-B')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-C')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-D')).toHaveCount(0);

    // Move to next question
    await page.getByTestId('mcq-answer-A').click();
    await expect(page.getByTestId('quiz-result-text')).toBeVisible();
    await page.getByTestId('result-continue-button').click();
    await waitForQuizReady(page);

    // Question 3: 4 options
    options = await page.locator('.question-text ~ div > div').allTextContents();
    expect(options.length).toBe(4);
    await expect(page.getByTestId('mcq-answer-A')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-B')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-C')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-D')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-E')).toHaveCount(0);

    // Move to next question
    await page.getByTestId('mcq-answer-A').click();
    await expect(page.getByTestId('quiz-result-text')).toBeVisible();
    await page.getByTestId('result-continue-button').click();
    await waitForQuizReady(page);

    // Question 4: 5 options
    options = await page.locator('.question-text ~ div > div').allTextContents();
    expect(options.length).toBe(5);
    await expect(page.getByTestId('mcq-answer-A')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-B')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-C')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-D')).toBeVisible();
    await expect(page.getByTestId('mcq-answer-E')).toBeVisible();
  });
});
