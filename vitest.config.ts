import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    svelte({ 
      hot: !process.env.VITEST,
      compilerOptions: {
        dev: true  // Enable dev-mode runtime checks during tests
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/test-setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        'test/**',
        'src/components/ui/',
      ]
    }
  },
  resolve: {
    conditions: ['browser'],
    alias: {
      $lib: resolve(__dirname, './src')
    }
  }
});