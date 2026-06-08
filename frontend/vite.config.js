import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['apihour2.pi-cto.top']
  },
  preview: {
    allowedHosts: ['apihour2.pi-cto.top']
  },
  resolve: { extensions: ['.js', '.jsx'] }
})