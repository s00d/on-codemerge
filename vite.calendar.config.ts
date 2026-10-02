import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';
import { resolve } from 'node:path';
import { scssPreprocessorOptions } from './scripts/scss-vite-options.ts';

const root = import.meta.dirname;

/** Demo SPA for apps/calendar → `dist-calendar/` (`pnpm build:calendar` / `dev:calendar`). */
export default defineConfig({
  root: resolve(root, 'apps/calendar'),
  css: {
    postcss: resolve(root, 'postcss.config.js'),
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  resolve: {
    alias: {
      '@codemerge/editor': resolve(root, 'packages/editor/src'),
      '@codemerge/hunspell': resolve(root, 'packages/hunspell/src'),
      '@codemerge/kernel': resolve(root, 'packages/kernel/src'),
      '@codemerge/sdk': resolve(root, 'packages/sdk/src'),
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
    outDir: resolve(root, 'dist-calendar'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
