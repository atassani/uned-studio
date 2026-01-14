
import { test, expect } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const homePath = basePath ? `${basePath}/` : '/';

// Clear localStorage before each test to ensure a clean state
test.beforeEach(async ({ page }) => {
  await page.goto(homePath);
  await page.evaluate(() => localStorage.clear());
});

test('remembers last studied area in localStorage', async ({ page }) => {
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  await page.getByRole('button', { name: 'Options' }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).first().click();
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  // Check that currentArea is updated
  const currentArea = await page.evaluate(() => localStorage.getItem('currentArea'));
  expect(currentArea).toBe('ipc');
});

test('remembers last studied area in localStorage going throu Options', async ({ page }) => {
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    await page.getByRole('button', { name: 'Options' }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).first().click();
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  // Check that currentArea is updated
  const currentArea = await page.evaluate(() => localStorage.getItem('currentArea'));
  expect(currentArea).toBe('ipc');
});


test('automatically returns to last studied area on app reload', async ({ page }) => {
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  await page.getByRole('button', { name: 'Options' }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).first().click();
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  // Reload page
  await page.reload();
  // Should be in IPC area
  await expect(page.getByText(/Introducción al Pensamiento Científico/)).toBeVisible();
});

test('restores to area selection if no previous area stored', async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem('currentArea'));
  await page.reload();
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
});

test('preserves quiz progress when switching between areas', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
    });
    // await page.getByRole('button', { name: 'Cambiar área' }).first().click();
    // Start Lógica I quiz and answer a question
    await page.getByRole('button', { name: 'Estudiar Lógica I' }).waitFor();
    await page.getByRole('button', { name: 'Estudiar Lógica I' }).click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    await page.getByRole('button', { name: 'V', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    // Check we have progress
    const pageText = await page.locator('body').innerText();
    const pendientesMatch = pageText.match(/❓\s*(\d+)/);
    expect(pendientesMatch).not.toBeNull();
    const pendientes = pendientesMatch ? parseInt(pendientesMatch[1], 10) : null;

    // Switch to IPC area
    await page.getByRole('button', { name: 'Options' }).click();
    await page.getByRole('button', { name: 'Cambiar área' }).first().click();
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    // Answer a question in IPC
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    // Switch back to Lógica I
    await page.getByRole('button', { name: 'Options' }).click();
    await page.getByRole('button', { name: 'Cambiar área' }).first().click();
    await page.getByRole('button', { name: /Lógica I/ }).click();
    // Wait for the area to load
    await page.waitForTimeout(1000);
    // Should restore the last question and there should be the same amount of questions pending
    const pageTextAfter = await page.locator('body').innerText();
    const pendientesMatchAfter = pageTextAfter.match(/❓ (\d+)/);
    expect(pendientesMatchAfter).not.toBeNull();
    const pendientesAfter = pendientesMatchAfter ? parseInt(pendientesMatchAfter[1], 10) : null;
    expect(pendientesAfter).toBe(pendientes);
});
