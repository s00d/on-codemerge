/** Curated options for the block style panel (no raw CSS junk). */

export const FONT_SIZES = [
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '40px',
  '48px',
] as const;

export const FONT_WEIGHTS = ['normal', '500', '600', '700', '800'] as const;

export const TEXT_ALIGNS = ['left', 'center', 'right', 'justify'] as const;

export const BORDER_STYLES = ['none', 'solid', 'dashed', 'dotted'] as const;

export const BORDER_WIDTHS = ['1px', '2px', '3px', '4px', '6px', '8px'] as const;

/** CSS keys the panel can edit. */
export const STYLE_KEYS = [
  'color',
  'background-color',
  'font-size',
  'font-weight',
  'text-align',
  'border-style',
  'border-width',
  'border-color',
] as const;

export type StyleKey = (typeof STYLE_KEYS)[number];

export type StyleDraft = Record<StyleKey, string>;

export function emptyDraft(): StyleDraft {
  return {
    color: '',
    'background-color': '',
    'font-size': '',
    'font-weight': '',
    'text-align': '',
    'border-style': '',
    'border-width': '',
    'border-color': '',
  };
}

export function parseStyleAttr(raw: unknown): StyleDraft {
  const draft = emptyDraft();
  if (typeof raw !== 'string' || !raw.trim()) {
    return draft;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return draft;
    }
    for (const key of STYLE_KEYS) {
      const v = (parsed as Record<string, unknown>)[key];
      if (typeof v === 'string' && v.trim()) {
        draft[key] = v.trim();
      }
    }
  } catch {
    /* ignore non-JSON legacy */
  }
  return draft;
}

export function draftToStyleJson(draft: StyleDraft): string {
  const out: Record<string, string> = {};
  for (const key of STYLE_KEYS) {
    const v = draft[key]?.trim() ?? '';
    if (v) {
      out[key] = v;
    }
  }
  return Object.keys(out).length > 0 ? JSON.stringify(out) : '';
}
