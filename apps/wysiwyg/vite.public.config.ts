import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { scssPreprocessorOptions } from '../../scripts/scss-vite-options.ts';

const root = resolve(import.meta.dirname, '../..');

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
      '@codemerge/view': resolve(root, 'packages/view/src'),
      '@codemerge/mermaid': resolve(root, 'packages/mermaid/src'),
      '@codemerge/sdk': resolve(root, 'packages/sdk/src'),
      '@ocm/wysiwyg': resolve(root, 'apps/wysiwyg/src'),
    },
  },
  build: {
    emptyOutDir: false,
    outDir: resolve(root, 'dist'),
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
