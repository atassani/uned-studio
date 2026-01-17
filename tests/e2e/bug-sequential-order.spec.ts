
import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForAppReady } from './helpers';

test.describe('Question Order Bugs', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
    await waitForAppReady(page);
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
  });

  test('sequential order with manually set localStorage to trigger bug', async ({ page }) => {
    // First, start clean and get to a quiz state
    await page.getByRole('button', { name: /Lógica I/ }).click();
    await page.getByText('Orden secuencial').click();
    
    // Manually set localStorage to simulate having answered question 1 and being on question 2
    await page.evaluate(() => {
      localStorage.setItem('currentQuestion_log1', '1'); // Index 1 = question 2
      localStorage.setItem('quizStatus_log1', '{"0": "correct", "1": "pending", "2": "pending"}');
    });
    
    // Now start a section - it should start at question 1, not use the saved index
    await page.getByRole('button', { name: 'Seleccionar secciones' }).click();
    await page.getByText('CUESTIONES GENERALES').click();
    await page.getByRole('button', { name: 'Empezar' }).click();

    // Check what question we're seeing
    const questionText = await page.locator('body').innerText();
    const questionMatch = questionText.match(/(\d+)\./);
    const questionNum = questionMatch ? parseInt(questionMatch[1], 10) : null;
    
    // Should start with question 1, not question 2
    expect(questionNum).toBe(1);
  });
});
