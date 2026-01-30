import { test, expect } from '@playwright/test';

// This test simulates the Cognito login callback (bypassing real Google/Cognito UI)
test.describe('Cognito login flow (mocked)', () => {
  test('sets user as authenticated after callback', async ({ page }) => {
    // Log all outgoing requests for debugging
    page.on('request', (request) => {
      console.log('Request:', request.url());
    });
    // Inject required Cognito env variables into the browser context
    await page.addInitScript(() => {
      window.process = {
        env: {
          NEXT_PUBLIC_COGNITO_DOMAIN: 'https://mock-cognito',
          NEXT_PUBLIC_COGNITO_CLIENT_ID: 'mock-client-id',
          NEXT_PUBLIC_REDIRECT_SIGN_IN: 'http://localhost:3000/',
        },
      };
    });
    // Mock the token and userinfo endpoints BEFORE navigation
    await page.route('**/oauth2/token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id_token: 'mock.jwt.token' }),
      });
    });
    await page.route('**/oauth2/userinfo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ email: 'e2e@example.com' }),
      });
    });

    // Simulate the callback URL with a code param
    await page.goto('/auth/callback?code=mock_code');
    // Debug: print current URL after callback
    console.log('After callback, URL:', page.url());

    // Wait for the callback effect to complete
    await page.waitForTimeout(1000);
    // Debug: print JWT from localStorage after callback
    const jwt = await page.evaluate(() => localStorage.getItem('jwt'));
    console.log('JWT in localStorage after callback:', jwt);
    // Navigate to the homepage to check for the authenticated user
    // Use base path for homepage navigation
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/';
    await page.goto(basePath);
    await expect(page.locator('[data-testid="auth-user"]')).toContainText('e2e@example.com', {
      timeout: 10000,
    });
  });
});
