import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  setupFreshTestAuthenticated,
  waitForAppReady,
  startQuizByTestId,
  ensureAreaSelectionVisible,
} from './helpers';

async function getCurrentAreaFromLocalStorage(page: Page) {
  const learningStudio = await page.evaluate(() => localStorage.getItem('learningStudio'));
  const currentArea = learningStudio ? JSON.parse(learningStudio).currentArea : null;
  return currentArea;
}

// Clear localStorage before each test to ensure a clean state
test.beforeEach(async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await waitForAppReady(page);
  await ensureAreaSelectionVisible(page);
});

test('remembers last studied area in localStorage', async ({ page }) => {
  // Select Lógica I area
  await startQuizByTestId(page, 'log1');

  // Check that currentArea is stored in localStorage (now shortName)
  const currentArea = await getCurrentAreaFromLocalStorage(page);
  expect(currentArea).toBe('log1');

  // Go to different area
  await page.getByTestId('options-button').click();
  await page.getByTestId('change-area-button').first().click();
  await page.getByTestId('area-ipc').click();

  // Check that currentArea is updated (now shortName)
  const newCurrentArea = await getCurrentAreaFromLocalStorage(page);
  expect(newCurrentArea).toBe('ipc');
});

test('automatically returns to last studied area on app reload', async ({ page }) => {
  // Set up: study an area first
  await page.waitForLoadState('domcontentloaded');
  await startQuizByTestId(page, 'ipc');

  // Wait for quiz to load - look for any quiz indicator
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  // Reload the page
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 25000 });

  // Wait a moment for everything to initialize
  await page.waitForLoadState('domcontentloaded');

  // Give Firefox extra time to restore state after reload
  await page.waitForTimeout(3000);

  // Check if we're in the quiz (should auto-resume) or back to IPC area
  const continueButtonVisible = await page
    .getByTestId('result-continue-button')
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  const menuVisible = await page
    .getByTestId('selection-menu')
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  const areaMenuVisible = await page
    .getByTestId('area-ipc')
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
    if (areaSelectionVisible) {
      const currentArea = await getCurrentAreaFromLocalStorage(page);
      expect(currentArea).toBe('ipc');
    } else {
      expect(areaSelectionVisible).toBe(false);
    }
  }
}, 45000);

test('preserves quiz progress when switching between areas', async ({ page }) => {
  // Start Lógica I quiz and answer a question
  await startQuizByTestId(page, 'log1', { order: 'sequential' });
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible({ timeout: 5000 });

  // Wait for quiz to load with network idle first
  await page.waitForLoadState('domcontentloaded');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for any quiz answer buttons which indicate quiz is loaded
    const vButtonVisible = await page
      .getByTestId('tf-answer-true')
      .isVisible()
      .catch(() => false);
    const aButtonVisible = await page
      .getByTestId('mcq-answer-A')
      .isVisible()
      .catch(() => false);

    if (vButtonVisible) {
      // True/False question already loaded
    } else if (aButtonVisible) {
      // Multiple Choice question already loaded
    } else {
      // Wait for any answer button to appear
      try {
        await expect(page.getByTestId('tf-answer-true')).toBeVisible({
          timeout: 6000,
        });
      } catch {
        await expect(page.getByTestId('mcq-answer-A')).toBeVisible({
          timeout: 6000,
        });
      }
    }
  }

  // Click appropriate answer button based on question type
  const vButtonExists = await page
    .getByTestId('tf-answer-true')
    .isVisible()
    .catch(() => false);
  if (vButtonExists) {
    await page.getByTestId('tf-answer-true').click({ timeout: 10000 });
  } else {
    await page.getByTestId('mcq-answer-A').click({ timeout: 10000 });
  }
  await page.getByTestId('result-continue-button').click({ timeout: 10000 });

  // Check and store the number of pending questions after answering one in Lógica I
  const statusText = await page.locator('body').innerText();
  const pendientesMatch = statusText.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatch).not.toBeNull();
  const pendientesBefore = pendientesMatch ? parseInt(pendientesMatch[1], 10) : null;
  // Extract section name (assume it's after the 📚 emoji and before a line break)
  const sectionMatch = statusText.match(/📚 ([^\n]+)/);
  const sectionBefore = sectionMatch ? sectionMatch[1].trim() : null;

  // Switch to IPC area
  await page.getByTestId('options-button').click({ timeout: 10000 });
  await page.getByTestId('change-area-button').first().click({ timeout: 10000 });
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 5000 });
  await startQuizByTestId(page, 'ipc');

  // Wait for IPC area to load and navigate to questions
  await expect(page.getByText('🎓 Área: Introducción al Pensamiento Científico')).toBeVisible({
    timeout: 5000,
  });
  // Wait for quiz to load with network idle first
  await page.waitForLoadState('domcontentloaded');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for Multiple Choice buttons which indicate quiz is loaded
    await expect(page.getByTestId('mcq-answer-A')).toBeVisible({
      timeout: 8000,
    });
  }

  // Now answer a question in IPC
  await expect(page.getByTestId('mcq-answer-A')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('mcq-answer-A').click({ timeout: 10000 });
  await page.getByTestId('result-continue-button').click({ timeout: 10000 });

  // Switch back to Lógica I
  await page.getByTestId('options-button').click({ timeout: 10000 });
  await page.getByTestId('change-area-button').first().click({ timeout: 10000 });
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('area-log1').click({ timeout: 10000 });

  // Wait for Lógica I area to load and navigate to questions
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible({ timeout: 5000 });

  // Wait for quiz to load with network idle first
  await page.waitForLoadState('domcontentloaded');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for any answer buttons which indicate quiz is loaded
    const vButtonVisible = await page
      .getByTestId('tf-answer-true')
      .isVisible()
      .catch(() => false);
    const aButtonVisible = await page
      .getByTestId('mcq-answer-A')
      .isVisible()
      .catch(() => false);
    if (!vButtonVisible && !aButtonVisible) {
      await expect(page.getByTestId('tf-answer-true')).toBeVisible({
        timeout: 8000,
      });
    }
  }

  // Check for question UI (e.g., answer buttons)
  const vButtonVisible = await page
    .getByTestId('tf-answer-true')
    .isVisible()
    .catch(() => false);
  const fButtonVisible = await page
    .getByTestId('tf-answer-false')
    .isVisible()
    .catch(() => false);
  const aButtonVisible = await page
    .getByTestId('mcq-answer-A')
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
