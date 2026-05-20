import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'map-vendor'
          if (id.includes('node_modules/firebase')) return 'firebase-vendor'
          if (id.includes('node_modules/react-dom')) return 'react-vendor'
        },
      },
    },
  },
})
