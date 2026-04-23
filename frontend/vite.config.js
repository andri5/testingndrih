import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  appType: 'spa',
  build: {
    target: 'ES2020',
    outDir: 'dist',
    sourcemap: false,
  }
})
