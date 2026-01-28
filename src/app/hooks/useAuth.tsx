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

// Only configure Amplify if auth is not disabled
const isAuthDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
if (!isAuthDisabled) {
  Amplify.configure(authConfig, { ssr: true });
}

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

  // Check localStorage for previous Google logout state
  const [hasLoggedOutFromGoogle, setHasLoggedOutFromGoogle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hasLoggedOutFromGoogle') === 'true';
    }
    return false;
  });

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
      let userWithAttributes: UserWithAttributes = { ...currentUser };

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

          userWithAttributes = { ...currentUser, attributes } as UserWithAttributes;
        } catch (tokenError) {
          console.warn('Could not parse ID token:', tokenError);
        }
      }

      // Fallback: try fetchUserAttributes if JWT parsing failed
      if (!userWithAttributes.attributes?.name && !userWithAttributes.attributes?.email) {
        try {
          const attributes = await fetchUserAttributes();
          userWithAttributes = { ...currentUser, attributes } as UserWithAttributes;
        } catch (attrError) {
          console.warn('Could not fetch user attributes:', attrError);
        }
      }

      setUser(userWithAttributes);
      console.log('Final user object:', userWithAttributes);
      setIsAuthenticated(!!session.tokens);

      // Clear the Google logout flag since user has successfully logged in
      if (session.tokens && hasLoggedOutFromGoogle) {
        setHasLoggedOutFromGoogle(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('hasLoggedOutFromGoogle');
        }
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const login = () => {
    if (isAuthDisabled) return;

    // If user has previously logged out from Google, force account selection
    if (hasLoggedOutFromGoogle) {
      // Use Cognito's OAuth URL with prompt=select_account to show Google account picker
      const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
      const redirectUri = encodeURIComponent(
        process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || window.location.origin
      );
      const state = encodeURIComponent(Math.random().toString(36).substring(2, 15));

      const oauthUrl =
        `https://${domain}/oauth2/authorize?` +
        `identity_provider=Google&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `scope=openid+email+profile&` +
        `state=${state}&` +
        `prompt=select_account`;

      if (typeof window !== 'undefined') {
        window.location.href = oauthUrl;
      }
    } else {
      signInWithRedirect({ provider: 'Google' });
    }
  };

  const loginAnonymously = () => {
    // Set anonymous user state
    setUser({
      username: 'anonymous',
      isAnonymous: true,
      attributes: {
        name: 'Anónimo',
      },
    });
    setIsAuthenticated(true);
  };

  const logout = async () => {
    if (isAuthDisabled) return;

    // If user is anonymous, just clear state without going through Cognito
    if (user?.isAnonymous) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    try {
      // Mark that user has logged out from Google to force account selection next time
      if (user && !user.isAnonymous) {
        setHasLoggedOutFromGoogle(true);

        // Persist the logout state to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('hasLoggedOutFromGoogle', 'true');
        }
      }

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
