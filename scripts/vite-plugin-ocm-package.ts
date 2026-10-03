import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import type { Plugin } from 'vite';

const CTS_ENTRIES = [
  'dist/app.d.ts',
  'dist/plugins.d.ts',
  'dist/json.d.ts',
  'dist/markdown.d.ts',
  'dist/code.d.ts',
  'dist/forms.d.ts',
  'dist/charts.d.ts',
  'dist/calendar.d.ts',
  'dist/packages/sdk/src/index.d.ts',
  'dist/packages/kernel/src/index.d.ts',
  'dist/packages/view/src/index.d.ts',
] as const;

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

/** Ship Typo.js BSD attribution with published dist (hunspell is bundled). */
function emitThirdPartyNotices(root: string): void {
  const src = resolve(root, 'packages/hunspell/NOTICE');
  const dest = resolve(root, 'dist/THIRD_PARTY_NOTICES.txt');
  if (!existsSync(src)) {
    console.warn('[ocm-package] missing packages/hunspell/NOTICE — skip THIRD_PARTY_NOTICES');
    return;
  }
  copyFileSync(src, dest);
  console.log('[ocm-package] dist/THIRD_PARTY_NOTICES.txt <= packages/hunspell/NOTICE');
}

/**
 * Post-build packaging for the library dist:
 * dual `.d.cts` entry types + third-party notices.
 * CSS emit lives in `vite.styles.config.ts`; hygiene gates in `check-dist-package`.
 */
export function ocmPackagePlugin(root = process.cwd()): Plugin {
  return {
    name: 'ocm-package',
    apply: 'build',
    enforce: 'post',
    closeBundle: {
      sequential: true,
      order: 'post',
      handler() {
        // e2e SPA build uses dist-e2e — skip packaging.
        if (!existsSync(resolve(root, 'dist/app.mjs'))) {
          return;
        }

        emitCtsTypes(root);
        emitThirdPartyNotices(root);

        // Guard: packaging must not silently rewrite JS/CSS. Fail loud if regress.
        const distApp = resolve(root, 'dist/app.mjs');
        const appSrc = readFileSync(distApp, 'utf8');
        if (appSrc.includes('/* empty css')) {
          throw new Error(
            '[ocm-package] dist/app.mjs contains Vite empty-css placeholders — CSS must not be in the JS graph (see vite.styles.config.ts)'
          );
        }
      },
    },
  };
}
