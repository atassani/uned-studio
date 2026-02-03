import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForQuizReady } from './helpers';

test.describe('MCQ variable number of answers', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
    await page.getByTestId('guest-login-btn').click();
  });

  test('should show correct number of answer buttons for different option counts', async ({
    page,
  }) => {
    // Use test data with MCQ questions having 2, 3, 4, 5 options in order
    await page.getByRole('button', { name: /MCQ/i }).click();
    // Set to sequential order to ensure predictable question order
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: /todas las preguntas/i }).click();
    await waitForQuizReady(page);

    // Question 1: 2 options
    let options = await page.locator('.question-text ~ div > div').allTextContents();
    expect(options.length).toBe(2);
    await expect(page.locator('button.bg-blue-600:has-text("A")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("B")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("C")')).toHaveCount(0);

    // Move to next question
    await page.locator('button.bg-blue-600:has-text("A")').first().click();
    await expect(page.getByTestId('quiz-result-text')).toBeVisible();
    await page.getByRole('button', { name: /continuar/i }).click();
    await waitForQuizReady(page);

    // Question 2: 3 options
    options = await page.locator('.question-text ~ div > div').allTextContents();
    expect(options.length).toBe(3);
    await expect(page.locator('button.bg-blue-600:has-text("A")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("B")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("C")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("D")')).toHaveCount(0);

    // Move to next question
    await page.locator('button.bg-blue-600:has-text("A")').first().click();
    await expect(page.getByTestId('quiz-result-text')).toBeVisible();
    await page.getByRole('button', { name: /continuar/i }).click();
    await waitForQuizReady(page);

    // Question 3: 4 options
    options = await page.locator('.question-text ~ div > div').allTextContents();
    expect(options.length).toBe(4);
    await expect(page.locator('button.bg-blue-600:has-text("A")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("B")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("C")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("D")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("E")')).toHaveCount(0);

    // Move to next question
    await page.locator('button.bg-blue-600:has-text("A")').first().click();
    await expect(page.getByTestId('quiz-result-text')).toBeVisible();
    await page.getByRole('button', { name: /continuar/i }).click();
    await waitForQuizReady(page);

    // Question 4: 5 options
    options = await page.locator('.question-text ~ div > div').allTextContents();
    expect(options.length).toBe(5);
    await expect(page.locator('button.bg-blue-600:has-text("A")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("B")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("C")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("D")').first()).toBeVisible();
    await expect(page.locator('button.bg-blue-600:has-text("E")').first()).toBeVisible();
  });
});
