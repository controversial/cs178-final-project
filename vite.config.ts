import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src',
  build: {
    target: 'esnext',
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: { output: { format: 'es' } },
  },
  worker: { format: 'es' },
  plugins: [
    react(),
  ],
});
