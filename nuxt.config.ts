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

  runtimeConfig: {
    public: {
      // Base URL of the Laravel backend API, e.g. https://api.basixmacro.example/api
      apiBase: 'http://localhost/api',
    },
  },

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
    client: {
      // Installed PWAs are usually resumed from the background rather than
      // freshly navigated to, so the browser's native "check the SW for
      // byte changes on navigation" never runs. Without this, a new deploy
      // sits undetected until the user force-quits and relaunches the app.
      // This polls the service worker file every 15 min while the app is
      // open so `registerType: 'autoUpdate'` actually reaches installs.
      periodicSyncForUpdates: 900,
    },
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
      // icons.svg (~2.9 MB) must precache too: every AppIcon renders via
      // <use href="/icons.svg#name">, so without it in the precache manifest
      // the whole icon set silently disappears offline until the app has
      // been opened online at least once (see former icons-sprite runtimeCaching
      // rule below, which only cached opportunistically after the fact).
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      navigateFallback: '/basixmacro/',
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      runtimeCaching: [
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
