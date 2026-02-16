import { test, expect } from '@playwright/test';
import { waitForAppReady, startQuiz, setupSuperFreshTest } from './helpers';

// Clean beforeEach without complex timeouts
test.beforeEach(async ({ page }) => {
  await setupSuperFreshTest(page);
  await waitForAppReady(page);
});

test('True/False quiz works for Lógica I area', async ({ page }) => {
  await startQuiz(page, 'Lógica I');
  // Ensure we are in the quiz UI before looking for answer buttons
  let inQuiz = false;
  try {
    await expect(page.getByTestId('tf-answer-true')).toBeVisible({
      timeout: 3000,
    });
    inQuiz = true;
  } catch {}
  if (!inQuiz) {
    // Try to click 'Todas las preguntas' to enter quiz
    try {
      await page.getByTestId('quiz-all-button').click({ timeout: 3000 });
      await expect(page.getByTestId('tf-answer-true')).toBeVisible({
        timeout: 5000,
      });
    } catch (e) {
      throw e;
    }
  }

  try {
    await expect(page.getByTestId('tf-answer-true')).toBeVisible({
      timeout: 10000,
    });
  } catch (e) {
    throw e;
  }
  await expect(page.getByTestId('tf-answer-false')).toBeVisible();

  // Answer a question
  await page.getByTestId('tf-answer-true').click();
  await expect(page.getByTestId('result-continue-button')).toBeVisible();
});

test('Multiple Choice quiz works for IPC area', async ({ page }) => {
  await startQuiz(page, 'Introducción al Pensamiento Científico');

  // Should see Multiple Choice question interface with options
  await expect(page.getByTestId('mcq-answer-A')).toBeVisible();
  await expect(page.getByTestId('mcq-answer-B')).toBeVisible();
  await expect(page.getByTestId('mcq-answer-C')).toBeVisible();

  // Answer a question
  await page.getByTestId('mcq-answer-A').click();
  await expect(page.getByTestId('result-continue-button')).toBeVisible();
});

test('keyboard shortcuts work for Multiple Choice questions', async ({ page }) => {
  await startQuiz(page, 'Introducción al Pensamiento Científico');

  // Press 'a' to answer with option A
  await page.keyboard.press('a');
  await expect(page.getByTestId('result-continue-button')).toBeVisible();
});

test('shows area name in quiz view', async ({ page }) => {
  await startQuiz(page, 'Lógica I');
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible();
});
