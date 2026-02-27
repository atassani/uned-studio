import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from './hooks/useAuth';
import { AuthGuard } from './components/AuthGuard';
import { AnalyticsProvider } from './components/AnalyticsProvider';
import { Suspense } from 'react';
import { I18nProvider } from './i18n/I18nProvider';
import { getDefaultLanguage } from './i18n/config';
import { tDefault } from './i18n/translator';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

export const metadata: Metadata = {
  title: 'Studio',
  description: tDefault('app.metadataDescription'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={getDefaultLanguage()}>
      <head>
        <link
          rel="icon"
          href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.png`}
          type="image/png"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        <I18nProvider>
          <AuthProvider>
            <AuthGuard>
              <Suspense fallback={null}>
                <AnalyticsProvider>{children}</AnalyticsProvider>
              </Suspense>
            </AuthGuard>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
