/**
 * Emit sibling `.d.cts` next to each `.d.ts` for dual-package `require` types.
 * Usage: node scripts/emit-d-cts.mjs dist/index.d.ts [more…]
 */
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('emit-d-cts: pass one or more .d.ts paths');
  process.exit(1);
}

for (const rel of files) {
  const src = resolve(process.cwd(), rel);
  if (!existsSync(src)) {
    console.error(`emit-d-cts: missing ${src}`);
    process.exit(1);
  }
  const dest = src.replace(/\.d\.ts$/, '.d.cts');
  copyFileSync(src, dest);
  console.log(`emit-d-cts: ${rel} -> ${dest.slice(process.cwd().length + 1)}`);
}
