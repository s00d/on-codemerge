import { resolve } from 'node:path';
import { definePerfSuite, consoleReporter, jsonReporter } from '@untestutils/perf';

const root = resolve(import.meta.dirname);

/**
 * Soft perf smoke: Vite SPA serve readiness + light load.
 * Thresholds are intentionally loose (noise-tolerant CI).
 */
export default definePerfSuite({
  runs: 1,
  verbosity: 'default',
  coolDownMs: 300,
  postBuildDelayMs: 200,
  artifactsDir: resolve(root, 'test/.untestutils/perf'),
  reporters: [consoleReporter(), jsonReporter()],
  targets: [
    {
      id: 'editor',
      root,
      // Lib `vite build` is the package bundle and fails CSS minify; measure the SPA dev server.
      build: {
        command: 'node',
        args: ['-e', 'process.exit(0)'],
      },
      start: {
        command: 'pnpm',
        args: ['exec', 'vite', '--host', '127.0.0.1', '--port', '19100', '--strictPort'],
        port: 19_100,
      },
    },
  ],
  thresholds: {
    buildTimeSec: 30,
  },
});
