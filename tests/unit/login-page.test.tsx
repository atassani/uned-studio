import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../../src/app/login/page';
import { AuthProvider } from '../../src/app/hooks/useAuth';

describe('LoginPage', () => {
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
});
