import { defineConfig } from 'vite';
import { scssPreprocessorOptions } from '../scripts/scss-vite-options.ts';

export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'es2015',
  },
  css: {
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  server: {
    open: true,
    port: 3001,
  },
});
