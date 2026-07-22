/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { playwright } from '@vitest/browser-playwright'

// Fallback saja — dipakai HANYA bila VITE_BACKEND_ORIGIN kosong di .env.
// Sengaja localhost supaya tidak pernah basi saat domain backend berganti:
// sumber kebenaran domain ada di .env, bukan di file ini.
const DEFAULT_BACKEND_ORIGIN = 'http://localhost:4000'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv wajib: isi file .env TIDAK otomatis masuk ke process.env di dalam
  // config Vite. Tanpa ini VITE_BACKEND_ORIGIN dari .env akan terabaikan.
  const env = loadEnv(mode, process.cwd(), '')
  // Origin backend (tanpa prefix /api) untuk proxy dev server.
  const backendOrigin = env.VITE_BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN

  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
          secure: true,
        },
        // Engine.IO path socket.io-client (default `/socket.io`) — dipakai
        // useMonitoringSocket buat konek namespace `/monitoring` di backend.
        // Tanpa ini origin-nya jatuh ke dev server sendiri (lihat
        // getSocketOrigin) dan tak pernah nyampai backend.
        '/socket.io': {
          target: backendOrigin,
          changeOrigin: true,
          secure: true,
          ws: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      silent: 'passed-only' as const,
      unstubEnvs: true,
      browser: {
        enabled: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
      },
      coverage: {
        // include: ['src/**/*.{js,jsx,ts,tsx}'], // Uncomment to expand the report to all src/**/* so untested modules appear as 0% coverage.
        exclude: [
          'src/components/ui/**',
          'src/assets/**',
          'src/tanstack-table.d.ts',
          'src/routeTree.gen.ts',
          'src/test-utils/**',
          'src/routes/**',
        ],
      },
    },
  }
})
