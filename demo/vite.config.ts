import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { scssPreprocessorOptions } from '../scripts/scss-vite-options.ts';

const demoDir = dirname(fileURLToPath(import.meta.url));
let ocmVersion = 'unknown';
try {
  const pkg = JSON.parse(
    readFileSync(resolve(demoDir, 'node_modules/on-codemerge/package.json'), 'utf8')
  ) as { version?: string };
  ocmVersion = pkg.version ?? ocmVersion;
} catch {
  /* not installed yet */
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_OCM_VERSION': JSON.stringify(ocmVersion),
  },
  build: {
    outDir: 'dist',
    target: 'es2015',
  },
  css: {
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  server: {
    open: true,
    port: 3001,
  },
});
