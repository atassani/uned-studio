import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForQuizReady } from './helpers';

test.describe('Resume Quiz Fresh Experience', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
    await page.getByTestId('guest-login-btn').click();
  });

  test('Clicking area resumes at last question if progress exists', async ({ page }) => {
    // Go to IPC (Multiple Choice), answer 2 questions
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).waitFor();
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();

    // Wait for quiz to load and answer 2 questions
    await page.waitForSelector('text=A');
    for (let i = 0; i < 2; i++) {
      await page.screenshot({ path: `debug-mcq-a-resume-fresh-${i}.png` });
      try {
        await page.getByRole('button', { name: 'A', exact: true }).click();
      } catch (e) {
        const content = await page.content();
        console.error('A button not found. Page content:', content);
        throw e;
      }
      await page.getByRole('button', { name: 'Continuar' }).click();
      if (i < 1) await page.waitForSelector('text=A');
    }

    await page.getByRole('button', { name: 'Opciones' }).click();
    await page.getByRole('button', { name: 'Cambiar área' }).first().click();
    await page.getByText(/Filosofía del Lenguaje/).waitFor();
    await page.getByRole('button', { name: /Filosofía del Lenguaje/ }).click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    await page.getByRole('button', { name: 'A', exact: true }).click();

    await page.getByRole('button', { name: 'Opciones' }).click();
    await page.getByRole('button', { name: 'Cambiar área' }).first().click();
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).waitFor();
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();

    // Wait for page to load completely
    await page.waitForSelector('text=❓');

    // Should resume at question 3 (index 2)
    const isVisible = await page.getByText(/3\./).first().isVisible();
    expect(isVisible).toBe(true);
  }, 30000);

  test('Clicking "Todas las preguntas" always starts fresh', async ({ page }) => {
    // Go to IPC, answer 2 questions
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    await waitForQuizReady(page);
    for (let i = 0; i < 2; i++) {
      await page.screenshot({ path: `debug-mcq-a-resume-fresh-${i}.png` });
      try {
        await page.getByRole('button', { name: 'A', exact: true }).click();
      } catch (e) {
        const content = await page.content();
        console.error('A button not found. Page content:', content);
        throw e;
      }
      await page.getByRole('button', { name: 'Continuar' }).click();
    }
    // Go back to menu
    await page.getByRole('button', { name: 'Opciones' }).click();
    await page.getByRole('button', { name: 'Volver a empezar' }).first().click();
    // Click "Todas las preguntas" again
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    await waitForQuizReady(page);
    // Should be on question 1
    //await expect(page.getByText(/1\./)).toBeVisible();
    const isVisible = await page.getByText(/1\./).first().isVisible();
    expect(isVisible).toBe(true);
  });
});
