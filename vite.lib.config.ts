import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
    plugins: [
        react(),
        dts({
            include: ['src/components'],
            exclude: ['src/components/**/*.stories.tsx', 'src/components/**/*.test.tsx']
        }),
        visualizer({
            filename: 'bundle-stats.html',
            gzipSize: true,
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
    build: {
        copyPublicDir: false,
        lib: {
            entry: resolve(__dirname, 'src/components/index.ts'),
            name: 'LiquidGlassUI',
            fileName: (format) => `liquid-glass.${format === 'es' ? 'js' : 'umd.cjs'}`,
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'framer-motion',
                'react/jsx-runtime'
            ],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'framer-motion': 'Motion',
                    'react/jsx-runtime': 'jsxRuntime'
                },
            },
        },
    },
    resolve: {
        alias: {
            "@": "/src",
        },
    },
})
