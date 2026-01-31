import { test, expect } from '@playwright/test';
import { waitForAppReady, startQuiz, setupSuperFreshTest } from './helpers';

// Clean beforeEach without complex timeouts
test.beforeEach(async ({ page }) => {
  await setupSuperFreshTest(page);
  await waitForAppReady(page);
});

test('True/False quiz works for Lógica I area', async ({ page }) => {
  await startQuiz(page, 'Lógica I');

  // Should see True/False question interface
  await page.screenshot({ path: 'debug-true-false-v-home-clean.png' });
  // Ensure we are in the quiz UI before looking for answer buttons
  let inQuiz = false;
  try {
    await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible({
      timeout: 3000,
    });
    inQuiz = true;
  } catch {}
  if (!inQuiz) {
    // Try to click 'Todas las preguntas' to enter quiz
    try {
      await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 3000 });
      await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible({
        timeout: 5000,
      });
    } catch (e) {
      await page.screenshot({ path: 'debug-home-clean-not-in-quiz.png' });
      const content = await page.content();
      console.error('Failed to enter quiz UI. Page content:', content);
      throw e;
    }
  }

  try {
    await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible({
      timeout: 10000,
    });
  } catch (e) {
    const content = await page.content();
    console.error('V button not found. Page content:', content);
    throw e;
  }
  await expect(page.getByRole('button', { name: 'F', exact: true })).toBeVisible();

  // Answer a question
  await page.getByRole('button', { name: 'V', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
});

test('Multiple Choice quiz works for IPC area', async ({ page }) => {
  await startQuiz(page, 'Introducción al Pensamiento Científico');

  // Should see Multiple Choice question interface with options
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'B', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeVisible();

  // Answer a question
  await page.getByRole('button', { name: 'A', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
});

test('keyboard shortcuts work for Multiple Choice questions', async ({ page }) => {
  await startQuiz(page, 'Introducción al Pensamiento Científico');

  // Press 'a' to answer with option A
  await page.keyboard.press('a');
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
});

test('shows area name in quiz view', async ({ page }) => {
  await startQuiz(page, 'Lógica I');
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible();
});
