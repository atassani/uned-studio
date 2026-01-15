import { test, expect } from '@playwright/test';
import { setupFreshTest } from './helpers';

test.beforeEach(async ({ page }) => {
  await setupFreshTest(page);
});

test('Test area switching preserves progress', async ({ page }) => {
    await page.getByRole('button', { name: 'Estudiar Lógica I' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Estudiar Lógica I' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });
  
  // Wait for quiz to load completely
  await page.waitForLoadState('networkidle');
  
  // Wait for V button to be available
  await page.getByRole('button', { name: 'V', exact: true }).waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: 'V', exact: true }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Continuar' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 10000 });

  // Wait for status to update
  await page.waitForSelector('text=❓');
  const pageText = await page.locator('body').innerText();
  const pendientesMatch = pageText.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatch).not.toBeNull();
  const pendientesBefore = pendientesMatch ? parseInt(pendientesMatch[1], 10) : null;

  await page.getByRole('button', { name: 'Options' }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Options' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Estudiar Lógica I' }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Estudiar Lógica I' }).click({ timeout: 10000 });
  // Wait for the area to load completely
  await page.waitForSelector('text=❓', { timeout: 10000 });
  // Check that progress is preserved
  const pageText2 = await page.locator('body').innerText();
  const pendientesMatch2 = pageText2.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatch2).not.toBeNull();
  const pendientesAfterSwitch = pendientesMatch2 ? parseInt(pendientesMatch2[1], 10) : null;
  expect(pendientesAfterSwitch).toBe(pendientesBefore);
  // Now switch back directly using 'Cambiar área' from the main UI
  await page.getByRole('button', { name: 'Options' }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Options' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Estudiar Lógica I' }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Estudiar Lógica I' }).click({ timeout: 10000 });

  // Wait for status to update again
  await page.waitForSelector('text=❓');
  const pageTextAfter = await page.locator('body').innerText();
  const pendientesMatchAfter = pageTextAfter.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatchAfter).not.toBeNull();
  const pendientesAfter = pendientesMatchAfter ? parseInt(pendientesMatchAfter[1], 10) : null;
  expect(pendientesAfter).toBe(pendientesBefore);
}, 40000);

