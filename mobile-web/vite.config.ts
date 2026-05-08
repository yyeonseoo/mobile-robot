import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mobile/app/',
  build: {
    outDir:
      '../stamp-rally-server/src/main/resources/static/mobile/app',
    emptyOutDir: true,
  },
})
