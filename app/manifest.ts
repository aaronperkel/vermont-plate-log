import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vermont plate log',
    short_name: 'Plate log',
    description: 'A log of Vermont passenger plates spotted around Burlington.',
    start_url: '/',
    display: 'standalone',
    /* The plate green, so the status bar and splash match the app. */
    theme_color: '#14664a',
    background_color: '#f5f7f7',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      /* Android crops to its own shape; this one carries the extra safe margin. */
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
