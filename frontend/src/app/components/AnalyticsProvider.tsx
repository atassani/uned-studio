'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, setAuthState } from '../lib/analytics';
import { useAuth } from '../hooks/useAuth';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  // Track page views on route changes
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  // Track authentication state changes
  useEffect(() => {
    if (user !== null) {
      // Only track when user state is resolved
      const authMethod = user?.isGuest ? 'guest' : 'google';
      setAuthState(isAuthenticated, authMethod);
    }
  }, [isAuthenticated, user]);

  return <>{children}</>;
}
