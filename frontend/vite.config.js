import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Any request starting with /api is forwarded to the Laravel container
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
})