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
            "@apps": path.resolve(__dirname, "./src/applications"),
            "@liquidcrypto/a2a-sdk": path.resolve(__dirname, "./packages/a2a-sdk/dist/browser.js"),
            "a2a-sdk": path.resolve(__dirname, "./packages/a2a-sdk/dist/browser.js"),
        },
    },
    server: {
        host: true,
        port: 5173,
        strictPort: false,
        watch: {
            // Ignore builder staging/output to prevent page reloads during builds.
            // Builder writes to .builder/staging/ and only installs to src/applications/
            // on completion, producing a single expected page reload.
            ignored: [
                '**/prd.json',
                '**/progress.txt',
                '**/.builder/**',
                '**/.claude/**',
            ],
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/agents': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            // Remote A2A Password Generator agent
            // Config source of truth: src/config/remote-agents.config.ts
            // Token and target URL are duplicated here because vite.config runs at build time
            // and can't easily import TypeScript modules from src/
            '/remote-a2a': {
                target: 'https://wr-demo.showheroes.com',
                changeOrigin: true,
                secure: true,
                // Token from src/config/remote-agents.config.ts (id: 'remote-password')
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYjc3ZWNlYS0wZGQ3LTRmMDUtYjAwMy0yNDcwNzVkMTdjODkiLCJhZ2VudF9pZCI6IjYzNmEzMTVkLWE4M2EtNDMwOC1iOWMyLTJkMWE2YmE1OTBlZSIsIm1vZGUiOiJjb252ZXJzYXRpb24iLCJzY29wZSI6ImxpbWl0ZWQiLCJ0b2tlbl90eXBlIjoiYWdlbnQiLCJleHAiOjE5MjYzMzUzNzR9.4XwjmQW6NJxLH55KgDtsBxcfDsY2WRmg_-9yNmUd1B4'
                },
                rewrite: (path) => path.replace(/^\/remote-a2a\/?/, '/api/v1/a2a/636a315d-a83a-4308-b9c2-2d1a6ba590ee/'),
            },
            // Remote A2A OneFlow Status Checker agent
            // Config source of truth: src/config/remote-agents.config.ts (id: 'remote-oneflow')
            '/remote-oneflow': {
                target: 'https://wr-demo.showheroes.com',
                changeOrigin: true,
                secure: true,
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0N2IxODUzOC0yNGI2LTRmOTQtOTU3My1kYTA4MmVkMGYyOWUiLCJhZ2VudF9pZCI6IjE4MDZkY2IzLTkzZWYtNGI1Zi04Nzk2LWE2NDY0ZTI4OTA2NiIsIm1vZGUiOiJjb252ZXJzYXRpb24iLCJzY29wZSI6ImxpbWl0ZWQiLCJ0b2tlbl90eXBlIjoiYWdlbnQiLCJleHAiOjE5MjY3OTA2NzJ9.ZTgv0CL2JrS0NOZztDZQgB2a8I7NW-Uud5MihIk_PoQ'
                },
                rewrite: (path) => path.replace(/^\/remote-oneflow\/?/, '/api/v1/a2a/1806dcb3-93ef-4b5f-8796-a6464e289066/'),
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                // TEMPORARY: Disabled manualChunks due to production build failure
                // The custom chunking was causing "Cannot read properties of undefined (reading 'exports')"
                // error due to circular dependencies between vendor-react and vendor-state chunks.
                // TODO: Re-enable with proper dependency ordering once root cause is identified.
                /*
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
                    // Per-app chunks for the applications directory
                    // Handles both top-level (ibird) and nested (_system/app-store) apps
                    if (id.includes('/src/applications/')) {
                        const match = id.match(/\/src\/applications\/(.+?)\/(?:App\.tsx|components\/|hooks\/|store|modals\/|mail\/|calendar\/|appointments\/)/);
                        if (match) return `app-${match[1].replace('/', '-')}`;
                        // Fallback: first directory segment
                        const simple = id.match(/\/src\/applications\/([^/]+)\//);
                        if (simple) return `app-${simple[1]}`;
                    }
                }
                */
            }
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000
    }
})
