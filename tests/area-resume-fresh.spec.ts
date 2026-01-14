
import { test, expect } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const homePath = basePath ? `${basePath}/` : '/';

// Clear localStorage before each test to ensure a clean state
test.beforeEach(async ({ page }) => {
  await page.goto(homePath);
  await page.evaluate(() => localStorage.clear());
});

test('Clicking area resumes at last question if progress exists', async ({ page }) => {
  // Go to Lógica I, answer 2 questions
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByText('Orden secuencial').click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'V', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
  }
  
  await page.getByRole('button', { name: 'Options' }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).first().click();
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  await page.getByRole('button', { name: 'A', exact: true }).click();
  
  await page.getByRole('button', { name: 'Options' }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).first().click();
  await page.getByRole('button', { name: /Lógica I/ }).click();
  
  // Wait for page to load
  await page.waitForTimeout(1000);
  
  // Should resume at question 3 (index 2)
  const isVisible = await page.getByText(/3\./).first().isVisible();
  expect(isVisible).toBe(true);});

test('Clicking "Todas las preguntas" always starts fresh', async ({ page }) => {
  // Go to IPC, answer 2 questions
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByText('Orden secuencial').click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
  }
  // Go back to menu
  await page.getByRole('button', { name: 'Options' }).click();
  await page.getByRole('button', { name: 'Volver a empezar' }).first().click();
  // Click "Todas las preguntas" again
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  // Should be on question 1
  //await expect(page.getByText(/1\./)).toBeVisible();
  const isVisible = await page.getByText(/1\./).first().isVisible();
  expect(isVisible).toBe(true);
});
