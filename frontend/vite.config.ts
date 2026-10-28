import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': env.API_URL ?? 'http://localhost:3000',
        // Elering doesn't send CORS headers, so the browser can't call it directly.
        '/elering': {
          target: 'https://dashboard.elering.ee',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/elering/, ''),
        },
      },
    },
  }
})
