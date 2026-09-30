/**
 * Vite plugin: after lib build, copy every dist .d.ts file to a sibling .d.cts
 * for dual-package require types (same idea as ocm-package CTS emit).
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import type { Dirent } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Plugin } from 'vite';

function walk(dir: string, visit: (path: string, ent: Dirent) => void): void {
  let dirents: Dirent[];
  try {
    dirents = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of dirents) {
    const path = join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(path, visit);
      continue;
    }
    visit(path, ent);
  }
}

export function emitDCtsPlugin(distDir = 'dist'): Plugin {
  const abs = resolve(distDir);
  return {
    name: 'ocm-emit-d-cts',
    closeBundle() {
      if (!existsSync(abs)) {
        return;
      }
      walk(abs, (path, ent) => {
        if (!ent.name.endsWith('.d.ts') || ent.name.endsWith('.d.ts.map')) {
          return;
        }
        const dest = path.replace(/\.d\.ts$/, '.d.cts');
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(path, dest);
      });
    },
  };
}
