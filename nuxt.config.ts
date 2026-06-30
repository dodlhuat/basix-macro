import { homedir } from 'node:os'

const mkcertDir = `${homedir()}/.vite-plugin-mkcert`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  app: {
    baseURL: '/basixmacro/',
    head: {
      link: [
        { rel: 'manifest', href: '/basixmacro/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/basixmacro/icons/icon-192.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#1A1B1F' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
    },
  },
  devtools: { enabled: true },

  devServer: {
    https: {
      key: `${mkcertDir}/dev.pem`,
      cert: `${mkcertDir}/cert.pem`,
    },
    host: '0.0.0.0',
  },

  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@nuxtjs/i18n',
  ],

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'de',
    locales: [
      { code: 'de', language: 'de-DE', file: 'de.json', name: 'Deutsch' },
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
    ],
    langDir: 'locales/',
    detectBrowserLanguage: false,
  },

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
      start_url: '/basixmacro/',
      scope: '/basixmacro/',
      icons: [
        { src: '/basixmacro/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/basixmacro/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/basixmacro/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,woff2}'],
      navigateFallback: '/basixmacro/',
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /\/icons\.svg$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'icons-sprite',
            expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
        {
          urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'openfoodfacts-cache',
            expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            fetchOptions: { credentials: 'omit' },
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
