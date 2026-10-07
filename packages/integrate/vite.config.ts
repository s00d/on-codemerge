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

/** Real build entries only — package.json aliases map duplicates onto these. */
const entries = [
  'index',
  'styles',
  'element',
  'protocol',
  'mount',
  'react',
  'vue',
  'vue2',
  'svelte',
  'jquery',
  'alpine',
  'next',
  'nuxt',
  'sveltekit',
] as const;

const selfExternals = [
  '@codemerge/integrate',
  '@codemerge/integrate/styles',
  '@codemerge/integrate/vue',
  '@codemerge/integrate/react',
  '@codemerge/integrate/element',
  '@codemerge/integrate/protocol',
  '@codemerge/integrate/mount',
];

const peerExternals = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  'react/jsx-runtime',
]);

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'es2020',
    lib: {
      entry: Object.fromEntries(entries.map((name) => [name, resolve(root, `src/${name}.ts`)])),
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rolldownOptions: {
      treeshake: { moduleSideEffects: true },
      external: (id) =>
        id.startsWith('node:') ||
        selfExternals.some((dep) => id === dep || id.startsWith(`${dep}/`)) ||
        [...peerExternals].some((dep) => id === dep || id.startsWith(`${dep}/`)) ||
        id.endsWith('.svelte'),
      output: { exports: 'named' },
    },
  },
  plugins: [
    dts({
      entryRoot: resolve(root, 'src'),
      include: entries
        .map((name) => resolve(root, `src/${name}.ts`))
        .concat([resolve(root, 'src/host.ts')]),
      exclude: [
        resolve(root, 'src/**/__tests__/**'),
        resolve(root, 'src/**/*.test.ts'),
        resolve(root, 'src/**/*.svelte'),
        resolve(root, 'src/shims/**'),
      ],
      tsconfigPath: resolve(root, 'tsconfig.json'),
      insertTypesEntry: false,
      pathsToAliases: false,
      copyDtsFiles: true,
    }),
    emitDCtsPlugin(resolve(root, 'dist')),
  ],
});
