import { normalizeBrLabel } from '../scan';

/** Mermaid labels may use HTML `<br/>` for line breaks — normalize to `\n`. */
export function normalizeLabel(s: string): string {
  return normalizeBrLabel(s);
}
