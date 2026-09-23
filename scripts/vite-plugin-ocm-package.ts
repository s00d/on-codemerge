import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import type { Dirent } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import type { Plugin } from 'vite';

const CTS_ENTRIES = [
  'dist/app.d.ts',
  'dist/packages/sdk/src/index.d.ts',
  'dist/packages/kernel/src/index.d.ts',
] as const;

const SDK_MARKER = '/* --- sdk.css --- */';

type WalkStats = { files: number; patched: number; removed?: number };

function walkFiles(dir: string, visit: (path: string, ent: Dirent) => void): void {
  let dirents: Dirent[];
  try {
    dirents = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of dirents) {
    const path = join(dir, ent.name);
    if (ent.isDirectory()) {
      walkFiles(path, visit);
      continue;
    }
    visit(path, ent);
  }
}

function findNamedDeep(dir: string, name: string, out: string[] = []): string[] {
  let dirents: Dirent[];
  try {
    dirents = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of dirents) {
    const path = join(dir, ent.name);
    if (ent.isDirectory()) {
      findNamedDeep(path, name, out);
    } else if (ent.name === name) {
      out.push(path);
    }
  }
  return out;
}

function emitCtsTypes(root: string): void {
  for (const rel of CTS_ENTRIES) {
    const src = resolve(root, rel);
    if (!existsSync(src)) {
      console.warn(`[ocm-package] skip cts: missing ${rel}`);
      continue;
    }
    const dest = src.replace(/\.d\.ts$/, '.d.cts');
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    console.log(`[ocm-package] cts ${rel} -> ${relative(root, dest)}`);
  }
}

/** Strip Vite empty-css placeholders left by preserveModules + cssCodeSplit. */
function patchEmptyCssElision(distDir: string): WalkStats {
  const stats: WalkStats = { files: 0, patched: 0 };
  const emptyCssCluster = /,((?:\s*\/\* empty css[^*]*\*\/)+)\s*;/g;
  const emptyCssAnywhere = /\/\* empty css[^*]*\*\//g;

  walkFiles(distDir, (path, ent) => {
    if (!ent.name.endsWith('.mjs') && !ent.name.endsWith('.cjs')) {
      return;
    }
    stats.files += 1;
    const before = readFileSync(path, 'utf8');
    const after = before.replace(emptyCssCluster, ';').replace(emptyCssAnywhere, '');
    if (after !== before) {
      writeFileSync(path, after);
      stats.patched += 1;
    }
  });
  return stats;
}

/**
 * typo-js pulls Node `fs` via `__vite-browser-external`. SpellChecker always
 * passes dictionary text — inline an empty stub and drop the virtual module.
 */
function stripViteBrowserExternal(distDir: string): WalkStats {
  const stats: WalkStats = { files: 0, patched: 0, removed: 0 };
  const mjsImport =
    /import\s+\{\s*require___vite_browser_external\s+as\s+(\w+)\s*\}\s+from\s+["'][^"']*__vite-browser-external\.mjs["'];?\n?/g;
  const cjsRequire = /,?(\w+)\s*=\s*require\(["'][^"']*__vite-browser-external\.cjs["']\)/g;

  const walk = (dir: string): void => {
    let dirents: Dirent[];
    try {
      dirents = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of dirents) {
      const path = join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name.startsWith('__vite-browser-external')) {
          continue;
        }
        walk(path);
        continue;
      }
      if (ent.name.startsWith('__vite-browser-external.')) {
        rmSync(path, { force: true });
        stats.removed = (stats.removed ?? 0) + 1;
        continue;
      }
      if (!ent.name.endsWith('.mjs') && !ent.name.endsWith('.cjs')) {
        continue;
      }
      stats.files += 1;
      const before = readFileSync(path, 'utf8');
      let after = before;
      if (ent.name.endsWith('.mjs')) {
        after = after.replace(mjsImport, 'const $1 = () => ({});\n');
      } else {
        after = after.replace(cjsRequire, (_, name: string) => `;const ${name}={default:{}}`);
      }
      if (after !== before) {
        writeFileSync(path, after);
        stats.patched += 1;
      }
    }
  };

  walk(distDir);
  return stats;
}

function removeOrphanToolbarDividerDts(root: string): void {
  const dts = resolve(root, 'dist/src/plugins/ToolbarDividerPlugin/index.d.ts');
  if (!existsSync(dts)) {
    return;
  }
  rmSync(dts, { force: true });
  const dir = dirname(dts);
  try {
    if (readdirSync(dir).length === 0) {
      rmSync(dir, { recursive: true, force: true });
    }
  } catch {
    /* ignore */
  }
  console.log('[ocm-package] removed orphan ToolbarDividerPlugin/index.d.ts');
}

/** Keep first `@layer properties{…}` block; drop the rest (Tailwind per-chunk noise). */
function stripDuplicatePropertyLayers(css: string): string {
  let seen = false;
  let out = '';
  let i = 0;
  const marker = '@layer properties{';
  while (i < css.length) {
    const start = css.indexOf(marker, i);
    if (start === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, start);
    let depth = 0;
    let j = start + marker.length - 1;
    for (; j < css.length; j++) {
      const ch = css[j];
      if (ch === '{') {
        depth += 1;
      } else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          j += 1;
          break;
        }
      }
    }
    if (!seen) {
      out += css.slice(start, j);
      seen = true;
    }
    i = j;
  }
  return out;
}

function concatCss(root: string, paths: string[]): string {
  return paths
    .map((path) => {
      const body = readFileSync(path, 'utf8').trim();
      if (!body) {
        return '';
      }
      return `/* --- ${relative(root, path)} --- */\n${body}\n`;
    })
    .filter(Boolean)
    .join('\n');
}

function withDistFontUrls(css: string): string {
  return css
    .replaceAll(/url\((['"]?)\.\.\/\.\.\/fonts\//g, 'url($1fonts/')
    .replaceAll(/url\((['"]?)\.\.\/fonts\//g, 'url($1fonts/');
}

function emitPackageCss(root: string): void {
  const twSrc = resolve(root, 'dist/src/tailwind.css');
  const indexSrc = resolve(root, 'dist/src/index.css');
  const publicSrc = resolve(root, 'dist/src/public.css');
  const sdkCss = resolve(root, 'dist/packages/sdk/src/ui/sdk.css');

  for (const required of [twSrc, indexSrc, publicSrc, sdkCss]) {
    if (!existsSync(required)) {
      throw new Error(`[ocm-package] missing ${relative(root, required)}`);
    }
  }

  const pluginStyles = findNamedDeep(resolve(root, 'dist/src/plugins'), 'style.css').toSorted(
    (a, b) => a.localeCompare(b)
  );

  const tw = readFileSync(twSrc, 'utf8');
  let indexChunk = readFileSync(indexSrc, 'utf8');
  const prior = indexChunk.indexOf(SDK_MARKER);
  if (prior !== -1) {
    indexChunk = indexChunk.slice(0, prior).trimEnd();
  }

  const sdk = readFileSync(sdkCss, 'utf8');
  const bundled = stripDuplicatePropertyLayers(
    [tw, indexChunk, `${SDK_MARKER}\n${sdk}`, concatCss(root, pluginStyles)].join('\n')
  );

  writeFileSync(resolve(root, 'dist/index.css'), bundled);
  writeFileSync(resolve(root, 'dist/tailwind.css'), tw);
  writeFileSync(
    resolve(root, 'dist/public.css'),
    withDistFontUrls(readFileSync(publicSrc, 'utf8'))
  );

  console.log(`[ocm-package] dist/index.css <= tw + index + sdk + ${pluginStyles.length} plugins`);
  console.log('[ocm-package] dist/public.css + dist/tailwind.css');

  for (const legacy of ['public.css', 'index.css', 'tailwind.css']) {
    const path = resolve(root, legacy);
    if (existsSync(path)) {
      rmSync(path, { force: true });
    }
  }
}

/**
 * Post-build packaging for the library dist:
 * dual `.d.cts`, CSS elision fixes, typo-js browser-external cleanup,
 * convenience `dist/{index,public,tailwind}.css`.
 */
export function ocmPackagePlugin(root = process.cwd()): Plugin {
  return {
    name: 'ocm-package',
    apply: 'build',
    // After vite-plugin-dts and all rollup outputs are on disk.
    enforce: 'post',
    closeBundle: {
      sequential: true,
      order: 'post',
      handler() {
        // e2e SPA build uses dist-e2e — skip packaging.
        if (!existsSync(resolve(root, 'dist/app.mjs'))) {
          return;
        }

        const distDir = resolve(root, 'dist');

        emitCtsTypes(root);

        const cssPatch = patchEmptyCssElision(distDir);
        console.log(
          `[ocm-package] empty-css: scanned ${cssPatch.files}, patched ${cssPatch.patched}`
        );

        const browserExt = stripViteBrowserExternal(distDir);
        console.log(
          `[ocm-package] browser-external: scanned ${browserExt.files}, patched ${browserExt.patched}, removed ${browserExt.removed ?? 0}`
        );

        removeOrphanToolbarDividerDts(root);
        emitPackageCss(root);
      },
    },
  };
}
