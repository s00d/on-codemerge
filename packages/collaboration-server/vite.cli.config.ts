import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = resolve(import.meta.dirname);
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
const externals = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  'node:module',
  'node:fs',
  'node:path',
  'node:http',
  'node:crypto',
  'node:sqlite',
  'redis',
  'pg',
]);

/** Single-entry CLI build so side-effect `main()` is not tree-shaken away. */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    target: 'node20',
    lib: {
      entry: resolve(root, 'src/cli.ts'),
      formats: ['cjs'],
      fileName: () => 'cli.cjs',
    },
    rolldownOptions: {
      external: (id) =>
        id.startsWith('node:') ||
        [...externals].some((dep) => id === dep || id.startsWith(`${dep}/`)),
      output: {
        exports: 'named',
        codeSplitting: false,
        banner: '#!/usr/bin/env node\n',
      },
    },
  },
});
