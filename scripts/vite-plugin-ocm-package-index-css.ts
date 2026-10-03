import type { Plugin } from 'vite';
import {
  buildPackageIndexCss,
  OCM_PACKAGE_INDEX_CSS_ID,
  ocmPackageIndexCssResolvedPath,
} from './ocm-package-index-css.ts';

/** Virtual `virtual:ocm-package-index.css` — auto-imports plugin `./style.scss` exports. */
export function ocmPackageIndexCssPlugin(root: string): Plugin {
  const resolved = ocmPackageIndexCssResolvedPath(root);
  return {
    name: 'ocm-package-index-css',
    resolveId(id) {
      if (id === OCM_PACKAGE_INDEX_CSS_ID || id === resolved) {
        return resolved;
      }
      return null;
    },
    load(id) {
      if (id === resolved) {
        return buildPackageIndexCss(root);
      }
      return null;
    },
  };
}
