// Google Analytics 4 utility functions for Studio

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
  }
}

// Check if GA is available and enabled
export const isGAEnabled = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    !!GA_TRACKING_ID &&
    GA_TRACKING_ID !== 'disabled'
  );
};

// Normalize path to handle base path correctly
const normalizePath = (path: string): string => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  // Remove base path from the beginning if present for clean tracking
  if (basePath && path.startsWith(basePath)) {
    return path.slice(basePath.length) || '/';
  }
  return path;
};

// Track page views
export const trackPageView = (path: string, title?: string): void => {
  if (!isGAEnabled() || !GA_TRACKING_ID) return;

  const normalizedPath = normalizePath(path);

  window.gtag('config', GA_TRACKING_ID, {
    page_path: normalizedPath,
    page_title: title,
    custom_map: {
      custom_dimension_1: 'user_auth_state',
    },
  });
};

// Track custom events
export interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const trackEvent = ({ action, category, label, value }: GAEvent): void => {
  if (!isGAEnabled()) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Predefined event tracking functions for common actions
export const trackQuizStart = (area: string, quizType: string): void => {
  trackEvent({
    action: 'quiz_start',
    category: 'engagement',
    label: `${area}_${quizType}`,
  });
};

export const trackQuizComplete = (
  area: string,
  quizType: string,
  score: number,
  totalQuestions: number
): void => {
  trackEvent({
    action: 'quiz_complete',
    category: 'engagement',
    label: `${area}_${quizType}`,
    value: Math.round((score / totalQuestions) * 100), // Percentage score
  });
};

export const trackAreaSelection = (area: string): void => {
  trackEvent({
    action: 'area_select',
    category: 'navigation',
    label: area,
  });
};

export const trackAuth = (action: 'login' | 'logout', method: 'google' | 'guest'): void => {
  trackEvent({
    action: `user_${action}`,
    category: 'authentication',
    label: method,
  });
};

export const trackAnswerSubmit = (area: string, questionType: string, isCorrect: boolean): void => {
  trackEvent({
    action: 'answer_submit',
    category: 'engagement',
    label: `${area}_${questionType}_${isCorrect ? 'correct' : 'incorrect'}`,
  });
};

// Set user properties
export const setUserProperties = (properties: Record<string, string>): void => {
  if (!isGAEnabled() || !GA_TRACKING_ID) return;

  window.gtag('config', GA_TRACKING_ID, properties);
};

// Set user authentication state
export const setAuthState = (isAuthenticated: boolean, method?: string): void => {
  setUserProperties({
    user_auth_state: isAuthenticated ? 'authenticated' : 'guest',
    auth_method: method || 'unknown',
  });
};
