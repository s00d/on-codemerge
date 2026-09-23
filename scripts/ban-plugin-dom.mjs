/**
 * Fail CI if plugins use raw DOM APIs outside allowed foreign/widgets paths.
 * Plan: Declarative Plugin SDK — plugins describe ViewSpec; core owns DOM.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'src', 'plugins');

const BANNED = [
  { re: /\bdocument\.createElement\b/, msg: 'document.createElement' },
  { re: /\.innerHTML\s*=/, msg: 'innerHTML =' },
  { re: /\.textContent\s*=/, msg: 'textContent =' },
  { re: /\.host\.addEventListener\b/, msg: 'host.addEventListener' },
  { re: /\bnew\s+SdkPopup\b/, msg: 'SdkPopup' },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      // widgets/ = foreign mount boundary (called only from foreign(...))
      if (
        name === '__tests__' ||
        name === 'node_modules' ||
        name === 'widgets' ||
        name === 'publish'
      ) {
        continue;
      }
      walk(p, out);
    } else if (/\.(ts|tsx|js|mjs)$/.test(name) && !name.endsWith('.test.ts')) {
      out.push(p);
    }
  }
  return out;
}

/** Lines inside foreign((host, scope) => { ... }) are allowed to touch DOM. */
function stripForeignBlocks(src) {
  let result = '';
  let i = 0;
  while (i < src.length) {
    const idx = src.indexOf('foreign(', i);
    if (idx === -1) {
      result += src.slice(i);
      break;
    }
    result += src.slice(i, idx);
    let j = idx + 'foreign('.length;
    let depth = 1;
    while (j < src.length && depth > 0) {
      const ch = src[j];
      if (ch === '(') {
        depth += 1;
      } else if (ch === ')') {
        depth -= 1;
      }
      j += 1;
    }
    result += '/* foreign omitted */';
    i = j;
  }
  return result;
}

/** Drop string/template contents so generated client scripts don't false-positive. */
function stripStrings(src) {
  return src
    .replaceAll(/`(?:\\.|[^`\\])*`/gs, '""')
    .replaceAll(/'(?:\\.|[^'\\])*'/gs, '""')
    .replaceAll(/"(?:\\.|[^"\\])*"/gs, '""');
}

const violations = [];
for (const file of walk(ROOT)) {
  const raw = readFileSync(file, 'utf8');
  const src = stripStrings(stripForeignBlocks(raw));
  const lines = src.split('\n');
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) {
      continue;
    }
    for (const ban of BANNED) {
      if (ban.re.test(line)) {
        violations.push(`${relative(process.cwd(), file)}:${n + 1}: banned ${ban.msg}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`Plugin DOM ban failed:\n${violations.join('\n')}`);
  process.exit(1);
}

console.log('Plugin DOM ban: ok');
