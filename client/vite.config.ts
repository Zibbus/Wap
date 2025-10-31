import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // API principale
      "/api": {
        target: "http://localhost:3001", // <-- backend API
        changeOrigin: true,
      },
      // Servizi di autenticazione (separati)
      "/auth": {
        target: "http://localhost:4000", // <-- backend auth
        changeOrigin: true,
      },
    },
  },
})
