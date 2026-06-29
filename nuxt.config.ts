import { homedir } from 'node:os'

const mkcertDir = `${homedir()}/.vite-plugin-mkcert`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    https: {
      key: `${mkcertDir}/dev.pem`,
      cert: `${mkcertDir}/cert.pem`,
    },
    host: '0.0.0.0',
  },

  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
  ],

  css: ['~/assets/scss/main.scss'],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
        },
      },
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'BasixMacro',
      short_name: 'BasixMacro',
      description: 'Kalorien und Makronährstoffe tracken',
      theme_color: '#1A1B1F',
      background_color: '#F9F9FB',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      navigateFallback: '/',
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'openfoodfacts-cache',
            expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
      ],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },

  typescript: {
    strict: true,
  },
})
