'use client';

import { render, screen } from '@testing-library/react';
import { AuthGuard } from '../../src/app/components/AuthGuard';

jest.mock('../../src/app/hooks/useAuth', () => ({
  useAuth: jest.fn(),
  getCognitoLoginUrl: jest.fn(),
}));

const { useAuth, getCognitoLoginUrl } = jest.requireMock('../../src/app/hooks/useAuth');

describe('AuthGuard login link', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      loginWithGoogle: jest.fn(),
      loginAsGuest: jest.fn(),
    });
    getCognitoLoginUrl.mockReturnValue('https://example.auth/oauth2/authorize?x=1');
  });

  it('renders a hosted ui link for google login', () => {
    render(<AuthGuard>content</AuthGuard>);
    const link = screen.getByTestId('google-login-btn');
    expect(link.getAttribute('href')).toBe('https://example.auth/oauth2/authorize?x=1');
  });
});
