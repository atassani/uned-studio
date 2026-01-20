import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForQuizReady } from './helpers';

test.describe('bug 004: Section order mismatch in IPC area', () => {
  test('should show the same section order in Seleccionar Secciones and Opciones for IPC area', async ({
    page,
  }) => {
    await setupFreshTest(page);
    // Select IPC area
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/i }).click();
    // Random order
    await page.getByRole('button', { name: 'Orden aleatorio' }).click();
    // Open Seleccionar Secciones
    await page.getByRole('button', { name: /seleccionar secciones/i }).click();
    // Get section order in modal (by extracting text from all label > span)
    const sectionItems = await page.locator('label input + span').allTextContents();
    // Cancel
    await page
      .getByRole('button', { name: /cancelar|cerrar|x/i })
      .first()
      .click();
    // Start Todas las Preguntas
    await page.getByRole('button', { name: /todas las preguntas/i }).click();
    await waitForQuizReady(page);
    // Open Opciones
    await page.getByRole('button', { name: /opciones/i }).click();
    // Get section order in grid
    const sectionItemsFromOptionsRaw = await page
      .locator('div.font-bold.text-lg.mb-2')
      .filter({ hasText: '📚' })
      .allTextContents();
    // Remove the books emoji and any leading whitespace
    const sectionItemsFromOptions = sectionItemsFromOptionsRaw.map((text) =>
      text.replace(/^📚\s*/, '')
    );
    expect(sectionItemsFromOptions).toEqual(sectionItems);
  });
});
