import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForQuizReady } from './helpers';

test.describe('BUG-007 Grid Answer Display', () => {
  test('shows user answer with letter in grid overlay', async ({ page }) => {
    await setupFreshTest(page);

    // Go to MCQ area and start quiz
    await page.getByRole('button', { name: /MCQ/i }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: /todas las preguntas/i }).click();
    await waitForQuizReady(page);

    // Answer the first question (q1, capital of France) incorrectly with "B" (London)
    await page.getByRole('button', { name: 'A' }).click();

    // Show the result overlay
    await expect(page.getByText('Respuesta esperada B) Option 2.')).toBeVisible();

    // Continue to next question
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Now go to the status grid
    await page.getByLabel('Opciones').click();
    await page.locator('.cursor-pointer[title*="Ver detalles"]').first().click();

    const failedAnswer = await page.getByTestId('failed-answer-text').innerText();
    expect(failedAnswer).toBe('❌ A) Option 1..');
  });
});
