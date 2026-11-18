import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves the site from https://<user>.github.io/GeoTools/, so every asset URL is prefixed with
// the repository name. The dev server uses the same base, so local URLs match the deployed ones.
export default defineConfig({
  base: '/GeoTools/',
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
  },
})
