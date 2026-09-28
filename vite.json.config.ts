import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';
import { resolve } from 'node:path';
import { scssPreprocessorOptions } from './scripts/scss-vite-options.ts';

const root = import.meta.dirname;

/** Demo SPA for apps/json → `dist-json/` (`pnpm build:json` / `dev:json`). Lib export is main `vite.config.ts`. */
export default defineConfig({
  root: resolve(root, 'apps/json'),
  css: {
    postcss: resolve(root, 'postcss.config.js'),
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  resolve: {
    alias: {
      '@on-codemerge/editor': resolve(root, 'packages/editor/src'),
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
    outDir: resolve(root, 'dist-json'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
