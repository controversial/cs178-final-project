import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src',
  build: { target: 'esnext' },
  plugins: [react()],
});
