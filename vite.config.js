import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import fs from "fs";
import path from "path";

// ✅ This version ensures _redirects and 404.html get copied and React Router routes work on Render
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['RMS logo.png', 'RMS logo2.png', 'logo.png'],
      manifest: {
        name: 'RMS - Record Management System',
        short_name: 'RMS',
        description: 'Record Management System for efficient data tracking and management',
        theme_color: '#10b981',
        background_color: '#10b981',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/RMS logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/RMS logo2.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: null, // Prevent tracking issues
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-data-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        // Disable client-side navigation handling to avoid tracking issues
        clientsClaim: true,
        skipWaiting: true
      }
    }),
    {
      name: "copy-spa-files",
      closeBundle() {
        const filesToCopy = ["_redirects", "404.html"];
        filesToCopy.forEach(file => {
          const src = path.resolve(__dirname, `public/${file}`);
          const dest = path.resolve(__dirname, `dist/${file}`);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`✅ Copied ${file} to dist/`);
          } else {
            console.warn(`⚠️  No ${file} file found in /public folder`);
          }
        });
      },
    },
  ],
  publicDir: "public",
  build: {
    outDir: "dist",
  },
  server: {
    historyApiFallback: true, // Helps when running locally with vite preview
  },
});