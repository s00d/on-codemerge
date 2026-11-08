/**
 * Vite plugin: after lib build, make the emitted declarations resolvable for every consumer:
 *  - relative specifiers in `.d.ts` get explicit `.js` / `/index.js` (node16/nodenext ESM
 *    resolution has no extension probing — `from './types'` fails there);
 *  - every `.d.ts` gets a sibling `.d.cts` whose relative specifiers point at `.cjs`, so
 *    `require` consumers stay in CJS-typed files (dual-package types).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Plugin } from 'vite';

function walkDts(dir: string, out: string[] = []): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    const path = join(dir, name);
    if (name.endsWith('.d.ts')) {
      out.push(path);
    } else if (!name.includes('.')) {
      walkDts(path, out);
    }
  }
  return out;
}

const SPECIFIER =
  /(\bfrom\s+|\bimport\s*\(\s*|^\s*import\s+|^\s*export\s+\*\s+from\s+)(['"])(\.\.?\/[^'"]*)\2/gm;

/** `./types` -> `./types.js` (or `./dir/index.js`); leaves explicit extensions alone. */
function withExtension(file: string, spec: string): string {
  if (/\.(?:[cm]?js|json|css|scss|svg)$/.test(spec)) {
    return spec;
  }
  const base = resolve(dirname(file), spec);
  if (existsSync(`${base}.d.ts`)) {
    return `${spec}.js`;
  }
  if (existsSync(join(base, 'index.d.ts'))) {
    return `${spec.replace(/\/$/, '')}/index.js`;
  }
  return spec;
}

/** Rewrite every `.d.ts` under `distDir` and emit its `.d.cts` twin. */
export function emitDualDeclarations(distDir: string): void {
  if (!existsSync(distDir)) {
    return;
  }
  const files = walkDts(distDir);
  for (const file of files) {
    // svg-loader inlines `.svg` as raw strings; the `.svg` files never ship, so their
    // re-exports must become plain string declarations.
    const original = readFileSync(file, 'utf8');
    const src = original.replace(
      /^export \{ default as (\w+) \} from ['"]\.\.?\/[^'"]+\.svg['"];$/gm,
      'export declare const $1: string;'
    );
    const esm = src.replace(
      SPECIFIER,
      (_, lead: string, q: string, spec: string) => `${lead}${q}${withExtension(file, spec)}${q}`
    );
    if (esm !== original) {
      writeFileSync(file, esm);
    }
    const cjs = esm.replace(
      SPECIFIER,
      (_, lead: string, q: string, spec: string) =>
        `${lead}${q}${spec.replace(/\.js$/, '.cjs')}${q}`
    );
    writeFileSync(file.replace(/\.d\.ts$/, '.d.cts'), cjs);
  }
}

export function emitDCtsPlugin(distDir = 'dist'): Plugin {
  const abs = resolve(distDir);
  return {
    name: 'ocm-emit-d-cts',
    closeBundle() {
      emitDualDeclarations(abs);
    },
  };
}
