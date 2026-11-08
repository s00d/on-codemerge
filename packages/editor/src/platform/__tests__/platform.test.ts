import { describe, expect, it } from 'vitest';
/**
 * @jest-environment jsdom
 */
import { createPlatform, registerPlugin } from '../Extension';
import { MathPlugin, createCorePlugins, createDefaultPlugins } from '@ocm/plugins';

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

  it('registerPlugin after seal rejects nodes / marks', () => {
    expect.hasAssertions();
    const platform = createPlatform([]);
    const editor = { host: document.createElement('div') } as never;
    expect(() => {
      registerPlugin(
        platform,
        { name: 'late', nodes: [{ name: 'lateNode', group: 'block' }] },
        editor
      );
    }).toThrow(/sealed/);
    expect(() => {
      registerPlugin(platform, { name: 'lateMark', marks: [{ name: 'lateM' }] }, editor);
    }).toThrow(/sealed/);
    expect(platform.plugins.has('late')).toBe(false);
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
