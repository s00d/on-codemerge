import { describe, expect, it } from 'vitest';
import { DARK, DEFAULTS, render, resolveTheme } from '../index';

describe('theme', () => {
  it('resolveTheme fills missing optional colors from defaults', () => {
    const t = resolveTheme({ bg: '#ffffff', fg: '#000000' });
    expect(t.line).toMatch(/^#/);
    expect(t.font).toContain('system-ui');
    expect(t.accent).toBe('#0284c7');
  });

  it('DEFAULTS match OCM sky tokens', () => {
    expect(DEFAULTS.accent).toBe('#0284c7');
    expect(DEFAULTS.fg).toBe('#18181b');
    expect(DEFAULTS.border).toBe('#e4e4e7');
  });

  it('rejects non-hex bg/fg', () => {
    expect(() => resolveTheme({ bg: 'red', fg: '#000000' })).toThrow(/hex/i);
  });

  it('dark vs light change background fill', () => {
    const light = render('flowchart LR\n  A-->B', { theme: DEFAULTS });
    const dark = render('flowchart LR\n  A-->B', { theme: DARK });
    expect(light).toContain(`fill="${DEFAULTS.bg}"`);
    expect(dark).toContain(`fill="${DARK.bg}"`);
    expect(light).not.toBe(dark);
    expect(light).toContain(`fill="${DEFAULTS.accent}"`);
  });
});
