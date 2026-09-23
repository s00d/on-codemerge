/**
 * Shared Sass options for every Vite / VitePress config.
 * Vite 5 (and misconfigured Vite 8) defaults to the legacy JS API and spams
 * `Deprecation [legacy-js-api]` — pin modern-compiler everywhere.
 * @see https://sass-lang.com/d/legacy-js-api
 */
import type { DeprecationOrId } from 'sass';

export const scssPreprocessorOptions: {
  api: 'modern-compiler';
  silenceDeprecations: DeprecationOrId[];
} = {
  api: 'modern-compiler',
  // Published sheets use meta.load-css; silence leftover @import noise.
  silenceDeprecations: ['import'],
};
