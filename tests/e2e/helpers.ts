import { Page, expect } from '@playwright/test';
const homePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Common test setup - navigate to home and clear state for fresh start
 */
export async function setupFreshTest(page: Page, seed?: string) {
  // Build the URL with seed if provided
  let url = homePath;
  if (seed) {
    url += (url.includes('?') ? '&' : '?') + `seed=${encodeURIComponent(seed)}`;
  }
  await page.goto(url);
  // Clear localStorage for clean state
  await page.evaluate(() => localStorage.clear());
  // Reload the page to ensure clean state and seed param
  await page.goto(url);
}

/**
 * Test setup that makes sure any previous information is cleared.
 */
export async function setupSuperFreshTest(page: Page, seed?: string) {
  try {
    // Build the URL with seed if provided
    let url = homePath;
    if (seed) {
      url += (url.includes('?') ? '&' : '?') + `seed=${encodeURIComponent(seed)}`;
    }

    // Go to the URL (with or without seed)
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Clear localStorage, sessionStorage, and cookies if accessible
    await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    });
    await page.context().clearCookies();

    // Reload the page to reset the app state, with the seed param if provided
    await page.goto(url, { waitUntil: 'networkidle' });

    // Verify the app is in the initial state (area selection screen)
    await page.waitForSelector('text=¿Qué quieres estudiar?', { timeout: 10000 });
  } catch (error) {
    throw error; // Re-throw the error to ensure test fails with context
  }
}

/**
 * Wait for the quiz application to be in a ready state.
 * This is a more reliable way to wait than checking for specific DOM elements.
 */
export async function waitForAppReady(page: Page) {
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Wait for the main app container to be visible
  await expect(page.locator('body')).toBeVisible();

  // Wait a moment for any JavaScript initialization
  await page.waitForTimeout(500);
}

/**
 * Wait for quiz to be loaded and ready for interaction.
 * This checks for either area selection or quiz interface.
 */
export async function waitForQuizReady(page: Page) {
  await waitForAppReady(page);

  try {
    // Wait for either area selection or quiz interface to appear
    await expect(
      page
        .getByText('¿Qué quieres estudiar?')
        .or(page.getByText('¿Cómo quieres las preguntas?'))
        .or(page.locator('.question-text'))
        .first() // Take the first match to avoid strict mode violations
    ).toBeVisible();
  } catch (error) {
    // Optionally log error for debugging
    throw error; // Re-throw the error to ensure test fails with context
  }
}

/**
 * Navigate to a study area and start quiz.
 * Encapsulates the common pattern used across many tests.
 */
export async function startQuiz(
  page: Page,
  areaName: string,
  quizType: 'Todas las preguntas' | 'Seleccionar secciones' = 'Todas las preguntas'
) {
  await waitForAppReady(page);

  await page.getByRole('button', { name: new RegExp(areaName) }).click();
  await page.getByRole('button', { name: quizType }).click();

  await waitForQuizReady(page);
}
