/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Politique de sécurité du contenu (CSP, voir CLAUDE.md). Posée en <meta> car le front
 * est servi en statique : tant que Caddy n'est pas devant, aucun en-tête HTTP n'est à nous.
 * Elle bloque les scripts inline et étrangers (XSS), comme la CSP Caddy prévue.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // React pose des styles en attribut style= (Avatar, squelettes…) : il faut unsafe-inline.
  "style-src 'self' 'unsafe-inline'",
  // https: pour les photos de profil GitHub/Google ; blob: pour l'aperçu d'avatar en mode mock.
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
].join('; ');

/**
 * Ajoutée au build seulement : en dev, le rafraîchissement à chaud de React injecte un
 * script inline que script-src 'self' bloquerait. frame-ancestors et X-Content-Type-Options
 * ne marchent pas en <meta> : à poser côté hébergeur (en-têtes Render, puis Caddy).
 */
const securityMeta: Plugin = {
  name: 'security-meta',
  apply: 'build',
  transformIndexHtml() {
    return [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
        injectTo: 'head-prepend',
      },
    ];
  },
};

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    securityMeta,
    VitePWA({
      registerType: 'autoUpdate',
      // Enregistrement du service worker après l'analyse de la page : il ne bloque plus l'affichage.
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'theme-init.js', 'flags/*.svg', 'icons/*.png'],
      manifest: {
        name: 'Dɛmɛ',
        short_name: 'Dɛmɛ',
        description: "Plateforme d'entraide entre développeurs africains",
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#f6f7f6',
        theme_color: '#f6f7f6',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
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
