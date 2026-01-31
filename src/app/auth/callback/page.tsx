'use client';

import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function CallbackPage({
  navigate,
  code: codeProp,
}: { navigate?: (url: string) => void; code?: string } = {}) {
  const { setUser, setIsAuthenticated } = useAuth() as any;

  useEffect(() => {
    let code = codeProp;
    if (!code) {
      const params = new URLSearchParams(window.location.search);
      code = params.get('code') || undefined;
    }
    if (!code) return;

    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN;
    // Debug: print env variables at runtime
    if (typeof window !== 'undefined') {
      // (Removed debug logging)
    }
    if (!domain || !clientId || !redirectUri) {
      alert('Cognito config missing.');
      return;
    }

    // Exchange code for tokens
    fetch(`${domain}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id_token) {
          localStorage.setItem('jwt', data.id_token);
          // Fetch user info from Cognito
          fetch(`${domain}/oauth2/userinfo`, {
            headers: { Authorization: `Bearer ${data.id_token}` },
          })
            .then((res) => res.json())
            .then((userInfo) => {
              if (setUser)
                setUser({
                  username: userInfo.email || 'google-user',
                  attributes: userInfo,
                  isGuest: false,
                });
              if (setIsAuthenticated) setIsAuthenticated(true);
              if (navigate) {
                navigate(redirectUri);
              } else if (typeof window.location.replace === 'function') {
                window.location.replace(redirectUri);
              } else {
                window.location.href = redirectUri;
              }
            });
        } else {
          alert('Login failed');
        }
      });
  }, [navigate, codeProp]);

  return <div>Iniciando sesión...</div>;
}
