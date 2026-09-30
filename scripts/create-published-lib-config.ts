/**
 * Shared Vite lib factory for publishable `@codemerge/*` packages.
 * One stack (Vite + vite-plugin-dts) — no tsup, no post-hoc CSS stubs.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import type { Dirent } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin, UserConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { scssPreprocessorOptions } from './scss-vite-options.ts';

export type PublishedLibOptions = {
  /** Absolute path to the package directory (e.g. packages/kernel). */
  packageDir: string;
  /** Entry map: output name → path relative to packageDir. */
  entries: Record<string, string>;
  /** Extra bare externals (beyond package.json dependencies). */
  external?: string[];
  /** Optional CSS build (compiled through PostCSS / Tailwind). */
  css?: {
    /** Path relative to packageDir (scss/css). */
    source: string;
    /** Output asset name under dist/ (e.g. sdk.css). */
    fileName: string;
  };
};

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

/** Dual-package: copy every `*.d.ts` under dist to sibling `*.d.cts`. */
export function emitDistCts(distDir: string): void {
  walkFiles(distDir, (path, ent) => {
    if (!ent.name.endsWith('.d.ts') || ent.name.endsWith('.d.ts.map')) {
      return;
    }
    const dest = path.replace(/\.d\.ts$/, '.d.cts');
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(path, dest);
  });
}

function emitCtsPlugin(distDir: string): Plugin {
  return {
    name: 'ocm-emit-d-cts',
    closeBundle() {
      if (existsSync(distDir)) {
        emitDistCts(distDir);
      }
    },
  };
}

function readPkgExternals(packageDir: string, extra: string[] = []): Set<string> {
  const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...extra,
  ]);
}

function isExternal(id: string, externals: Set<string>): boolean {
  if (
    !id ||
    id.startsWith('\0') ||
    id.startsWith('.') ||
    id.startsWith('/') ||
    /^[A-Za-z]:[\\/]/.test(id)
  ) {
    return false;
  }
  for (const dep of externals) {
    if (id === dep || id.startsWith(`${dep}/`)) {
      return true;
    }
  }
  return false;
}

function jsConfig(
  packageDir: string,
  entryName: string,
  entryRel: string,
  externals: Set<string>,
  emptyOutDir: boolean,
  emitCts: boolean
): UserConfig {
  const distDir = resolve(packageDir, 'dist');
  const entryAbs = resolve(packageDir, entryRel);
  const repoRoot = resolve(packageDir, '../..');

  return defineConfig({
    root: packageDir,
    build: {
      emptyOutDir,
      outDir: 'dist',
      sourcemap: true,
      minify: false,
      target: 'es2020',
      lib: {
        entry: { [entryName]: entryAbs },
        formats: ['es', 'cjs'],
        fileName: (format, name) => `${name}.${format === 'es' ? 'mjs' : 'cjs'}`,
      },
      rollupOptions: {
        external: (id) => isExternal(id, externals),
        output: {
          exports: 'named',
        },
      },
    },
    plugins: [
      dts({
        entryRoot: resolve(packageDir, 'src'),
        include: [resolve(packageDir, 'src')],
        exclude: [
          resolve(packageDir, 'src/**/__tests__/**'),
          resolve(packageDir, 'src/**/*.test.ts'),
          resolve(packageDir, 'src/**/*.perf.test.ts'),
          resolve(packageDir, 'src/**/sdk.css.ts'),
        ],
        tsconfigPath: resolve(repoRoot, 'tsconfig.packages.json'),
        insertTypesEntry: false,
        pathsToAliases: false,
        copyDtsFiles: true,
      }),
      ...(emitCts ? [emitCtsPlugin(distDir)] : []),
    ],
  });
}

function cssConfig(
  packageDir: string,
  sourceRel: string,
  cssFileName: string,
  emitCts: boolean
): UserConfig {
  const distDir = resolve(packageDir, 'dist');
  const repoRoot = resolve(packageDir, '../..');
  const entryAbs = resolve(packageDir, sourceRel);

  return defineConfig({
    root: packageDir,
    css: {
      postcss: resolve(repoRoot, 'postcss.config.js'),
      preprocessorOptions: {
        scss: scssPreprocessorOptions,
      },
    },
    build: {
      emptyOutDir: false,
      outDir: 'dist',
      cssCodeSplit: false,
      lib: {
        entry: entryAbs,
        formats: ['es'],
        fileName: () => '__css_stub__',
      },
      rollupOptions: {
        output: {
          assetFileNames: cssFileName,
        },
      },
    },
    plugins: [
      {
        name: 'ocm-published-css-cleanup',
        closeBundle() {
          for (const name of ['__css_stub__.mjs', '__css_stub__.mjs.map', '__css_stub__.js']) {
            const p = resolve(distDir, name);
            if (existsSync(p)) {
              rmSync(p);
            }
          }
          const stubDir = resolve(distDir, '__css_stub__');
          if (existsSync(stubDir)) {
            rmSync(stubDir, { recursive: true, force: true });
          }
          // vite-plugin-dts may emit types for the CSS entry — drop them.
          for (const name of ['sdk.css.d.ts', 'sdk.css.d.ts.map', 'sdk.css.d.cts']) {
            const p = resolve(distDir, 'ui', name);
            if (existsSync(p)) {
              rmSync(p);
            }
          }
          if (emitCts && existsSync(distDir)) {
            emitDistCts(distDir);
          }
        },
      },
    ],
  });
}

/**
 * Returns one Vite config per JS entry (+ optional CSS).
 * Use as default export: `export default createPublishedLibConfigs({ ... })`.
 */
export function createPublishedLibConfigs(opts: PublishedLibOptions): UserConfig[] {
  const { packageDir, entries, external = [], css } = opts;
  const externals = readPkgExternals(packageDir, external);
  const entryList = Object.entries(entries);
  if (entryList.length === 0) {
    throw new Error('createPublishedLibConfigs: entries must not be empty');
  }

  const hasCss = Boolean(css);
  const configs = entryList.map(([name, entryRel], index) =>
    jsConfig(
      packageDir,
      name,
      entryRel,
      externals,
      index === 0,
      !hasCss && index === entryList.length - 1
    )
  );

  if (css) {
    configs.push(cssConfig(packageDir, css.source, css.fileName, true));
  }

  return configs;
}
