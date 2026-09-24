import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';
import dts from 'vite-plugin-dts';
import banner from 'vite-plugin-banner';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ocmPackagePlugin } from './scripts/vite-plugin-ocm-package.ts';
import { scssPreprocessorOptions } from './scripts/scss-vite-options.ts';

const root = import.meta.dirname;
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

/** Runtime deps stay on the consumer install — never copy into `dist/node_modules`. */
const runtimeExternals = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
]);

function isRuntimeExternal(id: string): boolean {
  if (
    !id ||
    id.startsWith('\0') ||
    id.startsWith('.') ||
    id.startsWith('/') ||
    /^[A-Za-z]:[\\/]/.test(id)
  ) {
    return false;
  }
  for (const dep of runtimeExternals) {
    if (id === dep || id.startsWith(`${dep}/`)) {
      return true;
    }
  }
  return false;
}

const shared = {
  css: {
    postcss: './postcss.config.js',
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  resolve: {
    alias: {
      '@on-codemerge/kernel': resolve(root, 'packages/kernel/src'),
      '@on-codemerge/sdk': resolve(root, 'packages/sdk/src'),
    },
  },
  plugins: [
    svgLoader({
      // Avoid `*.svg?raw.mjs` preserveModules filenames (Node cannot resolve `?` queries).
      defaultImport: 'raw',
      svgoConfig: {
        multipass: true,
      },
    }),
  ],
};

/** SPA build for e2e (`vite build` + `vite preview`) — not the library publish bundle. */
const e2eAppConfig = defineConfig({
  ...shared,
  build: {
    outDir: 'dist-e2e',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    cssCodeSplit: true,
  },
  plugins: [...shared.plugins],
});

const libConfig = defineConfig({
  ...shared,
  build: {
    assetsInlineLimit: 0,
    cssCodeSplit: true,
    lib: {
      entry: {
        app: './src/app.ts',
        'packages/sdk/src/index': './packages/sdk/src/index.ts',
        'packages/kernel/src/index': './packages/kernel/src/index.ts',
      },
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
    rolldownOptions: {
      external: isRuntimeExternal,
      output: {
        dir: 'dist',
        exports: 'named',
        preserveModules: true,
      },
    },
  },
  optimizeDeps: {
    exclude: [],
  },
  plugins: [
    ...shared.plugins,
    dts({
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.app.json',
    }),
    banner(
      `${packageJson.name} v${packageJson.version} @author ${packageJson.author} @license ${packageJson.license} @homepage ${packageJson.homepage} @repository ${packageJson.repository.url} Copyright (c) ${new Date().getFullYear()} ${packageJson.author} - Built on ${new Date().toISOString()}`
    ),
    ocmPackagePlugin(root),
  ],
});

// untestutils e2e sets UNTESTUTILS_E2E=1 for prepare/preview against a real dist.
export default process.env.UNTESTUTILS_E2E === '1' ? e2eAppConfig : libConfig;
