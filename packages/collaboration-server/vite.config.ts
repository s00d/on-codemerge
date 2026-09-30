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
  'node:module',
  'node:fs',
  'node:path',
  'node:http',
  'node:crypto',
  'node:sqlite',
  'redis',
  'pg',
]);

function isExternal(id: string): boolean {
  return (
    id.startsWith('node:') || [...externals].some((dep) => id === dep || id.startsWith(`${dep}/`))
  );
}

/** Library entry only — CLI is a separate single-entry build (avoids empty side-effect entry). */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'node20',
    lib: {
      entry: resolve(root, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rolldownOptions: {
      external: isExternal,
      output: {
        exports: 'named',
        codeSplitting: false,
      },
    },
  },
  plugins: [
    dts({
      entryRoot: resolve(root, 'src'),
      include: [resolve(root, 'src')],
      exclude: [
        resolve(root, 'src/**/__tests__/**'),
        resolve(root, 'src/**/*.test.ts'),
        resolve(root, 'src/cli.ts'),
      ],
      tsconfigPath: resolve(root, '../../tsconfig.packages.json'),
      insertTypesEntry: false,
      pathsToAliases: false,
      copyDtsFiles: true,
    }),
    emitDCtsPlugin(resolve(root, 'dist')),
  ],
});
