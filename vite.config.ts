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
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Vendor chunks - large dependencies that rarely change
                    if (id.includes('node_modules')) {
                        // React ecosystem
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                            return 'vendor-react';
                        }
                        // Animation library
                        if (id.includes('framer-motion')) {
                            return 'vendor-motion';
                        }
                        // Charting libraries
                        if (id.includes('chart.js') || id.includes('react-chartjs') || id.includes('uplot')) {
                            return 'vendor-charts';
                        }
                        // Icons
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        // Other large dependencies
                        if (id.includes('zustand') || id.includes('zod')) {
                            return 'vendor-state';
                        }
                    }

                    // Feature chunks - lazy-loaded application features
                    if (id.includes('/src/components/trading/')) {
                        return 'feat-trading';
                    }
                    if (id.includes('/src/components/agents/') || id.includes('/src/pages/agents/')) {
                        return 'feat-agents';
                    }
                    if (id.includes('/src/components/generative/') || id.includes('/src/liquid-engine/')) {
                        return 'feat-agentic';
                    }
                    if (id.includes('/src/pages/demos/')) {
                        return 'feat-demos';
                    }
                }
            }
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000
    }
})
