import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import {
  OCM_PACKAGE_INDEX_CSS_ID,
  ocmPackageIndexCssResolvedPath,
} from './scripts/ocm-package-index-css.ts';
import { ocmPluginAliases } from './scripts/ocm-plugin-aliases.ts';
import { ocmPackageIndexCssPlugin } from './scripts/vite-plugin-ocm-package-index-css.ts';
import { scssPreprocessorOptions } from './scripts/scss-vite-options.ts';

const root = import.meta.dirname;
const sdkCss = resolve(root, 'packages/sdk/dist/sdk.css');
const packageIndexResolved = ocmPackageIndexCssResolvedPath(root);

/** Drop JS stubs Vite emits for CSS-only entries — styles build writes CSS assets only. */
function stylesOnlyPlugin(): Plugin {
  return {
    name: 'ocm-styles-only',
    generateBundle(_opts, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (/\.(?:m|c)?js$/.test(fileName)) {
          delete bundle[fileName];
        }
      }
    },
  };
}

/**
 * Dedicated CSS package build → dist/{index,public,tailwind}.css.
 * Requires `@codemerge/sdk` built first (`packages/sdk/dist/sdk.css`).
 * Run after the JS lib build (`emptyOutDir: false`).
 */
export default defineConfig({
  css: {
    postcss: './postcss.config.js',
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  resolve: {
    alias: {
      '@codemerge/sdk/sdk.css': sdkCss,
      '@codemerge/wysiwyg': resolve(root, 'apps/wysiwyg/src'),
      '@ocm/wysiwyg': resolve(root, 'apps/wysiwyg/src'),
      ...ocmPluginAliases(root),
    },
  },
  build: {
    emptyOutDir: false,
    outDir: resolve(root, 'dist'),
    cssCodeSplit: true,
    assetsInlineLimit: 0,
    rolldownOptions: {
      input: {
        index: OCM_PACKAGE_INDEX_CSS_ID,
        public: resolve(root, 'apps/wysiwyg/src/public.css'),
        tailwind: resolve(root, 'apps/wysiwyg/src/tailwind.css'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? assetInfo.name;
          const originals = assetInfo.originalFileNames ?? [];
          if (
            (typeof name === 'string' && name.includes('__virtual_ocm_package_index')) ||
            originals.some((p) => p.includes('__virtual_ocm_package_index')) ||
            originals.some((p) => p === packageIndexResolved)
          ) {
            return 'index.css';
          }
          if (typeof name === 'string' && name.endsWith('.css')) {
            return name;
          }
          return '[name][extname]';
        },
        entryFileNames: '_styles/[name].js',
      },
    },
  },
  plugins: [
    {
      name: 'ocm-styles-require-sdk-css',
      buildStart() {
        if (!existsSync(sdkCss)) {
          throw new Error(
            `[ocm-styles] missing ${sdkCss} — run pnpm --filter @codemerge/sdk build (or build:packages) first`
          );
        }
      },
    },
    ocmPackageIndexCssPlugin(root),
    {
      name: 'ocm-styles-force-index-css-name',
      generateBundle(_opts, bundle) {
        for (const [fileName, item] of Object.entries(bundle)) {
          if (item.type !== 'asset' || !fileName.endsWith('.css') || fileName === 'index.css') {
            continue;
          }
          if (fileName.includes('__virtual_ocm_package_index')) {
            item.fileName = 'index.css';
            bundle['index.css'] = item;
            delete bundle[fileName];
          }
        }
      },
    },
    stylesOnlyPlugin(),
  ],
});
