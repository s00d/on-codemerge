import { resolve } from 'node:path';
import type { PublishedLibOptions } from '../../scripts/create-published-lib-config.ts';

const config: PublishedLibOptions = {
  packageDir: resolve(import.meta.dirname),
  entries: {
    index: 'src/index.ts',
  },
};

export default config;
