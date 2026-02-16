'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storage } from '../storage';

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
  isGuest?: boolean;
}

// Auth is always enabled; backend handles auth

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserWithAttributes | null;
  login: () => void;
  loginWithGoogle: () => void;
  loginAsGuest: () => void;
  logout: () => void;
  setUser?: (user: UserWithAttributes | null) => void;
  setIsAuthenticated?: (auth: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getCognitoLoginUrl(): string | null {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN;
  if (!domain || !clientId || !redirectUri) {
    return null;
  }
  return (
    `${domain}/oauth2/authorize?response_type=code&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&identity_provider=Google&scope=openid+email+profile`
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserWithAttributes | null>(null);
  const [hasLoggedOutFromGoogle, setHasLoggedOutFromGoogle] = useState(false);

  // Restore auth state from localStorage JWT on load, or handle OAuth code
  useEffect(() => {
    const jwt = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
    const authCookie =
      typeof document !== 'undefined'
        ? document.cookie.split(';').some((part) => part.trim() === 'auth=1')
        : false;
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN;
    if (!domain || !clientId || !redirectUri) {
      setIsLoading(false);
      return;
    }

    // Helper: parse JWT and extract user info
    const parseJwt = (token: string) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    };

    // 1. If auth cookie exists, mark authenticated
    if (authCookie) {
      setUser({
        username: 'google-user',
        attributes: {},
        isGuest: false,
      });
      setIsAuthenticated(true);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code')) {
          urlParams.delete('code');
          const newUrl =
            window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
        }
      }
      return;
    }

    // 2. If JWT exists, restore user
    if (jwt) {
      const userInfo = parseJwt(jwt);
      if (userInfo) {
        setUser({
          username: userInfo.email || userInfo.sub || 'google-user',
          attributes: userInfo,
          isGuest: false,
        });
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
      return;
    }

    // 3. If code param exists, exchange for tokens (fallback for local dev)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        setIsLoading(true);
        // Exchange code for tokens
        const tokenUrl = `${domain}/oauth2/token`;
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
        });
        fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.id_token) {
              localStorage.setItem('jwt', data.id_token);
              const userInfo = parseJwt(data.id_token);
              if (userInfo) {
                setUser({
                  username: userInfo.email || userInfo.sub || 'google-user',
                  attributes: userInfo,
                  isGuest: false,
                });
                setIsAuthenticated(true);
                setIsLoading(false);
              } else {
                setIsAuthenticated(false);
                setUser(null);
                setIsLoading(false);
              }
              // Remove code param from URL
              urlParams.delete('code');
              const newUrl =
                window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
              window.history.replaceState({}, '', newUrl);
            } else {
              setIsAuthenticated(false);
              setUser(null);
              setIsLoading(false);
            }
          })
          .catch(() => {
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
          });
        return;
      }
    }
    setIsLoading(false);
  }, []);

  const login = () => {
    // No-op: handled by backend
  };

  const loginWithGoogle = () => {
    // Redirect to Cognito Hosted UI for Google login
    const url = getCognitoLoginUrl();
    if (!url) {
      alert('Cognito config missing.');
      return;
    }
    window.location.href = url;
  };

  const loginAsGuest = () => {
    setUser({
      username: 'Invitado',
      attributes: { name: 'Invitado' },
      isGuest: true,
    });
    setIsAuthenticated(true);
    localStorage.removeItem('jwt');
    storage.clearState();
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    storage.clearState();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        loginWithGoogle,
        loginAsGuest,
        logout,
        setUser,
        setIsAuthenticated,
      }}
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
