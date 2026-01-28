# Google Analytics 4 Implementation Plan

## Overview

Add Google Analytics 4 tracking to the UNED Studio Next.js project.

## Requirements

- Track page views and SPA route changes
- Handle base path `/uned/studio` correctly
- Use Next.js Script component with `strategy="afterInteractive"`
- Create utility functions for custom event tracking
- Support TypeScript
- Work with both authenticated and anonymous users

## Implementation Steps

### 1. Create Google Analytics Utility File

**File:** `src/app/lib/analytics.ts`

- Define GA4 tracking ID constant
- Create utility functions for:
  - Page view tracking
  - Custom event tracking
  - User properties
- Handle base path normalization
- Include TypeScript types

### 2. Add GA4 Scripts to Layout

**File:** `src/app/layout.tsx`

- Import Next.js Script component
- Add gtag.js script with `strategy="afterInteractive"`
- Add GA4 configuration script
- Initialize GA4 with tracking ID

### 3. Add Route Change Tracking

**File:** `src/app/components/AnalyticsProvider.tsx`

- Create provider component for route tracking
- Use `usePathname` and `useSearchParams` hooks
- Track route changes for SPA navigation
- Handle authentication state changes

### 4. Update Environment Variables

**File:** `.env` and documentation

- Add GA4 tracking ID as environment variable
- Update README.md with GA4 configuration

### 5. Add Custom Event Tracking

**Implementation in key components:**

- Quiz start/completion events
- Area selection events
- Authentication events (login/logout)
- Answer submission events

### 6. Testing Considerations

- Ensure tracking works in development
- Test with base path configuration
- Verify route change tracking
- Test custom events

## File Structure

```
src/
├── app/
│   ├── lib/
│   │   └── analytics.ts          # GA4 utility functions
│   ├── components/
│   │   └── AnalyticsProvider.tsx # Route tracking component
│   └── layout.tsx                # Updated with GA4 scripts
```

## Environment Variables

```bash
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXX
```

## Key Features

1. **Page View Tracking**: Automatic tracking of all page views
2. **Route Change Tracking**: SPA navigation tracking
3. **Custom Events**: Quiz interactions, auth events
4. **User Properties**: Authentication state, area preferences
5. **Base Path Support**: Correct tracking with `/uned/studio` path
6. **Privacy Compliant**: Respect user privacy preferences

## Notes

- Uses App Router approach (current project setup)
- Backwards compatible approach mentioned for Pages Router
- All tracking respects user consent and privacy
- Custom events help understand user engagement with quiz features
