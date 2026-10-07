import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { scssPreprocessorOptions } from '../scripts/scss-vite-options.ts';

const demoDir = dirname(fileURLToPath(import.meta.url));

function readPkgVersion(rel: string): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(demoDir, rel), 'utf8')) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

const ocmVersion = readPkgVersion('node_modules/on-codemerge/package.json');
const integrateVersion = readPkgVersion('node_modules/@codemerge/integrate/package.json');

export default defineConfig({
  define: {
    'import.meta.env.VITE_OCM_VERSION': JSON.stringify(ocmVersion),
    'import.meta.env.VITE_INTEGRATE_VERSION': JSON.stringify(integrateVersion),
  },
  build: {
    outDir: 'dist',
    target: 'es2015',
    rollupOptions: {
      input: {
        main: resolve(demoDir, 'index.html'),
        integrate: resolve(demoDir, 'integrate.html'),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: scssPreprocessorOptions,
    },
  },
  server: {
    open: '/integrate.html',
    port: 3001,
  },
});
