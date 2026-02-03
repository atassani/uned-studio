import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setupFreshTest, waitForAppReady } from './helpers';

async function getCurrentAreaFromLocalStorage(page: Page) {
  const learningStudio = await page.evaluate(() => localStorage.getItem('learningStudio'));
  const currentArea = learningStudio ? JSON.parse(learningStudio).currentArea : null;
  return currentArea;
}

// Clear localStorage before each test to ensure a clean state
test.beforeEach(async ({ page }) => {
  await setupFreshTest(page);
  await waitForAppReady(page);
  await page.getByTestId('guest-login-btn').click();
  // Wait for initial page load to complete
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
});

test('keyboard shortcuts work for area selection', async ({ page }) => {
  // Wait for areas to load
  await expect(page.getByRole('button', { name: /Lógica I/ })).toBeVisible();

  // Press '1' to select first area
  await page.keyboard.press('1');

  // Should be in question selection for first area
  await expect(page.getByText('¿Cómo quieres las preguntas?')).toBeVisible();
});

test('keyboard shortcuts work for Multiple Choice questions', async ({ page }) => {
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 15000 });

  // Wait for loading spinner to disappear
  await page.waitForSelector('[data-testid="loading-spinner"]', {
    state: 'detached',
    timeout: 15000,
  });

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons, then debug
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    try {
      await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
        timeout: 8000,
      });
    } catch (e) {
      await page.screenshot({ path: 'debug-mcq-keyboard-abutton-not-found.png' });
      const content = await page.content();
      console.error('A button not found (keyboard shortcut test). Page content:', content);
      throw e;
    }
  }

  // Press 'a' to answer with option A
  await page.keyboard.press('a');
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible({ timeout: 10000 });
});

test('selects one section and starts quiz in Lógica I area', async ({ page }) => {
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Seleccionar secciones' }).click({ timeout: 15000 });

  // Wait for the checkbox section to load, with debug if not found
  await page.waitForLoadState('networkidle');
  try {
    await page
      .getByRole('checkbox', { name: 'CUESTIONES DE LOS APUNTES' })
      .waitFor({ timeout: 15000 });
  } catch (e) {
    await page.screenshot({ path: 'debug-section-checkbox-not-found.png' });
    const content = await page.content();
    console.error('Section checkbox not found. Page content:', content);
    throw e;
  }
  await page.getByRole('checkbox', { name: 'CUESTIONES DE LOS APUNTES' }).check({ timeout: 15000 });
  await page.getByRole('button', { name: 'Empezar' }).click({ timeout: 15000 });

  // Updated: match the new concise status line with icons and separators
  await expect(page.locator('body')).toContainText(' 55| ✅ 0| ❌ 0| ❓ 55');

  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 15000 });
  await page.getByText('📚 CUESTIONES DE LOS APUNTES').click({ timeout: 15000 });
  await expect(page.locator('body')).toContainText(
    '📚 CUESTIONES DE LOS APUNTES1❓2❓3❓4❓5❓6❓7❓8❓9❓10❓11❓12❓13❓14❓15❓16❓17❓18❓19❓20❓21❓22❓23❓24❓25❓26❓27❓28❓29❓30❓31❓32❓33❓34❓35❓36❓37❓38❓39❓40❓41❓42❓43❓44❓45❓46❓47❓48❓49❓50❓51❓52❓53❓54❓55❓'
  );

  await page.getByRole('button', { name: 'Continuar' }).first().click({ timeout: 15000 });
  await page.getByRole('button', { name: 'V', exact: true }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Continuar' }).first().click({ timeout: 15000 });
});

test('MCQ shows expected answer in correct format when wrong answer is selected', async ({
  page,
}) => {
  // Navigate to IPC area with MCQ questions
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 15000 });

  // Wait for quiz to load completely
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for answer buttons which indicate quiz is loaded
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 8000,
    });
  }

  // Wait for first question to load - use exact match for A button
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({ timeout: 5000 });

  // Click on answer A
  await page.getByRole('button', { name: 'A', exact: true }).click({ timeout: 10000 });

  // Check if it shows "Incorrecto" - if so, verify expected answer format
  const isIncorrect = await page.getByText('❌ Incorrecto.').isVisible();

  if (isIncorrect) {
    // Should show "Respuesta esperada X) ..." format in the answer section
    const answerSection = page.locator('.text-red-600');
    await expect(answerSection).toBeVisible();

    // The answer should start with "Respuesta esperada" followed by the letter and option text
    await expect(answerSection).toContainText(/^Respuesta esperada [ABC]\) /);
  } else {
    // If A was correct, try B
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Wait for next question to load - buttons are more reliable than question text
    await expect(page.getByRole('button', { name: 'B', exact: true })).toBeVisible({
      timeout: 5000,
    });
    await page.getByRole('button', { name: 'B', exact: true }).click();

    const isIncorrectB = await page.getByText('❌ Incorrecto.').isVisible();

    if (isIncorrectB) {
      const answerSection = page.locator('.text-red-600');
      await expect(answerSection).toBeVisible();
      await expect(answerSection).toContainText(/^Respuesta esperada [ABC]\) /);
    }
  }
}, 25000);
