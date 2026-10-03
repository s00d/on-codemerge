#!/usr/bin/env node
/**
 * Post-build hygiene for the publishable monolith dist.
 * Run after `pnpm build` (same class as check-public-bundle).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
if (pkg.imports && typeof pkg.imports === 'object') {
  for (const [key, target] of Object.entries(pkg.imports)) {
    if (typeof target === 'string' && target.endsWith('.ts')) {
      errors.push(`package.json imports["${key}"] points at source ${target} (not shippable)`);
    }
  }
}

if (existsSync(resolve(root, 'dist/packages/mermaid'))) {
  errors.push(
    'dist/packages/mermaid must not ship (external @codemerge/mermaid; was types-only junk)'
  );
}

for (const name of ['tailwind.css', 'public.css', 'index.css']) {
  const nested = resolve(root, 'dist/apps/wysiwyg/src', name);
  if (existsSync(nested)) {
    errors.push(`duplicate nested CSS must not ship: dist/apps/wysiwyg/src/${name}`);
  }
}

for (const name of ['index.css', 'public.css', 'tailwind.css', 'public.js', 'app.mjs']) {
  if (!existsSync(resolve(root, 'dist', name))) {
    errors.push(`missing dist/${name}`);
  }
}

if (errors.length > 0) {
  console.error('[check-dist-package] failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log('[check-dist-package] ok');
