import { MAX_APPLY_RULE_DEPTH } from './limits';
import type { AffixRule, AffixRules } from './types';

/**
 * Apply one affix rule (and any continuation classes) to a stem.
 */
export function applyRule(word: string, rule: AffixRule, rules: AffixRules, depth = 0): string[] {
  const newWords: string[] = [];
  if (depth > MAX_APPLY_RULE_DEPTH) {
    return newWords;
  }

  for (const entry of rule.entries) {
    if (entry.match !== undefined && !entry.match.test(word)) {
      continue;
    }

    let newWord = word;
    if (entry.remove !== undefined) {
      newWord = newWord.replace(entry.remove, '');
    }
    newWord = rule.type === 'SFX' ? newWord + entry.add : entry.add + newWord;
    newWords.push(newWord);

    const cont = entry.continuationClasses;
    if (cont === undefined) {
      continue;
    }
    for (const code of cont) {
      const continuationRule = rules[code];
      if (continuationRule !== undefined) {
        newWords.push(...applyRule(newWord, continuationRule, rules, depth + 1));
      }
    }
  }

  return newWords;
}
