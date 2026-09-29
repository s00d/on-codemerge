/** Resource bounds for untrusted / oversized Hunspell inputs. */

export const MAX_AFF_BYTES = 8_388_608;
export const MAX_DIC_BYTES = 8_388_608;
export const MAX_AFFIX_ENTRIES = 10_000;
export const MAX_APPLY_RULE_DEPTH = 12;
export const MAX_COMPOUND_REGEX_SOURCE = 4096;
export const MAX_AFFIX_PATTERN_LEN = 80;
export const MAX_CHECK_WORD_LEN = 256;
export const MAX_SUGGEST_WORD_LEN = 64;
export const MAX_SUGGEST_MEMO = 512;

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
