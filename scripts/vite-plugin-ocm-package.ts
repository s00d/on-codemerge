import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { emitDualDeclarations } from './vite-plugin-emit-d-cts.ts';

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
 * node16-resolvable `.d.ts` + dual `.d.cts` types + third-party notices.
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

        emitDualDeclarations(resolve(root, 'dist'));
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
