import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { ocmPluginAliases } from './scripts/ocm-plugin-aliases.ts';

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@codemerge/editor': resolve(root, 'packages/editor/src'),
      '@codemerge/hunspell': resolve(root, 'packages/hunspell/src'),
      '@codemerge/kernel': resolve(root, 'packages/kernel/src'),
      '@codemerge/view': resolve(root, 'packages/view/src'),
      '@codemerge/mermaid': resolve(root, 'packages/mermaid/src'),
      '@codemerge/sdk': resolve(root, 'packages/sdk/src'),
      '@codemerge/sdk/icons': resolve(root, 'packages/sdk/src/icons/index.ts'),
      '@ocm/wysiwyg': resolve(root, 'apps/wysiwyg/src'),
      ...ocmPluginAliases(root),
      // Public import paths resolve to source in unit tests.
      'on-codemerge/json': resolve(root, 'apps/json/src/app.ts'),
      'on-codemerge/markdown': resolve(root, 'apps/markdown/src/app.ts'),
      'on-codemerge/code': resolve(root, 'apps/code/src/app.ts'),
      'on-codemerge/forms': resolve(root, 'apps/forms/src/app.ts'),
      'on-codemerge/charts': resolve(root, 'apps/charts/src/app.ts'),
      'on-codemerge/calendar': resolve(root, 'apps/calendar/src/app.ts'),
      'on-codemerge/tables': resolve(root, 'apps/tables/src/app.ts'),
      'on-codemerge/app': resolve(root, 'apps/wysiwyg/src/app.ts'),
      'on-codemerge/plugins': resolve(root, 'apps/wysiwyg/src/plugins.ts'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  plugins: [
    {
      name: 'mock-assets',
      enforce: 'pre',
      load(id) {
        if (id.endsWith('.svg') || id.includes('.svg?')) {
          return 'export default "<svg></svg>"';
        }
        if (id.endsWith('.scss') || id.endsWith('.css')) {
          return 'export default {}';
        }
      },
    },
  ],
  test: {
    name: 'unit',
    environment: 'jsdom',
    globals: false,
    // threads: avoids jsdom structuredClone / webidl.markAsUncloneable forks failures on CI
    pool: 'threads',
    setupFiles: [resolve(root, 'apps/wysiwyg/src/__mocks__/vitest.setup.ts')],
    include: [
      'packages/**/src/**/*.{test,spec}.ts',
      'apps/wysiwyg/src/**/*.{test,spec}.ts',
      'apps/json/src/**/*.{test,spec}.ts',
      'apps/markdown/src/**/*.{test,spec}.ts',
      'apps/code/src/**/*.{test,spec}.ts',
      'apps/forms/src/**/*.{test,spec}.ts',
      'apps/charts/src/**/*.{test,spec}.ts',
      'apps/calendar/src/**/*.{test,spec}.ts',
      'apps/tables/src/**/*.{test,spec}.ts',
      'plugins/**/*.{test,spec}.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/test/e2e/**', '**/__tests__/helpers/**'],
    css: false,
    server: {
      deps: {
        inline: [/tailwind-variants/, /tailwind-merge/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: resolve(root, 'coverage'),
      // Thresholds apply ONLY to this include set (kernel/sdk/editor/io).
      // Plugin chrome (components/widgets/services) is intentionally excluded —
      // product UI is gated by e2e interaction-chains, not unit % theater.
      include: [
        'packages/kernel/src/**/*.ts',
        'packages/view/src/**/*.ts',
        'packages/sdk/src/**/*.ts',
        'packages/editor/src/**/*.ts',
        'apps/wysiwyg/src/editor/**/*.ts',
        'apps/wysiwyg/src/view/**/*.ts',
        'apps/wysiwyg/src/io/**/*.ts',
        'apps/wysiwyg/src/platform/**/*.ts',
        'plugins/index.ts',
        'apps/wysiwyg/src/app.ts',
      ],
      exclude: [
        '**/*.{test,spec}.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/*.d.ts',
        '**/ui/sdk.scss',
        'packages/sdk/src/icons/**',
        'apps/wysiwyg/src/icons/**',
        'plugins/**/*.scss',
        'apps/wysiwyg/src/main.ts',
        'apps/wysiwyg/src/io/clipboard.ts',
        'apps/wysiwyg/src/io/markdown.ts',
        // Transient download / file-picker portals: DOM click theater, not unit %.
        'packages/view/src/files.ts',
        // Page float chrome + lazy locale loaders: e2e / integration, not unit %.
        'packages/editor/src/PageChrome.ts',
        'packages/editor/src/i18n/**',
        // CE DOM input/view bridge: interaction-chain / e2e territory.
        'apps/wysiwyg/src/view/InputBridge.ts',
        'apps/wysiwyg/src/view/EditorView.ts',
        // Plugin table ops: product UI / e2e chains (same as other plugin chrome).
        'plugins/TablePlugin/**',
        'plugins/**/components/**',
        'plugins/**/drivers/**',
        'plugins/**/widgets/**',
        'plugins/**/renderers/**',
        'plugins/**/services/**',
        'plugins/**/utils/**',
        'plugins/**/types/**',
        'plugins/**/commands/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        // Branch density in kernel/commands + io/html + view/mount keeps ~76% under v8;
        // hold at 76 until those modules gain focused branch tests (lines/funcs already 88%+).
        branches: 76,
        statements: 80,
      },
    },
  },
});
