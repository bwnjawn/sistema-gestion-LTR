import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'apple-touch-icon-admin.png', 'pwa-admin-192x192.png', 'pwa-admin-512x512.png'],
      workbox: {
        // Avisos push de solicitudes nuevas (SCRUM-68): public/push-sw.js se suma al service worker
        importScripts: ['push-sw.js', 'admin-identidad-sw.js'],
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // Sin señal las fotos del catálogo y del inicio (Supabase Storage) se siguen viendo (SCRUM-250)
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/storage/v1/object/public/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'fotos-supabase',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'Los Troncos de Repil',
        short_name: 'LosTroncos',
        lang: 'es',
        description: 'Sistema de reservas y agendas',
        theme_color: '#1E4620',
        background_color: '#F1F2EE',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})