import { describe, expect, it } from 'vitest';
/**
 * @jest-environment jsdom
 */
import { createPlatform } from '../Extension';
import { MathPlugin, createCorePlugins, createDefaultPlugins } from '../../plugins';

describe('platform plugins', () => {
  it('seals schema with core plugins', () => {
    expect.hasAssertions();
    const platform = createPlatform(createCorePlugins());
    expect(platform.schema.sealed).toBe(true);
    expect(platform.schema.nodes.has('image')).toBe(true);
    expect(platform.commands.has('toggleBold')).toBe(true);
  });

  it('registers math from MathPlugin', () => {
    expect.hasAssertions();
    const platform = createPlatform([MathPlugin()]);
    expect(platform.schema.nodes.has('math')).toBe(true);
    expect(platform.schema.nodes.get('math')?.atom).toBe(true);
  });

  it('rejects duplicate command names', () => {
    expect.hasAssertions();
    expect(() =>
      createPlatform([
        { name: 'a', commands: { sharedCmd: () => null } },
        { name: 'b', commands: { sharedCmd: () => null } },
      ])
    ).toThrow(/already registered/);
  });

  it('default plugins include overlays and complex', () => {
    expect.hasAssertions();
    const platform = createPlatform(createDefaultPlugins());
    expect(platform.schema.nodes.has('math')).toBe(true);
    expect(platform.schema.marks.has('mention')).toBe(true);
    expect(platform.schema.marks.has('comment')).toBe(true);
    expect(platform.plugins.size).toBeGreaterThan(30);
  });
});
