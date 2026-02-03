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

test('remembers last studied area in localStorage', async ({ page }) => {
  // Select Lógica I area
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();

  // Check that currentArea is stored in localStorage (now shortName)
  const currentArea = await getCurrentAreaFromLocalStorage(page);
  expect(currentArea).toBe('log1');

  // Go to different area
  await page.getByRole('button', { name: 'Opciones' }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).first().click();
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();

  // Check that currentArea is updated (now shortName)
  const newCurrentArea = await getCurrentAreaFromLocalStorage(page);
  expect(newCurrentArea).toBe('ipc');
});

test('automatically returns to last studied area on app reload', async ({ page }) => {
  // Set up: study an area first
  await page.waitForLoadState('networkidle');
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .waitFor({ timeout: 15000 });
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });

  // Wait for quiz to load - look for any quiz indicator
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // Reload the page
  await page.reload({ waitUntil: 'networkidle', timeout: 25000 });

  // Wait a moment for everything to initialize
  await page.waitForLoadState('networkidle');

  // Give Firefox extra time to restore state after reload
  await page.waitForTimeout(3000);

  // Check if we're in the quiz (should auto-resume) or back to IPC area
  const continueButtonVisible = await page
    .getByRole('button', { name: 'Continuar' })
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  const menuVisible = await page
    .getByText('¿Cómo quieres las preguntas?')
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  const areaMenuVisible = await page
    .getByText('🎓 Área: Introducción al Pensamiento Científico')
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  const areaSelectionVisible = await page
    .getByText('¿Qué quieres estudiar?')
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  const quizVisible = await page
    .locator('text=❓')
    .isVisible({ timeout: 10000 })
    .catch(() => false);

  if (continueButtonVisible || quizVisible) {
    // We're in the quiz - this is the expected behavior
    expect(continueButtonVisible || quizVisible).toBe(true);
  } else {
    // We're on the home page - check that IPC is available
    expect(menuVisible || areaMenuVisible).toBe(true);
    expect(areaSelectionVisible).toBe(false);
  }
}, 45000);

test('restores to area selection if no previous area stored', async ({ page }) => {
  // Reload page
  await page.reload();
  await page.getByTestId('guest-login-btn').click();

  // Should show area selection screen since no area was stored
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
  await expect(page.getByRole('button', { name: /Lógica I/ })).toBeVisible();
});

test('preserves quiz progress when switching between areas', async ({ page }) => {
  // Start Lógica I quiz and answer a question
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 10000 });
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Orden secuencial' }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });

  // Wait for quiz to load with network idle first
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for any quiz answer buttons which indicate quiz is loaded
    const vButtonVisible = await page
      .getByRole('button', { name: 'V', exact: true })
      .isVisible()
      .catch(() => false);
    const aButtonVisible = await page
      .getByRole('button', { name: 'A', exact: true })
      .isVisible()
      .catch(() => false);

    if (vButtonVisible) {
      // True/False question already loaded
    } else if (aButtonVisible) {
      // Multiple Choice question already loaded
    } else {
      // Wait for any answer button to appear
      try {
        await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible({
          timeout: 6000,
        });
      } catch {
        await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
          timeout: 6000,
        });
      }
    }
  }

  // Click appropriate answer button based on question type
  const vButtonExists = await page
    .getByRole('button', { name: 'V', exact: true })
    .isVisible()
    .catch(() => false);
  if (vButtonExists) {
    await page.getByRole('button', { name: 'V', exact: true }).click({ timeout: 10000 });
  } else {
    await page.getByRole('button', { name: 'A', exact: true }).click({ timeout: 10000 });
  }
  await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 10000 });

  // Check and store the number of pending questions after answering one in Lógica I
  const statusText = await page.locator('body').innerText();
  const pendientesMatch = statusText.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatch).not.toBeNull();
  const pendientesBefore = pendientesMatch ? parseInt(pendientesMatch[1], 10) : null;
  // Extract section name (assume it's after the 📚 emoji and before a line break)
  const sectionMatch = statusText.match(/📚 ([^\n]+)/);
  const sectionBefore = sectionMatch ? sectionMatch[1].trim() : null;

  // Switch to IPC area
  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 10000 });
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 5000 });
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 10000 });

  // Wait for IPC area to load and navigate to questions
  await expect(page.getByText('🎓 Área: Introducción al Pensamiento Científico')).toBeVisible({
    timeout: 5000,
  });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });

  // Wait for quiz to load with network idle first
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for Multiple Choice buttons which indicate quiz is loaded
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 8000,
    });
  }

  // Now answer a question in IPC
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'A', exact: true }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 10000 });

  // Switch back to Lógica I
  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 10000 });
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 10000 });

  // Wait for Lógica I area to load and navigate to questions
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible({ timeout: 5000 });

  // Wait for quiz to load with network idle first
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for any answer buttons which indicate quiz is loaded
    const vButtonVisible = await page
      .getByRole('button', { name: 'V', exact: true })
      .isVisible()
      .catch(() => false);
    const aButtonVisible = await page
      .getByRole('button', { name: 'A', exact: true })
      .isVisible()
      .catch(() => false);
    if (!vButtonVisible && !aButtonVisible) {
      await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible({
        timeout: 8000,
      });
    }
  }

  // Check for question UI (e.g., answer buttons)
  const vButtonVisible = await page
    .getByRole('button', { name: 'V', exact: true })
    .isVisible()
    .catch(() => false);
  const fButtonVisible = await page
    .getByRole('button', { name: 'F', exact: true })
    .isVisible()
    .catch(() => false);
  const aButtonVisible = await page
    .getByRole('button', { name: 'A', exact: true })
    .isVisible()
    .catch(() => false);
  // At least one answer button should be visible
  expect(vButtonVisible || fButtonVisible || aButtonVisible).toBe(true);
  // Check that the number of pending questions is the same as before switching
  const statusTextAfter = await page.locator('body').innerText();
  const pendientesMatchAfter = statusTextAfter.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatchAfter).not.toBeNull();
  const pendientesAfter = pendientesMatchAfter ? parseInt(pendientesMatchAfter[1], 10) : null;
  const sectionMatchAfter = statusTextAfter.match(/📚 ([^\n]+)/);
  const sectionAfter = sectionMatchAfter ? sectionMatchAfter[1].trim() : null;
  expect(pendientesAfter).toBe(pendientesBefore);
  expect(sectionAfter).toBe(sectionBefore);
}, 40000);
