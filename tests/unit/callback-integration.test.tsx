import React from 'react';
import 'whatwg-fetch';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/app/hooks/useAuth';
import CallbackPage from '../../src/app/auth/callback/page';

// Helper component to expose auth state
function AuthStateViewer() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="auth-user">{user ? user.username || user.attributes?.email : 'none'}</span>
    </div>
  );
}

describe('Cognito callback integration', () => {
  it('sets user as authenticated after successful callback', async () => {
    // Simulate a valid code and navigation
    const code = 'valid_code';
    const navigate = jest.fn();

    // Polyfill fetch if not present
    if (!global.fetch) {
      global.fetch = require('whatwg-fetch');
    }
    // Mock window.alert
    window.alert = jest.fn();
    // Set required env vars
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN = 'https://mock-cognito';
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'mock-client-id';
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN = 'http://localhost/callback';
    // Mock the token exchange and user info fetch
    jest.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.toString().includes('/oauth2/token')) {
        return Promise.resolve(
          new Response(JSON.stringify({ id_token: 'mock.jwt.token' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      if (url.toString().includes('/userinfo')) {
        return Promise.resolve(
          new Response(JSON.stringify({ email: 'e2e@example.com' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Render with AuthProvider
    const { getByTestId } = render(
      <AuthProvider>
        <CallbackPage code={code} navigate={navigate} />
        <AuthStateViewer />
      </AuthProvider>
    );

    // Wait for auth state to update
    await waitFor(() => {
      expect(getByTestId('auth-status').textContent).toBe('yes');
      expect(getByTestId('auth-user').textContent).toBe('e2e@example.com');
    });
  });
});
