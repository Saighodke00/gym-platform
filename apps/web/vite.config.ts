import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      '.trycloudflare.com',  // Cloudflare tunnel
      '.ngrok-free.dev',     // Ngrok free tier
      '.ngrok.io',           // Ngrok legacy
      'all',                 // Allow all other tunnel hosts
    ],
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
