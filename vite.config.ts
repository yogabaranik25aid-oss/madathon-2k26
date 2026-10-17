import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './types'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        timeout: 25000,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('[vite-proxy] Backend proxy error:', err.message);
            if (res && !res.headersSent && typeof (res as any).writeHead === 'function') {
              (res as any).writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Backend server is temporarily restarting or unavailable. Please retry in a moment.' }));
            }
          });
        },
      },
    },
  },
});
