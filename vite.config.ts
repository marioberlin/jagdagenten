import { defineConfig } from 'vite' // force restart 3
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/*.png', 'favicon.ico'],
            manifest: {
                name: 'LiquidCrypto',
                short_name: 'LiquidCrypto',
                description: 'Cryptocurrency trading with AI assistance',
                theme_color: '#007AFF',
                background_color: '#0a0a0a',
                display: 'standalone',
                orientation: 'portrait-primary',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 3000000,
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'anthropic-api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'gemini-api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
    ],
    css: {
        postcss: {
            plugins: [
                tailwindcss(),
                autoprefixer(),
            ],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@liquidcrypto/a2a-sdk": path.resolve(__dirname, "./a2a-sdk/src/index.ts"),
            "a2a-sdk": path.resolve(__dirname, "./a2a-sdk/src/index.ts"),
        },
    },
    server: {
        host: true,
        port: 5173,
        strictPort: false,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
})
