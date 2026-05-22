import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite config del Pizza Simulator.
// - tailwindcss plugin: más rápido que PostCSS, sin tailwind.config.js separado
// - proxy /api → backend port 8000: evita CORS en desarrollo
// - proxy /ws → WebSocket del backend para eventos en tiempo real
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', rewrite: path => path.replace(/^\/api/, '') },
      '/ws': { target: 'ws://localhost:8000', ws: true },
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
})
