import { test, expect } from '@playwright/test';
import { setupFreshTest } from './helpers';

test.describe('Simple Randomization Test', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
    await page.getByTestId('guest-login-btn').click();
  });

  test('question order demonstrates the bug', async ({ page }) => {
    // Go to IPC area and select random order
    await page.getByTestId('area-ipc').click();
    await page.getByTestId('order-random-button').click();
    await page.getByTestId('quiz-all-button').click();

    // Wait for the quiz to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.question-text', { timeout: 10000 });

    // Get the first question number - first attempt
    const questionElement1 = await page.locator('.question-text').first();
    const questionText1 = await questionElement1.innerText();
    const match1 = questionText1.match(/^(\d+)\./);
    const firstQuestionNum1 = match1 ? parseInt(match1[1], 10) : null;

    expect(firstQuestionNum1).not.toBeNull();

    // Go back to start a new quiz with proper state clearing
    await page.getByTestId('options-button').click();
    await page.getByTestId('reset-quiz-button').first().click();

    // Wait for page to reset completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Allow state to clear

    await page.getByTestId('quiz-all-button').click();

    // Wait for new quiz to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.question-text', { timeout: 10000 });

    // Get the first question number - second attempt
    const questionElement2 = await page.locator('.question-text').first();
    const questionText2 = await questionElement2.innerText();
    const match2 = questionText2.match(/^(\d+)\./);
    const firstQuestionNum2 = match2 ? parseInt(match2[1], 10) : null;

    expect(firstQuestionNum2).not.toBeNull();

    // Try multiple times to account for potential randomization collisions
    // In true randomization, getting the same result twice is possible but unlikely
    const questionNumbers: number[] = [firstQuestionNum1!, firstQuestionNum2!];

    // If first two are the same, try a few more times to reduce false positives
    if (firstQuestionNum1 === firstQuestionNum2) {
      for (let i = 0; i < 3; i++) {
        await page.getByTestId('options-button').click();
        await page.getByTestId('reset-quiz-button').first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        await page.getByTestId('quiz-all-button').click();
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.question-text', { timeout: 10000 });

        const questionElement = await page.locator('.question-text').first();
        const questionText = await questionElement.innerText();
        const match = questionText.match(/^(\d+)\./);
        const questionNum = match ? parseInt(match[1], 10) : null;

        if (questionNum) {
          questionNumbers.push(questionNum);
        }
      }
    }

    // Check if we have at least some variety in question numbers
    // If randomization works, we should see different numbers
    const uniqueNumbers = new Set(questionNumbers);
    expect(uniqueNumbers.size).toBeGreaterThan(1);
  });
});
