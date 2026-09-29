import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';
import { resolve } from 'node:path';
import { scssPreprocessorOptions } from '../../../scripts/scss-vite-options.ts';

const repoRoot = resolve(import.meta.dirname, '../../..');

/** Thin SPA for source-editor e2e stand → repo `dist-e2e-source/`. */
export default defineConfig({
  css: {
    postcss: resolve(repoRoot, 'postcss.config.js'),
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  resolve: {
    alias: {
      '@on-codemerge/editor': resolve(repoRoot, 'packages/editor/src'),
      '@on-codemerge/kernel': resolve(repoRoot, 'packages/kernel/src'),
      '@on-codemerge/sdk': resolve(repoRoot, 'packages/sdk/src'),
      '@ocm/wysiwyg': resolve(repoRoot, 'apps/wysiwyg/src'),
      '@ocm/plugins': resolve(repoRoot, 'plugins'),
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
    // Relative to stand root — untestutils joins outDir onto recipe root.
    outDir: '../../../dist-e2e-source',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
