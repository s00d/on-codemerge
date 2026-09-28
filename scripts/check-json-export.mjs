#!/usr/bin/env node
/**
 * Phase 05 runtime contract: `on-codemerge/json` resolves to dist via package
 * exports and exports a usable Editor (ESM + CJS). Types are gated separately
 * by check-json-types.mjs (bundler only; not Node16). Run after `pnpm build`.
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const expectedEsm = resolve(root, 'dist/json.mjs');
const parent = pathToFileURL(resolve(root, 'package.json')).href;

const esmUrl = import.meta.resolve('on-codemerge/json', parent);
const esmPath = fileURLToPath(esmUrl);
if (resolve(esmPath) !== expectedEsm) {
  console.error('[check-json-export] ESM resolve expected dist/json.mjs, got', esmPath);
  process.exit(1);
}
if (!existsSync(esmPath)) {
  console.error('[check-json-export] missing', esmPath, '(run pnpm build)');
  process.exit(1);
}

const esm = await import(esmUrl);
if (typeof esm.Editor !== 'function') {
  console.error('[check-json-export] ESM Editor not a function');
  process.exit(1);
}

const req = createRequire(resolve(root, 'package.json'));
const cjs = req('on-codemerge/json');
if (typeof cjs.Editor !== 'function') {
  console.error('[check-json-export] CJS Editor not a function');
  process.exit(1);
}

console.log('[check-json-export] ok', esmPath);
