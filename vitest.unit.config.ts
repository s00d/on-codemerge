import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@on-codemerge/kernel': resolve(root, 'packages/kernel/src'),
      '@on-codemerge/sdk': resolve(root, 'packages/sdk/src'),
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
    setupFiles: [resolve(root, 'src/__mocks__/vitest.setup.ts')],
    include: ['packages/**/src/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
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
        'packages/sdk/src/**/*.ts',
        'src/editor/**/*.ts',
        'src/view/**/*.ts',
        'src/io/**/*.ts',
        'src/platform/**/*.ts',
        'src/plugins/index.ts',
        'src/plugins/TablePlugin/tableOps.ts',
        'src/app.ts',
      ],
      exclude: [
        '**/*.{test,spec}.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/*.d.ts',
        '**/ui/sdk.scss',
        'src/icons/**',
        'src/plugins/**/*.scss',
        'src/main.ts',
        'src/io/clipboard.ts',
        'src/io/markdown.ts',
        'src/plugins/**/components/**',
        'src/plugins/**/drivers/**',
        'src/plugins/**/widgets/**',
        'src/plugins/**/renderers/**',
        'src/plugins/**/services/**',
        'src/plugins/**/utils/**',
        'src/plugins/**/types/**',
        'src/plugins/**/commands/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
