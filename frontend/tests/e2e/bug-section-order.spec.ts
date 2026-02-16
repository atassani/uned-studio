import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForQuizReady, startQuizByTestId } from './helpers';

test.describe('bug 004: Section order mismatch in IPC area', () => {
  test('should show the same section order in Seleccionar Secciones and Opciones for IPC area', async ({
    page,
  }) => {
    await setupFreshTestAuthenticated(page);
    // Select IPC area
    // Random order and open Seleccionar Secciones
    await startQuizByTestId(page, 'ipc', { order: 'random', mode: 'sections' });
    // Get section order in modal (by extracting text from all label > span)
    const sectionItems = await page.locator('label input + span').allTextContents();
    // Cancel
    await page
      .getByRole('button', { name: /cancelar|cerrar|x/i })
      .first()
      .click();
    // Start Todas las Preguntas
    await page.getByTestId('quiz-all-button').click();
    await waitForQuizReady(page);
    // Open Opciones
    await page.getByTestId('options-button').click();
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
