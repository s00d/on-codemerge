import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'ui/index': 'src/ui/index.ts',
    'ui/chrome': 'src/ui/chrome.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'es2020',
  treeshake: true,
  tsconfig: '../../tsconfig.packages.json',
  external: ['@codemerge/kernel', 'tailwind-merge', 'tailwind-variants'],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.mjs' };
  },
});
