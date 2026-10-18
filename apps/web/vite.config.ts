import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  build: { manifest: true },
  worker: { format: 'es' },
  server: { port: 5173 },
  preview: { port: 4173, allowedHosts: ['.trycloudflare.com'] },
});
