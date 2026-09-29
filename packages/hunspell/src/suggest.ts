import { check, hasFlag } from './check';
import { MAX_SUGGEST_MEMO, MAX_SUGGEST_WORD_LEN } from './limits';
import type { HunspellState } from './types';

function ensureAlphabet(state: HunspellState): string {
  if (state.alphabet.length > 0) {
    return state.alphabet;
  }

  // Hunspell: suggestion edits come from TRY (+ WORDCHARS). Latin fallback is only
  // for incomplete .aff files — do not force English letters onto every locale.
  const LATIN_FALLBACK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let alphabet = '';
  if (state.flags.TRY !== undefined && state.flags.TRY.length > 0) {
    alphabet = state.flags.TRY;
  } else {
    alphabet = LATIN_FALLBACK;
  }
  if (state.flags.WORDCHARS !== undefined) {
    alphabet += state.flags.WORDCHARS;
  }

  const seen = new Set<string>();
  let unique = '';
  for (const ch of alphabet) {
    if (!seen.has(ch)) {
      seen.add(ch);
      unique += ch;
    }
  }
  state.alphabet = unique;
  return unique;
}

type EditCounts = Record<string, number>;

function edits1(
  state: HunspellState,
  words: Record<string, true | number>,
  knownOnly: boolean
): EditCounts {
  const alphabet = ensureAlphabet(state);
  const rv: EditCounts = {};

  const bump = (edit: string): void => {
    if (knownOnly && !check(state, edit)) {
      return;
    }
    rv[edit] = (rv[edit] ?? 0) + 1;
  };

  for (const word of Object.keys(words)) {
    for (let i = 0; i <= word.length; i++) {
      const left = word.slice(0, i);
      const right = word.slice(i);

      if (right.length > 0) {
        bump(left + right.slice(1));
      }

      const right0 = right[0];
      const right1 = right[1];
      if (right.length > 1 && right1 !== undefined && right0 !== undefined && right1 !== right0) {
        bump(left + right1 + right0 + right.slice(2));
      }

      if (right.length > 0) {
        const lettercase =
          right.slice(0, 1).toUpperCase() === right.slice(0, 1) ? 'uppercase' : 'lowercase';
        for (const ch of alphabet) {
          let replacementLetter = ch;
          if (lettercase === 'uppercase') {
            replacementLetter = replacementLetter.toUpperCase();
          }
          if (replacementLetter !== right.slice(0, 1)) {
            bump(left + replacementLetter + right.slice(1));
          }
        }
      }

      if (right.length > 0) {
        // Capitalize insert when both neighbors are uppercase.
        const leftTail = left.slice(-1);
        const rightHead = right.slice(0, 1);
        const lettercase =
          leftTail.toUpperCase() === leftTail && rightHead.toUpperCase() === rightHead
            ? 'uppercase'
            : 'lowercase';
        for (const ch of alphabet) {
          let replacementLetter = ch;
          if (lettercase === 'uppercase') {
            replacementLetter = replacementLetter.toUpperCase();
          }
          bump(left + replacementLetter + right);
        }
      }
    }
  }

  return rv;
}

function rankCorrections(state: HunspellState, word: string, limit: number): string[] {
  // Norvig tier-1: known edit-distance-1 first (fast path for near-misses).
  const tier1 = edits1(state, { [word]: true }, true);
  let weighted: EditCounts = tier1;

  if (Object.keys(tier1).length === 0) {
    // Tier-2: expand unknown ed1 seeds, then keep only known ed2 forms.
    const ed1 = edits1(state, { [word]: true }, false);
    const unknownSeeds: Record<string, true | number> = {};
    let seedCount = 0;
    const MAX_ED2_SEEDS = 64;
    for (const [candidate, weight] of Object.entries(ed1)) {
      if (check(state, candidate)) {
        weighted[candidate] = (weighted[candidate] ?? 0) + weight;
        continue;
      }
      if (seedCount >= MAX_ED2_SEEDS) {
        continue;
      }
      unknownSeeds[candidate] = weight;
      seedCount += 1;
    }
    if (Object.keys(unknownSeeds).length > 0) {
      const ed2 = edits1(state, unknownSeeds, true);
      for (const [candidate, weight] of Object.entries(ed2)) {
        weighted[candidate] = (weighted[candidate] ?? 0) + weight;
      }
    }
  }

  const sorted: Array<[string, number]> = [];
  for (const [candidate, weight] of Object.entries(weighted)) {
    let w = weight;
    if (hasFlag(state, candidate, 'PRIORITYSUGGEST')) {
      w += 1000;
    }
    sorted.push([candidate, w]);
  }

  sorted.sort((a, b) => {
    if (a[1] !== b[1]) {
      return b[1] - a[1];
    }
    return a[0].localeCompare(b[0]);
  });

  let capitalizationScheme: 'lowercase' | 'uppercase' | 'capitalized' = 'lowercase';
  if (word.toUpperCase() === word) {
    capitalizationScheme = 'uppercase';
  } else if (word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase() === word) {
    capitalizationScheme = 'capitalized';
  }

  const rv: string[] = [];
  let workingLimit = limit;
  for (let i = 0; i < Math.min(workingLimit, sorted.length); i++) {
    const entry = sorted[i];
    if (entry === undefined) {
      break;
    }
    let suggestion = entry[0];
    if (capitalizationScheme === 'uppercase') {
      suggestion = suggestion.toUpperCase();
    } else if (capitalizationScheme === 'capitalized') {
      suggestion = suggestion.slice(0, 1).toUpperCase() + suggestion.slice(1);
    }
    if (!hasFlag(state, suggestion, 'NOSUGGEST') && !rv.includes(suggestion)) {
      rv.push(suggestion);
    } else {
      workingLimit++;
    }
  }
  return rv;
}

/**
 * Suggest corrections for a misspelling (REP table + edit-distance ranking).
 */
export function suggest(state: HunspellState, word: string, limit = 5): string[] {
  if (word.length === 0 || word.length > MAX_SUGGEST_WORD_LEN) {
    return [];
  }

  const normalized = word.replaceAll('\u2019', "'");
  const memo = state.memoized[normalized];
  if (memo !== undefined && (limit <= memo.limit || memo.suggestions.length < memo.limit)) {
    return memo.suggestions.slice(0, limit);
  }

  if (check(state, normalized)) {
    return [];
  }

  for (const [from, to] of state.replacementTable) {
    if (normalized.includes(from)) {
      const corrected = normalized.replace(from, to);
      if (check(state, corrected)) {
        const suggestions = [corrected];
        remember(state, normalized, suggestions, limit);
        return suggestions;
      }
    }
  }

  const suggestions = rankCorrections(state, normalized, limit);
  remember(state, normalized, suggestions, limit);
  return suggestions;
}

function remember(state: HunspellState, word: string, suggestions: string[], limit: number): void {
  const keys = Object.keys(state.memoized);
  if (keys.length >= MAX_SUGGEST_MEMO) {
    const drop = keys[0];
    if (drop !== undefined) {
      delete state.memoized[drop];
    }
  }
  state.memoized[word] = { suggestions, limit };
}
