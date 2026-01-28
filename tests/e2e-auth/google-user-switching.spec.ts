import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForAppReady } from '../e2e/helpers';

test.describe('Google User Switching', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
    await waitForAppReady(page);
  });

  test('should include prompt=select_account after logout', async ({ page }) => {
    // Navigate to login page
    await expect(page.getByText('🎓 UNED Studio')).toBeVisible();

    // Simulate localStorage state as if user had previously logged out
    await page.addInitScript(() => {
      localStorage.setItem('hasLoggedOutFromGoogle', 'true');
    });

    // Track OAuth URL to verify prompt parameter
    let foundSelectAccountPrompt = false;
    await page.route('**/oauth2/authorize**', (route) => {
      const url = route.request().url();
      if (url.includes('prompt=select_account')) {
        foundSelectAccountPrompt = true;
      }

      // Continue with normal OAuth flow
      route.continue();
    });

    // Reload page to apply localStorage changes
    await page.reload();
    await waitForAppReady(page);

    // Click Google sign-in button
    await page.getByRole('button', { name: 'Iniciar sesión con Google' }).click();

    // Verify that prompt=select_account was included in OAuth URL
    expect(foundSelectAccountPrompt).toBe(true);
  });

  test('should not include prompt=select_account on first login', async ({ page }) => {
    // Navigate to login page
    await expect(page.getByText('🎓 UNED Studio')).toBeVisible();

    // Ensure localStorage is clear (simulating first time user)
    await page.addInitScript(() => {
      localStorage.removeItem('hasLoggedOutFromGoogle');
    });

    // Track OAuth URL to verify no prompt parameter
    let foundSelectAccountPrompt = false;
    await page.route('**/oauth2/authorize**', (route) => {
      const url = route.request().url();
      if (url.includes('prompt=select_account')) {
        foundSelectAccountPrompt = true;
      }

      // Continue with normal OAuth flow
      route.continue();
    });

    // Reload page to apply localStorage changes
    await page.reload();
    await waitForAppReady(page);

    // Click Google sign-in button
    await page.getByRole('button', { name: 'Iniciar sesión con Google' }).click();

    // Verify that prompt=select_account was NOT included in OAuth URL
    expect(foundSelectAccountPrompt).toBe(false);
  });
});
