import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { emitDCtsPlugin } from '../../scripts/vite-plugin-emit-d-cts.ts';
import { scssPreprocessorOptions } from '../../scripts/scss-vite-options.ts';

const root = resolve(import.meta.dirname);
const repoRoot = resolve(root, '../..');
const distDir = resolve(root, 'dist');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
const externals = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]);

/** Drop the JS stub Vite emits when building a CSS-only entry. */
function cleanCssStubPlugin(): Plugin {
  return {
    name: 'ocm-sdk-clean-css-stub',
    closeBundle() {
      for (const name of ['sdk-css.mjs', 'sdk-css.mjs.map', 'sdk-css.js', 'sdk-css.cjs']) {
        const p = resolve(distDir, name);
        if (existsSync(p)) {
          rmSync(p);
        }
      }
      for (const name of ['sdk.css.d.ts', 'sdk.css.d.ts.map', 'sdk.css.d.cts']) {
        const p = resolve(distDir, 'ui', name);
        if (existsSync(p)) {
          rmSync(p);
        }
      }
    },
  };
}

export default defineConfig({
  css: {
    postcss: resolve(repoRoot, 'postcss.config.js'),
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'es2020',
    cssCodeSplit: true,
    lib: {
      entry: {
        index: resolve(root, 'src/index.ts'),
        'ui/index': resolve(root, 'src/ui/index.ts'),
        'ui/chrome': resolve(root, 'src/ui/chrome.ts'),
        'sdk-css': resolve(root, 'src/ui/sdk.scss'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rolldownOptions: {
      external: (id) => [...externals].some((dep) => id === dep || id.startsWith(`${dep}/`)),
      output: {
        exports: 'named',
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith('.css') ? 'sdk.css' : 'assets/[name][extname]',
      },
    },
  },
  plugins: [
    dts({
      entryRoot: resolve(root, 'src'),
      include: [resolve(root, 'src')],
      exclude: [resolve(root, 'src/**/__tests__/**'), resolve(root, 'src/**/*.test.ts')],
      tsconfigPath: resolve(repoRoot, 'tsconfig.packages.json'),
      insertTypesEntry: false,
      pathsToAliases: false,
      copyDtsFiles: true,
    }),
    cleanCssStubPlugin(),
    emitDCtsPlugin(distDir),
  ],
});
