import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import QuizApp from '../../src/app/QuizApp';
import { useAuth } from '../../src/app/hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../src/app/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock other hooks and components that QuizApp depends on
jest.mock('../../src/app/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}));

jest.mock('../../src/app/hooks/useQuizLogic', () => ({
  useQuizLogic: jest.fn(() => ({
    handleAnswer: jest.fn(),
    goToStatusWithResume: jest.fn(),
    resetQuiz: jest.fn(),
  })),
}));

jest.mock('../../src/app/hooks/useQuizPersistence', () => ({
  useQuizPersistence: jest.fn(() => ({
    // mock persistence functions if needed
  })),
}));

// Mock window.location.search only (jsdom limitation)
window.location.search = '';

describe('User Full Name Display', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for areas data
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display user full name from name attribute in logout button tooltip', async () => {
    // Mock user with full name in 'name' attribute
    const mockUser = {
      username: 'testuser123',
      attributes: {
        email: 'test@example.com',
        name: 'John Smith', // Google provides full name here
        given_name: 'John',
        family_name: 'Smith',
      },
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
    });

    await act(async () => {
      render(<QuizApp />);
    });

    // Check that user name is displayed next to the logout button
    const userName = screen.getByText('John Smith');
    expect(userName).toBeInTheDocument();

    // Check that logout button has "Sign out" title
    const logoutButton = screen.getByTitle('Sign out');
    expect(logoutButton).toBeInTheDocument();
  });

  it('should display combined given_name and family_name if name attribute is not available', async () => {
    // Mock user with separate given_name and family_name but no 'name'
    const mockUser = {
      username: 'testuser123',
      attributes: {
        email: 'test@example.com',
        given_name: 'Jane',
        family_name: 'Doe',
      },
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
    });

    await act(async () => {
      render(<QuizApp />);
    });

    // Check that user name is displayed next to the logout button
    const userName = screen.getByText('Jane Doe');
    expect(userName).toBeInTheDocument();

    // Check that logout button has "Sign out" title
    const logoutButton = screen.getByTitle('Sign out');
    expect(logoutButton).toBeInTheDocument();
  });

  it('should fallback to email if no name information is available', async () => {
    // Mock user with only email
    const mockUser = {
      username: 'testuser123',
      attributes: {
        email: 'fallback@example.com',
      },
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
    });

    await act(async () => {
      render(<QuizApp />);
    });

    // Check that user name is displayed next to the logout button
    const userName = screen.getByText('fallback@example.com');
    expect(userName).toBeInTheDocument();

    // Check that logout button has "Sign out" title
    const logoutButton = screen.getByTitle('Sign out');
    expect(logoutButton).toBeInTheDocument();
  });

  it('should display "Anónimo" for anonymous users', async () => {
    // Mock anonymous user
    const mockUser = {
      username: 'anonymous_user',
      isAnonymous: true,
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isAuthenticated: true,
      isAnonymous: true,
      isLoading: false,
    });

    await act(async () => {
      render(<QuizApp />);
    });

    // Check that anonymous name is displayed next to the logout button
    const userName = screen.getByText('Anónimo');
    expect(userName).toBeInTheDocument();

    // Check that logout button has "Sign out" title
    const logoutButton = screen.getByTitle('Sign out');
    expect(logoutButton).toBeInTheDocument();
  });
});
