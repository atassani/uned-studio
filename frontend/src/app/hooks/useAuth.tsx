'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storage } from '../storage';
import { tDefault } from '../i18n/translator';

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
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const redirectUri =
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN ||
    (typeof window !== 'undefined'
      ? new URL(basePath || '/', window.location.origin).toString()
      : null);
  const prompt = process.env.NEXT_PUBLIC_COGNITO_PROMPT;
  if (!domain || !clientId || !redirectUri) {
    return null;
  }
  const promptParam = prompt ? `&prompt=${encodeURIComponent(prompt)}` : '';
  return (
    `${domain}/oauth2/authorize?response_type=code&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&identity_provider=Google&scope=openid+email+profile${promptParam}`
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
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const redirectUri =
      process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN ||
      (typeof window !== 'undefined'
        ? new URL(basePath || '/', window.location.origin).toString()
        : undefined);
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

    const removeCodeParam = () => {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('code')) {
        urlParams.delete('code');
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const normalizedBasePath = basePath.replace(/\/$/, '');
        const postLoginPath = `${normalizedBasePath}/areas/`;
        const newUrl = postLoginPath + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.location.replace(newUrl);
      }
    };

    const fetchCurrentUser = async () => {
      const response = await fetch('/studio/me', { credentials: 'same-origin' });
      if (!response.ok) {
        return null;
      }
      return (await response.json()) as UserWithAttributes['attributes'];
    };

    const hasCodeParam =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('code');

    // Fast-path: if callback code is present but auth is already recoverable from cookie/JWT,
    // canonicalize URL immediately to avoid rendering transient callback/state routes.
    if (hasCodeParam && (authCookie || jwt)) {
      removeCodeParam();
      return;
    }

    // 1. If auth cookie exists, load user from /studio/me
    if (authCookie) {
      setIsLoading(true);
      fetchCurrentUser()
        .then((payload) => {
          if (!payload) {
            setUser(null);
            setIsAuthenticated(false);
            return;
          }
          setUser({
            username: payload.email || payload.name || payload.sub || 'google-user',
            attributes: payload,
            isGuest: false,
          });
          setIsAuthenticated(true);
        })
        .catch(() => {
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => {
          setIsLoading(false);
          removeCodeParam();
        });
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
      removeCodeParam();
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
              removeCodeParam();
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
      alert(tDefault('auth.cognitoConfigMissing'));
      return;
    }
    window.location.href = url;
  };

  const loginAsGuest = () => {
    setUser({
      username: tDefault('auth.guestUsername'),
      attributes: { name: tDefault('auth.guestUsername') },
      isGuest: true,
    });
    setIsAuthenticated(true);
    localStorage.removeItem('jwt');
    storage.clearState();
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      // Clear local client state without dispatching app-wide state change events,
      // then navigate away immediately to avoid in-app flicker/rebound during logout.
      window.localStorage.removeItem('learningStudio');
      window.localStorage.removeItem('jwt');
    }
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const signOutRedirect = process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || `${basePath || '/'}`;
    const signOutRedirectUrl = new URL(
      signOutRedirect,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    );
    signOutRedirectUrl.searchParams.set('logged_out', Date.now().toString());
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalDevHost =
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

    // In local dev there is no /studio/logout backend route.
    // Use Cognito logout directly when available so the Hosted UI session is actually closed.
    if (isLocalDevHost) {
      if (!user?.isGuest && domain && clientId) {
        window.location.replace(
          `${domain}/logout?client_id=${encodeURIComponent(clientId)}` +
            `&logout_uri=${encodeURIComponent(signOutRedirect)}`
        );
        return;
      }
      window.location.replace(signOutRedirectUrl.toString());
      return;
    }

    window.location.replace(`${basePath}/logout`);
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
