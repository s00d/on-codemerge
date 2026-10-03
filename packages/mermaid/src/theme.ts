import type { DiagramTheme, ResolvedTheme } from './types';

/** Soft fill + stroke pairs — first slot is OCM sky accent. */
export type ColorSwatch = { fill: string; stroke: string };

/** Light — matches `--color-ocm-*` in packages/sdk/src/ui/ocm-theme.css. */
export const DEFAULTS: DiagramTheme = {
  bg: '#ffffff',
  fg: '#18181b',
  line: '#71717a',
  accent: '#0284c7',
  surface: '#f0f9ff',
  border: '#e4e4e7',
};

/** Dark — matches `html.dark` OCM flip. */
export const DARK: DiagramTheme = {
  bg: '#18181b',
  fg: '#fafafa',
  line: '#a1a1aa',
  accent: '#38bdf8',
  surface: '#27272a',
  border: '#3f3f46',
};

/** Sequence participant boxes (docs-style distinct colors, OCM-first). */
export const ACTOR_SWATCHES: ColorSwatch[] = [
  { fill: '#e0f2fe', stroke: '#0284c7' }, // sky
  { fill: '#ccfbf1', stroke: '#0d9488' }, // teal
  { fill: '#ffedd5', stroke: '#ea580c' }, // orange
  { fill: '#fce7f3', stroke: '#db2777' }, // rose
  { fill: '#ede9fe', stroke: '#7c3aed' }, // violet soft
  { fill: '#ecfccb', stroke: '#65a30d' }, // lime
];

/** Sequence / callout-style note. */
export const NOTE_SWATCH: ColorSwatch = { fill: '#fef9c3', stroke: '#ca8a04' };

/** Edge label plate background. */
export const EDGE_LABEL_FILL = '#e0f2fe';

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function isHex(value: string | undefined): value is string {
  return typeof value === 'string' && HEX.test(value);
}

export function resolveTheme(theme?: DiagramTheme): ResolvedTheme {
  const base = theme ?? DEFAULTS;
  if (!isHex(base.bg) || !isHex(base.fg)) {
    throw new Error('theme.bg and theme.fg must be hex (#rgb or #rrggbb)');
  }
  const fallback = DEFAULTS;
  return {
    bg: base.bg,
    fg: base.fg,
    line: isHex(base.line) ? base.line : (fallback.line ?? '#71717a'),
    accent: isHex(base.accent) ? base.accent : (fallback.accent ?? '#0284c7'),
    surface: isHex(base.surface) ? base.surface : (fallback.surface ?? '#f0f9ff'),
    border: isHex(base.border) ? base.border : (fallback.border ?? '#e4e4e7'),
    font: 'ui-sans-serif, system-ui, sans-serif',
  };
}
