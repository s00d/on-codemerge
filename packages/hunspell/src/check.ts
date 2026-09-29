import { MAX_CHECK_WORD_LEN } from './limits';
import type { HunspellState } from './types';

/** Typographic apostrophe → ASCII (dictionary-en stems use U+0027). */
function normalizeWord(word: string): string {
  return word.replaceAll('\u2019', "'");
}

function flattenFlags(ruleCodes: string[][] | null | undefined): string[] {
  if (ruleCodes === null || ruleCodes === undefined) {
    return [];
  }
  return ruleCodes.flat();
}

/**
 * Whether `word` carries the named affix flag (e.g. `KEEPCASE`, `NOSUGGEST`).
 */
export function hasFlag(
  state: HunspellState,
  word: string,
  flag: string,
  wordFlags?: string[]
): boolean {
  const flagValue = state.flags[flag];
  if (flagValue === undefined) {
    return false;
  }
  const codes = wordFlags ?? flattenFlags(state.dictionaryTable.get(word) ?? undefined);
  return codes.includes(flagValue);
}

/**
 * Exact dictionary lookup (no capitalization folding). Also matches compound rules.
 */
export function checkExact(state: HunspellState, word: string): boolean {
  if (word.length > MAX_CHECK_WORD_LEN) {
    return false;
  }

  const ruleCodes = state.dictionaryTable.get(word);

  if (ruleCodes === undefined) {
    const compoundMin = state.flags.COMPOUNDMIN;
    if (
      compoundMin !== undefined &&
      word.length >= Number(compoundMin) &&
      word.length <= MAX_CHECK_WORD_LEN
    ) {
      for (const rule of state.compoundRules) {
        if (rule.test(word)) {
          return true;
        }
      }
    }
    return false;
  }

  if (ruleCodes === null) {
    return true;
  }

  for (const codes of ruleCodes) {
    if (!hasFlag(state, word, 'ONLYINCOMPOUND', codes)) {
      return true;
    }
  }
  return false;
}

/**
 * Spell-check with capitalization variants (all-caps / Capitalized).
 */
export function check(state: HunspellState, aWord: string): boolean {
  if (aWord.length === 0) {
    return false;
  }

  const trimmedWord = normalizeWord(aWord).replace(/^\s+/, '').replace(/\s+$/, '');
  if (checkExact(state, trimmedWord)) {
    return true;
  }

  const first = trimmedWord.charAt(0);
  if (trimmedWord.toUpperCase() === trimmedWord) {
    const capitalizedWord = first + trimmedWord.slice(1).toLowerCase();
    if (hasFlag(state, capitalizedWord, 'KEEPCASE')) {
      return false;
    }
    if (checkExact(state, capitalizedWord)) {
      return true;
    }
    if (checkExact(state, trimmedWord.toLowerCase())) {
      return true;
    }
  }

  const uncapitalizedWord = first.toLowerCase() + trimmedWord.slice(1);
  if (uncapitalizedWord !== trimmedWord) {
    if (hasFlag(state, uncapitalizedWord, 'KEEPCASE')) {
      return false;
    }
    if (checkExact(state, uncapitalizedWord)) {
      return true;
    }
  }

  return false;
}
