#!/usr/bin/env node
/**
 * Ensure every non-en locale under src/i18n/locales shares en's nested key tree.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const localesDir = path.join(root, 'src/i18n/locales');
const enPath = path.join(localesDir, 'en.json');

function flatten(obj, prefix = '', out = {}) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    out[prefix] = obj;
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

if (!fs.existsSync(enPath)) {
  console.error('check-locales: missing', enPath);
  process.exit(1);
}

const enKeys = Object.keys(flatten(JSON.parse(fs.readFileSync(enPath, 'utf8')))).toSorted();
const files = fs
  .readdirSync(localesDir)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .toSorted();

if (files.length === 0) {
  console.error('check-locales: no non-en locale files in', localesDir);
  process.exit(1);
}

let failed = false;
for (const file of files) {
  const code = file.replace(/\.json$/, '');
  const p = path.join(localesDir, file);
  const keys = Object.keys(flatten(JSON.parse(fs.readFileSync(p, 'utf8')))).toSorted();
  const missing = enKeys.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !enKeys.includes(k));
  if (missing.length > 0 || extra.length > 0) {
    failed = true;
    console.error(`check-locales: ${code} key mismatch`);
    if (missing.length > 0) {
      console.error(
        `  missing (${missing.length}):`,
        missing.slice(0, 20).join(', '),
        missing.length > 20 ? '…' : ''
      );
    }
    if (extra.length > 0) {
      console.error(
        `  extra (${extra.length}):`,
        extra.slice(0, 20).join(', '),
        extra.length > 20 ? '…' : ''
      );
    }
  } else {
    console.log(`check-locales: ${code} OK (${keys.length} keys)`);
  }
}

if (failed) {
  process.exit(1);
}
console.log(`check-locales: en baseline ${enKeys.length} keys — all locales match`);
