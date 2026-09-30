import { resolve } from 'node:path';
import type { PublishedLibOptions } from '../../scripts/create-published-lib-config.ts';

const config: PublishedLibOptions = {
  packageDir: resolve(import.meta.dirname),
  entries: {
    index: 'src/index.ts',
    'ui/index': 'src/ui/index.ts',
    'ui/chrome': 'src/ui/chrome.ts',
  },
  css: {
    source: 'src/ui/sdk.css.ts',
    fileName: 'sdk.css',
  },
};

export default config;
