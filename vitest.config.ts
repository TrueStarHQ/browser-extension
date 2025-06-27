import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/test-setup.ts'],
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    conditions: ['browser'],
    alias: {
      $lib: resolve(__dirname, './src')
    }
  }
});