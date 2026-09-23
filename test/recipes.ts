import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineRecipes } from 'untestutils';
import { vite } from '@untestutils/vite';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

export const recipes = defineRecipes(
  {
    // One shared prepare: `vite build` → `vite preview` (see vite.config.ts when UNTESTUTILS_E2E=1).
    // Do NOT hash the whole `root`: `dist-e2e` is written by prepare and would change the
    // content hash → workers rebuild (untestutils SKIP_DIRS only skips bare `dist`).
    editor: vite({
      id: 'editor',
      root,
      run: 'preview',
      env: { UNTESTUTILS_E2E: '1' },
      viteConfig: { build: { outDir: 'dist-e2e' } },
      hashInputs: [
        resolve(root, 'src'),
        resolve(root, 'index.html'),
        resolve(root, 'vite.config.ts'),
        resolve(root, 'package.json'),
        resolve(root, 'postcss.config.js'),
      ],
      readyPath: '/',
      readyTimeoutMs: 180_000,
      workspaceDeps: true,
    }),
  },
  import.meta.url
);
