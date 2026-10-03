import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';
import dts from 'vite-plugin-dts';
import banner from 'vite-plugin-banner';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ocmPackagePlugin } from './scripts/vite-plugin-ocm-package.ts';
import { ocmPackageIndexCssPlugin } from './scripts/vite-plugin-ocm-package-index-css.ts';
import { ocmPluginAliases } from './scripts/ocm-plugin-aliases.ts';
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
      '@codemerge/editor': resolve(root, 'packages/editor/src'),
      '@codemerge/hunspell': resolve(root, 'packages/hunspell/src'),
      '@codemerge/kernel': resolve(root, 'packages/kernel/src'),
      '@codemerge/view': resolve(root, 'packages/view/src'),
      '@codemerge/mermaid': resolve(root, 'packages/mermaid/src'),
      // More specific than `@codemerge/sdk` → src (package-index imports built css).
      '@codemerge/sdk/sdk.css': resolve(root, 'packages/sdk/dist/sdk.css'),
      '@codemerge/sdk': resolve(root, 'packages/sdk/src'),
      '@codemerge/wysiwyg': resolve(root, 'apps/wysiwyg/src'),
      '@ocm/wysiwyg': resolve(root, 'apps/wysiwyg/src'),
      ...ocmPluginAliases(root),
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
    ocmPackageIndexCssPlugin(root),
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
        app: './apps/wysiwyg/src/app.ts',
        plugins: './apps/wysiwyg/src/plugins.ts',
        json: './apps/json/src/app.ts',
        markdown: './apps/markdown/src/app.ts',
        code: './apps/code/src/app.ts',
        forms: './apps/forms/src/app.ts',
        charts: './apps/charts/src/app.ts',
        calendar: './apps/calendar/src/app.ts',
        'packages/sdk/src/index': './packages/sdk/src/index.ts',
        'packages/kernel/src/index': './packages/kernel/src/index.ts',
        'packages/view/src/index': './packages/view/src/index.ts',
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
      // Runtime external — keep `import '@codemerge/mermaid'` in .d.ts, do not emit types tree.
      exclude: ['packages/mermaid/**'],
      aliasesExclude: [/^@codemerge\/mermaid(?:\/|$)/],
    }),
    banner(
      `${packageJson.name} v${packageJson.version} @author ${packageJson.author} @license ${packageJson.license} @homepage ${packageJson.homepage} @repository ${packageJson.repository.url} Copyright (c) ${new Date().getFullYear()} ${packageJson.author} - Built on ${new Date().toISOString()}`
    ),
    ocmPackagePlugin(root),
  ],
});

// untestutils e2e sets UNTESTUTILS_E2E=1 for prepare/preview against a real dist.
export default process.env.UNTESTUTILS_E2E === '1' ? e2eAppConfig : libConfig;
