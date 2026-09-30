import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { scssPreprocessorOptions } from './scripts/scss-vite-options.ts';

const root = import.meta.dirname;

/**
 * Standalone IIFE for published pages (`dist/public.js`).
 * Built after the library bundle (`emptyOutDir: false`).
 */
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  resolve: {
    alias: {
      '@codemerge/kernel': resolve(root, 'packages/kernel/src'),
      '@codemerge/sdk': resolve(root, 'packages/sdk/src'),
    },
  },
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    lib: {
      entry: resolve(root, 'apps/wysiwyg/src/public.ts'),
      name: 'OcmPublic',
      formats: ['iife'],
      fileName: () => 'public.js',
    },
    rolldownOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
