import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const bffTarget = process.env.VITE_BFF_URL || 'http://localhost:4400'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/graphql': {
        target: bffTarget,
        changeOrigin: true,
      },
      '/_meta': {
        target: bffTarget,
        changeOrigin: true,
      },
    },
  },
})
