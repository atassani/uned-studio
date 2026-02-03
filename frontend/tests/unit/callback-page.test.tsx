import { render, waitFor } from '@testing-library/react';
import CallbackPage from '../../src/app/auth/callback/page';
import { AuthProvider } from '../../src/app/hooks/useAuth';

describe('CallbackPage', () => {
  let replaceSpy: jest.SpyInstance;
  let navigateMock: jest.Mock;
  beforeAll(() => {
    navigateMock = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id_token: 'mock-jwt',
        access_token: 'mock-access',
        refresh_token: 'mock-refresh',
      }),
    });
    // Mock window.alert
    window.alert = jest.fn();
    // Set required env variables
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN = 'https://example.com';
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'clientid';
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN = 'https://app.com/studio';
  });
  afterAll(() => {
    // nothing to restore
  });

  it('exchanges code for tokens and redirects', async () => {
    render(
      <AuthProvider>
        <CallbackPage navigate={navigateMock} code="abc123" />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalled();
    });
  });
});
