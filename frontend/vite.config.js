import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/huda/', // for GitHub Pages — change 'huda' to your repo name
})
