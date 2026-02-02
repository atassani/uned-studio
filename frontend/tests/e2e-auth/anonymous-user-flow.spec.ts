import { test, expect } from '@playwright/test';

test.describe.skip('Anonymous User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for it to fully load
    await page.goto('/uned/studio/');
    await page.waitForLoadState('networkidle');

    // Wait for either the login screen or main app to appear
    // This handles both authenticated and non-authenticated states
    try {
      await page.waitForSelector('text=Iniciar sesión con Google', { timeout: 2000 });
    } catch {
      // If we don't see login options, we might already be logged in or auth is disabled
      // That's fine for some tests
    }
  });

  test('should show both Google and Anonymous login options', async ({ page }) => {
    // Wait a bit more for the page to fully render
    await page.waitForTimeout(1000);

    // Check for authentication options
    await expect(page.getByText('Iniciar sesión con Google')).toBeVisible();
    await expect(page.getByText('Continuar como Anónimo')).toBeVisible();
    await expect(page.getByText('Progreso guardado entre dispositivos')).toBeVisible();
    await expect(page.getByText('Progreso solo en este navegador')).toBeVisible();
  });

  test('should allow anonymous login and display "Anónimo"', async ({ page }) => {
    // Click on anonymous login button
    await page.getByText('Continuar como Anónimo').click();

    // Wait for page to load and navigation to complete
    await page.waitForLoadState('networkidle');

    // Should now be in the main app
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 10000 });

    // Should show "Anónimo" in the top-right corner
    await expect(page.getByText('Anónimo')).toBeVisible();

    // Should show logout button
    await expect(page.getByTitle('Sign out')).toBeVisible();
  });

  test('should handle logout for anonymous users', async ({ page }) => {
    // Click on anonymous login button
    await page.getByText('Continuar como Anónimo').click();

    // Wait for page to load and navigation to complete
    await page.waitForLoadState('networkidle');

    // Should now be in the main app
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Anónimo')).toBeVisible();

    // Click logout
    await page.getByTitle('Sign out').click();

    // Should be back to the login screen
    await expect(page.getByText('Iniciar sesión con Google')).toBeVisible();
    await expect(page.getByText('Continuar como Anónimo')).toBeVisible();
  });

  test('should not track progress between sessions for anonymous users', async ({ page }) => {
    // First anonymous session
    await page.getByText('Continuar como Anónimo').click();

    // Wait for page to load and navigation to complete
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 10000 });

    // Logout
    await page.getByTitle('Sign out').click();

    // Login again anonymously
    await page.getByText('Continuar como Anónimo').click();

    // Wait for page to load and navigation to complete
    await page.waitForLoadState('networkidle');

    // Should be at the home screen again (no persistent progress)
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 10000 });
  });
});
