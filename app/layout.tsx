import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

/*
 * Self-hosted from committed files rather than next/font/google, so a build
 * never depends on reaching Google. The plate face also ships as a .ttf in the
 * same folder — satori, which renders the Open Graph card, cannot read woff2.
 */
const publicSans = localFont({
  variable: '--font-public-sans',
  display: 'swap',
  src: [
    { path: '../assets/fonts/public-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/public-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/public-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
});

/* Kept exclusive to the plate. Nothing else in the app uses a condensed face. */
const barlowCondensed = localFont({
  variable: '--font-barlow-condensed',
  display: 'swap',
  src: [
    { path: '../assets/fonts/barlow-semi-condensed-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? 'https://vermont-plate-log.vercel.app'),
  title: {
    default: 'Plate log',
    template: '%s — Plate log',
  },
  description: 'A log of Vermont passenger plates spotted around Burlington.',
  applicationName: 'Plate log',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Plate log',
    /*
     * Lets the page paint under the status bar, which is what makes the
     * standalone app feel like an app. Requires the safe-area padding below.
     */
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  /* Extends the page into the notch and home-indicator areas. */
  viewportFit: 'cover',
  themeColor: '#14664a',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${publicSans.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
