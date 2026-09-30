/**
 * Standalone CSS build for `@codemerge/sdk` — compiles `sdk.scss` through the
 * repo PostCSS / Tailwind pipeline into `dist/sdk.css`.
 */
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { scssPreprocessorOptions } from '../../scripts/scss-vite-options.ts';

const root = resolve(import.meta.dirname, '../..');

export default defineConfig({
  root: import.meta.dirname,
  css: {
    postcss: resolve(root, 'postcss.config.js'),
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    cssCodeSplit: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/ui/sdk-css-entry.ts'),
      formats: ['es'],
      fileName: () => 'sdk-css-stub.mjs',
    },
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith('.css') ? 'sdk.css' : 'assets/[name][extname]',
      },
    },
  },
});
