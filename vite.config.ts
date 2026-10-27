/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'theme-init.js', 'flags/*.svg'],
      manifest: {
        name: 'Zetsu',
        short_name: 'Zetsu',
        description: "Plateforme d'entraide entre développeurs africains",
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#f6f7f6',
        theme_color: '#f6f7f6',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/admin/],
        runtimeCaching: [
          {
            // Lecture hors ligne des dernières questions consultées.
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && url.pathname.startsWith('/api/v1/questions'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'zetsu-questions',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3100,
    // En local, /api part vers le back-end choisi dans .env.local (localhost:8080 par défaut).
    proxy: {
      '/api': {
        target: loadEnv(mode, '.', '').API_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    // Les tests tournent sur les exemples, même si .env.local vise la vraie API.
    env: { VITE_API_MODE: 'mock' },
    // Les pages se chargent à la demande (React.lazy) : sur une machine chargée, 5 s ne suffit pas.
    testTimeout: 15000,
  },
}));
