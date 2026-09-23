export type FontOption = {
  /** CSS font-family value to apply */
  id: string;
  /** Display name */
  label: string;
};

/**
 * Candidates to probe when Local Font Access is unavailable.
 * Names only — stacks are built as `"Name", generic`.
 */
export const FONT_CANDIDATES: readonly {
  name: string;
  generic: 'sans-serif' | 'serif' | 'monospace';
}[] = [
  { name: 'Arial', generic: 'sans-serif' },
  { name: 'Helvetica', generic: 'sans-serif' },
  { name: 'Helvetica Neue', generic: 'sans-serif' },
  { name: 'Verdana', generic: 'sans-serif' },
  { name: 'Tahoma', generic: 'sans-serif' },
  { name: 'Trebuchet MS', generic: 'sans-serif' },
  { name: 'Segoe UI', generic: 'sans-serif' },
  { name: 'Roboto', generic: 'sans-serif' },
  { name: 'Ubuntu', generic: 'sans-serif' },
  { name: 'Cantarell', generic: 'sans-serif' },
  { name: 'Noto Sans', generic: 'sans-serif' },
  { name: 'Gill Sans', generic: 'sans-serif' },
  { name: 'Optima', generic: 'sans-serif' },
  { name: 'Futura', generic: 'sans-serif' },
  { name: 'Avenir', generic: 'sans-serif' },
  { name: 'Avenir Next', generic: 'sans-serif' },
  { name: 'Geneva', generic: 'sans-serif' },
  { name: 'Georgia', generic: 'serif' },
  { name: 'Times New Roman', generic: 'serif' },
  { name: 'Times', generic: 'serif' },
  { name: 'Palatino', generic: 'serif' },
  { name: 'Palatino Linotype', generic: 'serif' },
  { name: 'Book Antiqua', generic: 'serif' },
  { name: 'Garamond', generic: 'serif' },
  { name: 'Baskerville', generic: 'serif' },
  { name: 'Didot', generic: 'serif' },
  { name: 'Hoefler Text', generic: 'serif' },
  { name: 'Courier New', generic: 'monospace' },
  { name: 'Courier', generic: 'monospace' },
  { name: 'Menlo', generic: 'monospace' },
  { name: 'Monaco', generic: 'monospace' },
  { name: 'Consolas', generic: 'monospace' },
  { name: 'SF Mono', generic: 'monospace' },
  { name: 'Andale Mono', generic: 'monospace' },
  { name: 'Lucida Console', generic: 'monospace' },
  { name: 'Comic Sans MS', generic: 'sans-serif' },
  { name: 'Impact', generic: 'sans-serif' },
  { name: 'Arial Black', generic: 'sans-serif' },
];

export const SYSTEM_FONT: FontOption = {
  id: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  label: 'System',
};

export function cssStack(name: string, generic: string): string {
  const quoted = /\s/.test(name) ? `"${name}"` : name;
  return `${quoted}, ${generic}`;
}

/** Static fallback before / without detection. */
export const FONT_FAMILIES: FontOption[] = [
  SYSTEM_FONT,
  ...FONT_CANDIDATES.slice(0, 10).map((c) => ({
    id: cssStack(c.name, c.generic),
    label: c.name,
  })),
];

/** Common body / heading sizes (px). */
export const FONT_SIZES = [
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '36px',
  '48px',
] as const;

export const LINE_HEIGHTS = [
  { id: '1', labelKey: 'font.lhTight' },
  { id: '1.25', labelKey: 'font.lhSnug' },
  { id: '1.5', labelKey: 'font.lhNormal' },
  { id: '1.75', labelKey: 'font.lhRelaxed' },
  { id: '2', labelKey: 'font.lhLoose' },
  { id: 'normal', labelKey: 'font.lhDefault' },
] as const;

export type FontDraft = {
  family: string;
  size: string;
  lineHeight: string;
};

export function defaultDraft(): FontDraft {
  return {
    family: SYSTEM_FONT.id,
    size: '16px',
    lineHeight: '1.5',
  };
}

/** @deprecated */
export const DEFAULT_FONT_FAMILIES = FONT_FAMILIES.map((f) => f.id);
export const DEFAULT_FONT_SIZES = [...FONT_SIZES];
export const DEFAULT_LINE_HEIGHTS = LINE_HEIGHTS.map((l) => l.id);
