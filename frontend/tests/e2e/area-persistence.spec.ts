// moved from tests/e2e/tests
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForAppReady } from './helpers';

async function getCurrentAreaFromLocalStorage(page: Page) {
  const learningStudio = await page.evaluate(() => localStorage.getItem('learningStudio'));
  const currentArea = learningStudio ? JSON.parse(learningStudio).currentArea : null;
  return currentArea;
}

async function clearCurrentArea(page: Page) {
  const state = await page.evaluate(() => localStorage.getItem('learningStudio'));
  const stateObj = state ? JSON.parse(state) : {};
  stateObj.currentArea = undefined;
  await page.evaluate((newState) => {
    localStorage.setItem('learningStudio', JSON.stringify(newState));
  }, stateObj);
}

// Clear localStorage before each test to ensure a clean state
test.beforeEach(async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await waitForAppReady(page);
  await page.waitForLoadState('networkidle');
});

test('remembers last studied area in localStorage', async ({ page }) => {
  await waitForAppReady(page);
  await page.getByTestId('area-log1').waitFor({ timeout: 15000 });
  await page.getByTestId('area-log1').click({ timeout: 10000 });
  await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
  await page.getByTestId('quiz-all-button').click({ timeout: 10000 });

  await page
    .waitForSelector('[data-testid="loading-spinner"]', { state: 'detached', timeout: 20000 })
    .catch(() => {});
  await page.getByTestId('question-view').waitFor({ timeout: 30000 });
  const opcionesBtn = page.getByTestId('options-button');
  await opcionesBtn.waitFor({ state: 'visible', timeout: 25000 });
  await opcionesBtn.click();

  await page.getByTestId('change-area-button').first().click({ timeout: 10000 });
  await page.getByTestId('area-ipc').waitFor({ timeout: 10000 });
  await page.getByTestId('area-ipc').click({ timeout: 10000 });
  await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
  await page.getByTestId('quiz-all-button').click({ timeout: 10000 });
  // Check that currentArea is updated
  const currentArea = await getCurrentAreaFromLocalStorage(page);
  expect(currentArea).toBe('ipc');
}, 25000);

test('remembers last studied area in localStorage going throu Options', async ({ page }) => {
  await waitForAppReady(page);
  await page.getByTestId('area-log1').waitFor({ timeout: 15000 });
  await page.getByTestId('area-log1').click({ timeout: 10000 });
  await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
  await page.getByTestId('quiz-all-button').click({ timeout: 10000 });
  await page
    .waitForSelector('[data-testid="loading-spinner"]', { state: 'detached', timeout: 20000 })
    .catch(() => {});
  await page.getByTestId('question-view').waitFor({ timeout: 30000 });
  try {
    await page.getByTestId('options-button').click({ timeout: 10000 });
  } catch {
    await page.getByTestId('options-button').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByTestId('options-button').click({ timeout: 10000 });
  }
  await page.getByTestId('change-area-button').first().click({ timeout: 10000 });
  await page.getByTestId('area-ipc').waitFor({ timeout: 10000 });
  await page.getByTestId('area-ipc').click();
  await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
  await page.getByTestId('quiz-all-button').click();
  // Check that currentArea is updated
  const currentArea = await getCurrentAreaFromLocalStorage(page);
  expect(currentArea).toBe('ipc');
}, 20000);

test('automatically returns to last studied area on app reload', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await page.getByTestId('area-log1').waitFor({ timeout: 15000 });
  await page.getByTestId('area-log1').click({ timeout: 10000 });
  await page.getByTestId('change-area-button').first().click({ timeout: 10000 });
  await page.getByTestId('area-ipc').waitFor({ timeout: 15000 });
  await page.getByTestId('area-ipc').click({ timeout: 10000 });
  // Reload page with increased timeout
  await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForLoadState('networkidle');
  // Should remember IPC in storage and land either on selection menu or quiz
  await expect
    .poll(async () => getCurrentAreaFromLocalStorage(page), { timeout: 15000 })
    .toBe('ipc');

  const selectionMenuVisible = await page
    .getByTestId('selection-menu')
    .isVisible()
    .catch(() => false);
  const questionViewVisible = await page
    .getByTestId('question-view')
    .isVisible()
    .catch(() => false);
  const areaSelectionVisible = await page
    .getByTestId('area-ipc')
    .isVisible()
    .catch(() => false);

  expect(selectionMenuVisible || questionViewVisible || areaSelectionVisible).toBe(true);
}, 40000);

test('restores to area selection if no previous area stored', async ({ page }) => {
  await clearCurrentArea(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
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
  await page.getByTestId('area-log1').waitFor({ timeout: 20000 });
  await page.getByTestId('area-log1').click({ timeout: 15000 });
  const selectionMenu = page.getByTestId('selection-menu');
  await selectionMenu.waitFor({ timeout: 20000 });
  await page.getByTestId('quiz-all-button').click({ timeout: 15000 });
  try {
    await selectionMenu.waitFor({ state: 'hidden', timeout: 5000 });
  } catch {
    await page.getByTestId('quiz-all-button').click({ timeout: 15000 });
    await selectionMenu.waitFor({ state: 'hidden', timeout: 10000 });
  }

  // Wait for quiz to load properly
  await page.waitForLoadState('networkidle');

  await page
    .waitForSelector('[data-testid="loading-spinner"]', { state: 'detached', timeout: 20000 })
    .catch(() => {});
  const questionView = page.getByTestId('question-view');
  const statusContinue = page.getByTestId('status-continue-button').first();
  if (await selectionMenu.isVisible()) {
    await page.getByTestId('quiz-all-button').click({ timeout: 15000 });
    await selectionMenu.waitFor({ state: 'hidden', timeout: 10000 });
  }
  try {
    await questionView.waitFor({ timeout: 20000 });
  } catch {
    await statusContinue.waitFor({ timeout: 20000 });
    if (await statusContinue.isVisible()) {
      await statusContinue.click({ timeout: 15000 });
      await questionView.waitFor({ timeout: 20000 });
    }
  }

  const trueButton = page.getByTestId('tf-answer-true');
  const mcqButton = page.getByTestId('mcq-answer-A');
  await expect(trueButton.or(mcqButton)).toBeVisible({ timeout: 20000 });
  if (await trueButton.isVisible()) {
    await trueButton.click({ timeout: 15000 });
  } else {
    await mcqButton.click({ timeout: 15000 });
  }
  await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 15000 });
  // Check we have progress
  const pageText = await page.locator('body').innerText();
  const pendientesMatch = pageText.match(/❓\s*(\d+)/);
  expect(pendientesMatch).not.toBeNull();
  const pendientes = pendientesMatch ? parseInt(pendientesMatch[1], 10) : null;

  // Switch to IPC area
  await page.getByTestId('options-button').click({ timeout: 15000 });
  await page.getByTestId('change-area-button').first().click({ timeout: 15000 });
  await page.getByTestId('area-ipc').waitFor({ timeout: 15000 });
  await page.getByTestId('area-ipc').click({ timeout: 15000 });
  await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
  await page.getByTestId('quiz-all-button').click({ timeout: 15000 });

  // Wait for IPC quiz to load properly
  await page.waitForLoadState('networkidle');
  await page.getByTestId('mcq-answer-A').waitFor({ timeout: 15000 });

  // Answer a question in IPC
  await page.getByTestId('mcq-answer-A').click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 15000 });
  // Switch back to Lógica I
  await page.getByTestId('options-button').click({ timeout: 15000 });
  await page.getByTestId('change-area-button').first().click({ timeout: 15000 });
  await page.getByTestId('area-log1').waitFor({ timeout: 15000 });
  await page.getByTestId('area-log1').click({ timeout: 15000 });
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
