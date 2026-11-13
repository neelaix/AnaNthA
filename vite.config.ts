import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: null,
      manifestFilename: 'manifest.webmanifest',
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png', 'offline.html'],
      manifest: {
        name: 'ANAṆTHA — Plan. Progress. Become Infinite.',
        short_name: 'ANAṆTHA',
        description:
          'A premium productivity companion that reminds you about your goals even when you are away.',
        theme_color: '#1a1a2e',
        background_color: '#0f0f1e',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
});
