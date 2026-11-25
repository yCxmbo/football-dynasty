import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the game from /<repo>/; the deploy workflow sets BASE_PATH.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as never);
