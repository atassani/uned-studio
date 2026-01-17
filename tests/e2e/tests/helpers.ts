import { Page, expect } from '@playwright/test';
const homePath = process.env.BASE_PATH || '';

/**
 * Common test setup - navigate to home and clear state for fresh start
 */
export async function setupFreshTest(page: Page) {
  await page.goto(homePath);
  // Clear localStorage for clean state
  await page.evaluate(() => localStorage.clear());
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
  
  // Wait for either area selection or quiz interface to appear
  await expect(
    page.getByText('¿Qué quieres estudiar?').or(
      page.getByText('¿Cómo quieres las preguntas?')
    ).or(
      page.locator('.question-text')
    ).first() // Take the first match to avoid strict mode violations
  ).toBeVisible();
}

/**
 * Navigate to a study area and start quiz.
 * Encapsulates the common pattern used across many tests.
 */
export async function startQuiz(page: Page, areaName: string, quizType: 'Todas las preguntas' | 'Seleccionar secciones' = 'Todas las preguntas') {
  await waitForAppReady(page);
  
  await page.getByRole('button', { name: new RegExp(areaName) }).click();
  await page.getByRole('button', { name: quizType }).click();
  
  await waitForQuizReady(page);
}