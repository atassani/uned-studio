'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// OAuth logic removed: Amplify/Cognito imports and config

// Extended user type that includes attributes
interface UserWithAttributes {
  username: string;
  userId?: string;
  signInDetails?: any;
  attributes?: {
    name?: string;
    given_name?: string;
    family_name?: string;
    email?: string;
    [key: string]: any;
  };
  isAnonymous?: boolean;
}

const isAuthDisabled = true; // Auth always disabled; backend handles auth

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserWithAttributes | null;
  login: () => void;
  loginAnonymously: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(isAuthDisabled ? true : false);
  const [isLoading, setIsLoading] = useState(isAuthDisabled ? false : true);
  const [user, setUser] = useState<UserWithAttributes | null>(
    isAuthDisabled ? { username: 'test-user' } : null
  );
  const [hasLoggedOutFromGoogle, setHasLoggedOutFromGoogle] = useState(false);

  // No backend auth check; always anonymous or test user

  const login = () => {
    // No-op: handled by backend
  };

  const loginAnonymously = () => {
    setUser({
      username: 'anonymous',
      isAnonymous: true,
      attributes: {
        name: 'Anónimo',
      },
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, loginAnonymously, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
