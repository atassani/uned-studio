import { test, expect } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const homePath = basePath ? `${basePath}/` : '/';

test('Test area switching preserves progress', async ({ page }) => {
  await page.goto(homePath);
  await page.evaluate(() => {
    localStorage.clear(); 
  });
    await page.getByRole('button', { name: 'Estudiar Lógica I' }).waitFor();
    await page.getByRole('button', { name: 'Estudiar Lógica I' }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).waitFor();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  await page.getByRole('button', { name: 'V', exact: true }).waitFor();
  await page.getByRole('button', { name: 'V', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).waitFor();
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Wait for status to update
  await page.waitForSelector('text=❓');
  const pageText = await page.locator('body').innerText();
  const pendientesMatch = pageText.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatch).not.toBeNull();
  const pendientesBefore = pendientesMatch ? parseInt(pendientesMatch[1], 10) : null;

  await page.getByRole('button', { name: 'Options' }).waitFor();
  await page.getByRole('button', { name: 'Options' }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).first().waitFor();
  await page.getByRole('button', { name: 'Cambiar área' }).first().click();
  await page.getByRole('button', { name: 'Estudiar Lógica I' }).waitFor();
  await page.getByRole('button', { name: 'Estudiar Lógica I' }).click();
  // Wait for the area to load
  await page.waitForTimeout(1000);
  // Check that progress is preserved
  const pageText2 = await page.locator('body').innerText();
  const pendientesMatch2 = pageText2.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatch2).not.toBeNull();
  const pendientesAfterSwitch = pendientesMatch2 ? parseInt(pendientesMatch2[1], 10) : null;
  expect(pendientesAfterSwitch).toBe(pendientesBefore);
  // Now switch back directly using 'Cambiar área' from the main UI
  await page.getByRole('button', { name: 'Options' }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Options' }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).first().waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click();
  await page.getByRole('button', { name: 'Estudiar Lógica I' }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Estudiar Lógica I' }).click();

  // Wait for status to update again
  await page.waitForSelector('text=❓');
  const pageTextAfter = await page.locator('body').innerText();
  const pendientesMatchAfter = pageTextAfter.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatchAfter).not.toBeNull();
  const pendientesAfter = pendientesMatchAfter ? parseInt(pendientesMatchAfter[1], 10) : null;
  expect(pendientesAfter).toBe(pendientesBefore);
});

