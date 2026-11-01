import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      '@tanstack/react-query',
      'wagmi',
      'wagmi/chains',
      'wagmi/connectors',
      'viem',
      'viem/chains',
      'connectkit',
      'framer-motion',
      'lucide-react',
      'sonner',
      'clsx',
      'tailwind-merge',
      'vite-plugin-node-polyfills/shims/buffer',
      'vite-plugin-node-polyfills/shims/global',
      'vite-plugin-node-polyfills/shims/process',
    ],
  },
  server: {
    allowedHosts: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          // When the scanner API is not listening, answer with an explicit JSON error instead of a bare 500.
          proxy.on('error', (err, _req, res) => {
            console.error('[api-proxy] cannot reach the scanner API on :3001:', (err as Error).message || (err as { code?: string }).code)
            const out = res as import('node:http').ServerResponse
            if (out && !out.headersSent) {
              out.writeHead(503, { 'content-type': 'application/json', 'cache-control': 'no-store' })
              out.end(JSON.stringify({ error: 'scanner_api_unreachable', message: 'The scanner API is not running on port 3001. Start it with `bun run server` (or `bun run dev`).' }))
            }
          })
        },
      },
    },
  },
})
