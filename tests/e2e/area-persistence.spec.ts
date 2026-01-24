// moved from tests/e2e/tests
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setupFreshTest, waitForAppReady } from './helpers';

async function getCurrentAreaFromLocalStorage(page: Page) {
  const unedStudio = await page.evaluate(() => localStorage.getItem('unedStudio'));
  const currentArea = unedStudio ? JSON.parse(unedStudio).currentArea : null;
  return currentArea;
}

async function clearCurrentArea(page: Page) {
  const state = await page.evaluate(() => localStorage.getItem('unedStudio'));
  const stateObj = state ? JSON.parse(state) : {};
  stateObj.currentArea = undefined;
  await page.evaluate((newState) => {
    localStorage.setItem('unedStudio', JSON.stringify(newState));
  }, stateObj);
}

// Clear localStorage before each test to ensure a clean state
test.beforeEach(async ({ page }) => {
  await setupFreshTest(page);
  await waitForAppReady(page);
});

test('remembers last studied area in localStorage', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Lógica I/ }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 10000 });
  await page.getByText(/Introducción al Pensamiento Científico/).waitFor({ timeout: 10000 });
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });
  // Check that currentArea is updated
  const currentArea = await getCurrentAreaFromLocalStorage(page);
  expect(currentArea).toBe('ipc');
}, 25000);

test('remembers last studied area in localStorage going throu Options', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Lógica I/ }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 10000 });
  await page.getByText(/Introducción al Pensamiento Científico/).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  // Check that currentArea is updated
  const currentArea = await getCurrentAreaFromLocalStorage(page);
  expect(currentArea).toBe('ipc');
}, 20000);

test('automatically returns to last studied area on app reload', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Lógica I/ }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 10000 });
  await page.getByText(/Introducción al Pensamiento Científico/).waitFor({ timeout: 15000 });
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });
  // Reload page with increased timeout
  await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
  // Should be in IPC area
  await page.getByText(/Introducción al Pensamiento Científico/).waitFor({ timeout: 15000 });
  await expect(page.getByText(/Introducción al Pensamiento Científico/)).toBeVisible();
}, 40000);

test('restores to area selection if no previous area stored', async ({ page }) => {
  await clearCurrentArea(page);
  await page.reload();
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
});

test('preserves quiz progress when switching between areas', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
  });
  // Wait for page to stabilize after localStorage clear
  await page.waitForLoadState('networkidle');

  // await page.getByRole('button', { name: 'Cambiar área' }).first().click();
  // Start Lógica I quiz and answer a question
  await page.getByRole('button', { name: 'Estudiar Lógica I' }).waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: 'Estudiar Lógica I' }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 15000 });

  // Wait for quiz to load properly
  await page.waitForLoadState('networkidle');

  // Wait for the V button to be available and clickable
  await page.getByRole('button', { name: 'V', exact: true }).waitFor({ timeout: 20000 });

  await page.getByRole('button', { name: 'V', exact: true }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 15000 });
  // Check we have progress
  const pageText = await page.locator('body').innerText();
  const pendientesMatch = pageText.match(/❓\s*(\d+)/);
  expect(pendientesMatch).not.toBeNull();
  const pendientes = pendientesMatch ? parseInt(pendientesMatch[1], 10) : null;

  // Switch to IPC area
  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 15000 });
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .waitFor({ timeout: 15000 });
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 15000 });

  // Wait for IPC quiz to load properly
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('text=A', { timeout: 15000 });

  // Answer a question in IPC
  await page.getByRole('button', { name: 'A', exact: true }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 15000 });
  // Switch back to Lógica I
  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 15000 });
  await page.getByRole('button', { name: /Lógica I/ }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 15000 });
  // Wait for the area to load completely - look for quiz elements
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('text=❓', { timeout: 15000 });
  // Should restore the last question and there should be the same amount of questions pending
  const pageTextAfter = await page.locator('body').innerText();
  const pendientesMatchAfter = pageTextAfter.match(/❓ (\d+)/);
  expect(pendientesMatchAfter).not.toBeNull();
  const pendientesAfter = pendientesMatchAfter ? parseInt(pendientesMatchAfter[1], 10) : null;
  expect(pendientesAfter).toBe(pendientes);
}, 50000);
