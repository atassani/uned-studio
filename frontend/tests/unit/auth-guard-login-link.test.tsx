'use client';

import { render, screen } from '@testing-library/react';
import { AuthGuard } from '../../src/app/components/AuthGuard';

jest.mock('../../src/app/hooks/useAuth', () => ({
  useAuth: jest.fn(),
  getCognitoLoginUrl: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    push: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

const { useAuth, getCognitoLoginUrl } = jest.requireMock('../../src/app/hooks/useAuth');

describe('AuthGuard login link', () => {
  const previousLanguageSelector = process.env.NEXT_PUBLIC_LANGUAGE_SELECTION_ENABLED;

  afterEach(() => {
    process.env.NEXT_PUBLIC_LANGUAGE_SELECTION_ENABLED = previousLanguageSelector;
  });

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

  it('shows language selector when language selection is enabled', () => {
    process.env.NEXT_PUBLIC_LANGUAGE_SELECTION_ENABLED = 'true';
    render(<AuthGuard>content</AuthGuard>);
    expect(screen.getByTestId('login-language-selector')).toBeInTheDocument();
  });
});
