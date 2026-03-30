import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    // Set base path for GitHub Pages deployment
    base: process.env.NODE_ENV === 'production' ? '/minecraft-item-list/' : '/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        watch: {
            ignored: [
                path.resolve(__dirname, 'public/data/**'),
                '**/node_modules/**',
                '**/dist/**',
                '**/.git/**',
            ],
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
})
