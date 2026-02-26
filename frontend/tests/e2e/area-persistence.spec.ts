// moved from tests/e2e/tests
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForAppReady, startQuizByTestId } from './helpers';

async function getCurrentAreaFromLocalStorage(page: Page) {
  const learningStudio = await page.evaluate(() => localStorage.getItem('learningStudio'));
  const currentArea = learningStudio ? JSON.parse(learningStudio).currentArea : null;
  return currentArea;
}

async function getPendingCountForArea(page: Page, areaShortName: string) {
  return page.evaluate((shortName) => {
    const raw = localStorage.getItem('learningStudio');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const quizStatus = parsed?.areas?.[shortName]?.quizStatus;
    if (!quizStatus || typeof quizStatus !== 'object') return null;
    return Object.values(quizStatus).filter((value) => value === 'pending').length;
  }, areaShortName);
}

// Clear localStorage before each test to ensure a clean state
test.beforeEach(async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await waitForAppReady(page);
  await page.waitForLoadState('domcontentloaded');
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
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('area-log1').waitFor({ timeout: 15000 });
  await page.getByTestId('area-log1').click({ timeout: 10000 });
  await page.getByTestId('change-area-button').first().click({ timeout: 10000 });
  await page.getByTestId('area-ipc').waitFor({ timeout: 15000 });
  await page.getByTestId('area-ipc').click({ timeout: 10000 });
  // Reload page with increased timeout
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
  await waitForAppReady(page);
  const configViewAfterReload = page.getByTestId('area-configuration-view');
  if (await configViewAfterReload.isVisible().catch(() => false)) {
    await page.getByTestId('area-config-accept').click();
    await page.waitForTimeout(300);
  }
  // Should remember IPC in storage and land either on selection menu or quiz
  await expect
    .poll(async () => getCurrentAreaFromLocalStorage(page), { timeout: 15000 })
    .toBe('ipc');
}, 40000);

test('preserves quiz progress when switching between areas', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
  });
  // Reload so app state is rebuilt from cleared storage
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
  await waitForAppReady(page);
  const areaConfigView = page.getByTestId('area-configuration-view');
  if (await areaConfigView.isVisible().catch(() => false)) {
    await page.getByTestId('area-config-accept').click();
  }
  await startQuizByTestId(page, 'log1', { order: 'sequential' });
  const selectionMenu = page.getByTestId('selection-menu');
  try {
    await selectionMenu.waitFor({ state: 'hidden', timeout: 5000 });
  } catch {
    await page.getByTestId('quiz-all-button').click({ timeout: 15000 });
    await selectionMenu.waitFor({ state: 'hidden', timeout: 10000 });
  }

  // Wait for quiz to load properly
  await page.waitForLoadState('domcontentloaded');

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
  // Check we have persisted progress in localStorage
  const pendientes = await getPendingCountForArea(page, 'log1');
  expect(pendientes).not.toBeNull();

  // Switch to IPC area
  await page.getByTestId('options-button').click({ timeout: 15000 });
  await page.getByTestId('change-area-button').first().click({ timeout: 15000 });
  await startQuizByTestId(page, 'ipc');

  // Wait for IPC quiz to load properly
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('mcq-answer-A').waitFor({ timeout: 15000 });

  // Answer a question in IPC
  await page.getByTestId('mcq-answer-A').click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 15000 });
  // Switch back to Lógica I
  await page.getByTestId('options-button').click({ timeout: 15000 });
  await page.getByTestId('change-area-button').first().click({ timeout: 15000 });
  await page.getByTestId('area-log1').waitFor({ timeout: 15000 });
  await page.getByTestId('area-log1').click({ timeout: 15000, force: true });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  // The persisted pending count for LOG1 should remain unchanged after area switching
  const pendientesAfter = await getPendingCountForArea(page, 'log1');
  expect(pendientesAfter).not.toBeNull();
  expect(pendientesAfter).toBe(pendientes);
}, 50000);
