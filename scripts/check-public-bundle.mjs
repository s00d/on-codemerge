#!/usr/bin/env node
/**
 * Post-build gate: dist/public.js must exist, stay thin, and not revive public-mermaid.js.
 * Run after `pnpm build` (same class as check-surface).
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicJs = resolve(root, 'dist/public.js');
const mermaidJs = resolve(root, 'dist/public-mermaid.js');

if (!existsSync(publicJs)) {
  console.error('[check-public-bundle] missing dist/public.js (run pnpm build)');
  process.exit(1);
}

const size = statSync(publicJs).size;
if (size >= 400_000) {
  console.error(`[check-public-bundle] public.js too large: ${size} (max 400000)`);
  process.exit(1);
}

if (existsSync(mermaidJs)) {
  console.error('[check-public-bundle] unexpected dist/public-mermaid.js');
  process.exit(1);
}

const body = readFileSync(publicJs, 'utf8');
if (!body.includes('data-ocm-mermaid') && !body.includes('mermaid')) {
  console.error('[check-public-bundle] public.js missing mermaid hydrate markers');
  process.exit(1);
}

console.log(`[check-public-bundle] ok public.js=${size}B`);
