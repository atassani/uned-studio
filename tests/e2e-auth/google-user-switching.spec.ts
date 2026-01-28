import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForAppReady } from '../e2e/helpers';

test.describe('Google User Switching', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
    await waitForAppReady(page);
  });

  test('should allow Google user switching after logout', async ({ page }) => {
    // Navigate to login page
    await expect(page.getByText('🎓 UNED Studio')).toBeVisible();
    
    // Mock initial Google sign-in
    await page.route('**/oauth2/authorize**', (route) => {
      // First login - simulate automatic login with current Google user
      route.fulfill({
        status: 302,
        headers: {
          'Location': `${page.url()}?code=mock_auth_code&state=mock_state`
        }
      });
    });

    // Click Google sign-in button
    await page.getByRole('button', { name: 'Iniciar sesión con Google' }).click();
    
    // Wait for login to complete (this would normally redirect back from Google)
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 10000 });
    
    // Find and click logout button
    const logoutButton = page.getByRole('button').filter({ hasText: /Cerrar sesión|Sign out/ });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Should return to login page
    await expect(page.getByText('🎓 UNED Studio')).toBeVisible();
    
    // Mock second Google sign-in - should now allow account selection
    let isAccountSelectionShown = false;
    await page.route('**/oauth2/authorize**', (route) => {
      const url = route.request().url();
      // Check if the prompt=select_account parameter is included
      if (url.includes('prompt=select_account')) {
        isAccountSelectionShown = true;
      }
      
      // Simulate account selection page
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <h1>Select an account</h1>
              <div id="account-selection">Choose an account to continue</div>
              <button onclick="window.location.href='${page.url()}?code=mock_auth_code_2&state=mock_state'">Different User Account</button>
            </body>
          </html>
        `
      });
    });
    
    // Click Google sign-in button again
    await page.getByRole('button', { name: 'Iniciar sesión con Google' }).click();
    
    // Verify that account selection was triggered
    expect(isAccountSelectionShown).toBe(true);
    
    // Should see account selection interface
    await expect(page.getByText('Select an account')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#account-selection')).toBeVisible();
  });

  test('should include Google logout URL in logout flow', async ({ page }) => {
    // Navigate to login page
    await expect(page.getByText('🎓 UNED Studio')).toBeVisible();
    
    // Track Google logout URL access
    let googleLogoutCalled = false;
    await page.route('**/accounts.google.com/logout**', (route) => {
      googleLogoutCalled = true;
      route.fulfill({ status: 200, body: 'OK' });
    });
    
    // Mock Google sign-in
    await page.route('**/oauth2/authorize**', (route) => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': `${page.url()}?code=mock_auth_code&state=mock_state`
        }
      });
    });

    // Sign in
    await page.getByRole('button', { name: 'Iniciar sesión con Google' }).click();
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 10000 });
    
    // Logout
    const logoutButton = page.getByRole('button').filter({ hasText: /Cerrar sesión|Sign out/ });
    await logoutButton.click();
    
    // Wait a moment for logout process
    await page.waitForTimeout(1000);
    
    // Verify Google logout was called
    expect(googleLogoutCalled).toBe(true);
  });
});