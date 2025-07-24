

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',          // Allow access from other devices
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: '172.232.52.251', // 🔁 Replace this with your server's LAN or public IP
      port: 5180,
    },
  },
})
