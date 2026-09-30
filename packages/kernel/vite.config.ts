import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { emitDCtsPlugin } from '../../scripts/vite-plugin-emit-d-cts.ts';

const root = resolve(import.meta.dirname);
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
const externals = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]);

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'es2020',
    lib: {
      entry: resolve(root, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rolldownOptions: {
      external: (id) => [...externals].some((dep) => id === dep || id.startsWith(`${dep}/`)),
      output: { exports: 'named' },
    },
  },
  plugins: [
    dts({
      entryRoot: resolve(root, 'src'),
      include: [resolve(root, 'src')],
      exclude: [resolve(root, 'src/**/__tests__/**'), resolve(root, 'src/**/*.test.ts')],
      tsconfigPath: resolve(root, '../../tsconfig.packages.json'),
      insertTypesEntry: false,
      pathsToAliases: false,
      copyDtsFiles: true,
    }),
    emitDCtsPlugin(resolve(root, 'dist')),
  ],
});
