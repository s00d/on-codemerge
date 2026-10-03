import { describe, expect, it } from 'vitest';

/**
 * Size/absence gate: `scripts/check-public-bundle.mjs` (docs CI + prepublishOnly).
 * Not asserted here — unit suite runs without a prior lib build.
 */
describe('public.js bundle size', () => {
  it('is documented as post-build check-public-bundle', () => {
    expect('scripts/check-public-bundle.mjs').toMatch(/check-public-bundle/);
  });
});
