import type { AffFlags } from './types';

/**
 * Split a Hunspell flag string according to the `.aff` `FLAG` mode.
 * Default: one character per flag.
 */
export function parseRuleCodes(textCodes: string | undefined, flags: AffFlags): string[] {
  if (!textCodes) {
    return [];
  }
  if (!('FLAG' in flags)) {
    return textCodes.split('');
  }
  if (flags.FLAG === 'long') {
    const out: string[] = [];
    for (let i = 0; i < textCodes.length; i += 2) {
      out.push(textCodes.slice(i, i + 2));
    }
    return out;
  }
  if (flags.FLAG === 'num') {
    return textCodes.split(',');
  }
  if (flags.FLAG === 'UTF-8') {
    return Array.from(textCodes);
  }
  return textCodes.split('');
}
