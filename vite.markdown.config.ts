import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';
import { resolve } from 'node:path';
import { scssPreprocessorOptions } from './scripts/scss-vite-options.ts';

const root = import.meta.dirname;

/** Demo SPA for apps/markdown → `dist-markdown/` (`pnpm build:markdown` / `dev:markdown`). */
export default defineConfig({
  root: resolve(root, 'apps/markdown'),
  css: {
    postcss: resolve(root, 'postcss.config.js'),
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  resolve: {
    alias: {
      '@on-codemerge/editor': resolve(root, 'packages/editor/src'),
      '@on-codemerge/hunspell': resolve(root, 'packages/hunspell/src'),
      '@on-codemerge/kernel': resolve(root, 'packages/kernel/src'),
      '@on-codemerge/sdk': resolve(root, 'packages/sdk/src'),
      '@ocm/wysiwyg': resolve(root, 'apps/wysiwyg/src'),
      '@ocm/plugins': resolve(root, 'plugins'),
    },
  },
  plugins: [
    svgLoader({
      defaultImport: 'raw',
      svgoConfig: {
        multipass: true,
      },
    }),
  ],
  build: {
    outDir: resolve(root, 'dist-markdown'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
