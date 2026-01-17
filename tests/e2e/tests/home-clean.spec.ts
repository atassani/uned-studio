import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForAppReady, startQuiz } from './helpers';
// Clean beforeEach without complex timeouts
test.beforeEach(async ({ page }) => {
  await setupFreshTest(page);
  await waitForAppReady(page);
});

test('True/False quiz works for Lógica I area', async ({ page }) => {
  await startQuiz(page, 'Lógica I');

  // Should see True/False question interface
  await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible();
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