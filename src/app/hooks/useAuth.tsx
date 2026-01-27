'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import {
  signInWithRedirect,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import { authConfig } from '../auth-config';

// Only configure Amplify if auth is not disabled
const isAuthDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
if (!isAuthDisabled) {
  Amplify.configure(authConfig, { ssr: true });
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(isAuthDisabled ? true : false);
  const [isLoading, setIsLoading] = useState(isAuthDisabled ? false : true);
  const [user, setUser] = useState<any>(isAuthDisabled ? { username: 'test-user' } : null);

  useEffect(() => {
    if (!isAuthDisabled) {
      checkAuth();
    }
  }, []);

  async function checkAuth() {
    if (isAuthDisabled) return;

    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      // Try to extract user info from the JWT tokens
      let userWithAttributes = { ...currentUser };

      if (session.tokens?.idToken) {
        try {
          // Parse the JWT token to get user info
          const payload = JSON.parse(atob(session.tokens.idToken.toString().split('.')[1]));
          console.log('ID Token payload:', payload);

          // Extract name information from token
          const attributes: any = {};
          if (payload.name) attributes.name = payload.name;
          if (payload.given_name) attributes.given_name = payload.given_name;
          if (payload.family_name) attributes.family_name = payload.family_name;
          if (payload.email) attributes.email = payload.email;

          userWithAttributes = { ...currentUser, attributes };
        } catch (tokenError) {
          console.warn('Could not parse ID token:', tokenError);
        }
      }

      // Fallback: try fetchUserAttributes if JWT parsing failed
      if (!userWithAttributes.attributes?.name && !userWithAttributes.attributes?.email) {
        try {
          const attributes = await fetchUserAttributes();
          userWithAttributes = { ...currentUser, attributes };
        } catch (attrError) {
          console.warn('Could not fetch user attributes:', attrError);
        }
      }

      setUser(userWithAttributes);
      console.log('Final user object:', userWithAttributes);
      setIsAuthenticated(!!session.tokens);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const login = () => {
    if (isAuthDisabled) return;
    signInWithRedirect({ provider: 'Google' });
  };

  const logout = async () => {
    if (isAuthDisabled) return;
    try {
      await signOut({
        global: true, // This ensures a full logout from Cognito
      });
      setIsAuthenticated(false);
      setUser(null);
      // Force redirect to avoid any caching issues
      if (typeof window !== 'undefined') {
        window.location.href = process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if signOut fails, clean up local state and redirect
      setIsAuthenticated(false);
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || '/';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
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
