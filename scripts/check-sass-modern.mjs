/**
 * Fail CI if Vite/VitePress configs omit modern Sass API, or if a smoke
 * transform still emits Deprecation [legacy-js-api].
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = join(import.meta.dirname, '..');
const require = createRequire(import.meta.url);

const CONFIGS = ['vite.config.ts', 'demo/vite.config.ts', 'docs/.vitepress/config.ts'];

const IMPORT_RE = /from\s+['"][^'"]*scripts\/scss-vite-options(?:\.ts)?['"]/;
const API_RE = /api:\s*['"]modern-compiler['"]/;

const violations = [];

for (const rel of CONFIGS) {
  const file = join(root, rel);
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    violations.push(`${rel}: missing`);
    continue;
  }
  if (!IMPORT_RE.test(src) && !API_RE.test(src)) {
    violations.push(`${rel}: must import scripts/scss-vite-options or set api: 'modern-compiler'`);
  }
}

if (violations.length > 0) {
  console.error(`Sass modern check failed:\n${violations.join('\n')}`);
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), 'ocm-sass-'));
const scssPath = join(tmp, 'probe.scss');
writeFileSync(scssPath, '$c: #112233;\n.probe { color: $c; }\n');

const warnings = [];
const origWarn = console.warn;
const origError = console.error;
const capture = (...args) => {
  const msg = args.map(String).join(' ');
  if (msg.includes('legacy-js-api')) {
    warnings.push(msg);
  }
};

try {
  console.warn = (...args) => {
    capture(...args);
    origWarn(...args);
  };
  console.error = (...args) => {
    capture(...args);
    origError(...args);
  };

  const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
  const { scssPreprocessorOptions } = await import('./scss-vite-options.ts');

  const server = await createServer({
    configFile: false,
    root: tmp,
    logLevel: 'silent',
    css: {
      preprocessorOptions: {
        scss: { ...scssPreprocessorOptions },
      },
    },
  });

  try {
    const result = await server.transformRequest('/probe.scss');
    if (!result?.code) {
      throw new Error('transformRequest returned empty code');
    }
  } finally {
    await server.close();
  }
} finally {
  console.warn = origWarn;
  console.error = origError;
  rmSync(tmp, { recursive: true, force: true });
}

if (warnings.length > 0) {
  console.error(
    `Sass modern check failed: smoke transform emitted legacy-js-api:\n${warnings.join('\n')}`
  );
  process.exit(1);
}

console.log(
  `Sass modern check: ok (${CONFIGS.map((c) => relative(root, join(root, c))).join(', ')})`
);
