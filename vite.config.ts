import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    crx({ manifest })
  ],
  resolve: {
    alias: {
      $lib: resolve('./src')
    }
  }
});