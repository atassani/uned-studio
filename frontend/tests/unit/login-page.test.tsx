import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../../src/app/login/page';
import { AuthProvider } from '../../src/app/hooks/useAuth';

describe('LoginPage', () => {
  const previousLanguageSelector = process.env.NEXT_PUBLIC_LANGUAGE_SELECTION_ENABLED;

  afterEach(() => {
    process.env.NEXT_PUBLIC_LANGUAGE_SELECTION_ENABLED = previousLanguageSelector;
  });

  it('shows Google login and guest login options', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    expect(screen.getByText(/Iniciar sesión con Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Entrar como invitado/i)).toBeInTheDocument();
  });

  it('calls Google login when Google button is clicked', () => {
    // TODO: mock loginWithGoogle and assert it is called
    // This test will fail until implemented
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    fireEvent.click(screen.getByText(/Iniciar sesión con Google/i));
    // expect(loginWithGoogle).toHaveBeenCalled();
  });

  it('calls guest login when guest button is clicked', () => {
    // TODO: mock loginAsGuest and assert it is called
    // This test will fail until implemented
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    fireEvent.click(screen.getByText(/Entrar como invitado/i));
    // expect(loginAsGuest).toHaveBeenCalled();
  });

  it('shows language selector when language selection is enabled', () => {
    process.env.NEXT_PUBLIC_LANGUAGE_SELECTION_ENABLED = 'true';
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    expect(screen.getByTestId('login-page-language-selector')).toBeInTheDocument();
  });
});
