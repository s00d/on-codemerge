import { check, checkExact } from './check';
import { escapeRegExp, MAX_AFF_BYTES, MAX_COMPOUND_REGEX_SOURCE, MAX_DIC_BYTES } from './limits';
import { parseAff } from './parseAff';
import { parseDic } from './parseDic';
import { suggest } from './suggest';
import type { HunspellDictionary, HunspellState } from './types';

function buildCompoundRegexes(
  patterns: string[],
  compoundRuleCodes: Record<string, string[]>
): RegExp[] {
  const out: RegExp[] = [];
  for (const ruleText of patterns) {
    let expressionText = '';
    for (const character of ruleText) {
      if (Object.hasOwn(compoundRuleCodes, character)) {
        const stems = compoundRuleCodes[character] ?? [];
        expressionText += `(${stems.map(escapeRegExp).join('|')})`;
      } else {
        // Hunspell COMPOUNDRULE operators (e.g. `*` in `n*1t`) must stay unescaped.
        expressionText += character;
      }
    }
    if (expressionText.length > MAX_COMPOUND_REGEX_SOURCE) {
      continue;
    }
    try {
      out.push(new RegExp(`^${expressionText}$`, 'i'));
    } catch {
      // Malformed pattern after escaping — skip this compound rule.
    }
  }
  return out;
}

/**
 * Build a Hunspell dictionary from raw `.aff` and `.dic` file contents.
 * Dictionaries are not bundled — callers fetch/load the files.
 */
export function createDictionary(affData: string, dicData: string): HunspellDictionary {
  if (affData.length > MAX_AFF_BYTES || dicData.length > MAX_DIC_BYTES) {
    throw new Error('dictionary too large');
  }

  const { rules, flags, compoundRulePatterns, replacementTable } = parseAff(affData);

  const compoundRuleCodes: Record<string, string[]> = {};
  for (const pattern of compoundRulePatterns) {
    for (const ch of pattern) {
      compoundRuleCodes[ch] = [];
    }
  }
  if (flags.ONLYINCOMPOUND !== undefined) {
    compoundRuleCodes[flags.ONLYINCOMPOUND] = [];
  }

  const dictionaryTable = parseDic(dicData, { rules, flags, compoundRuleCodes });

  for (const code of Object.keys(compoundRuleCodes)) {
    if ((compoundRuleCodes[code] ?? []).length === 0) {
      delete compoundRuleCodes[code];
    }
  }

  const compoundRules = buildCompoundRegexes(compoundRulePatterns, compoundRuleCodes);

  const state: HunspellState = {
    dictionaryTable,
    compoundRules,
    replacementTable,
    flags,
    memoized: {},
    alphabet: '',
  };

  return {
    loaded: true,
    check: (word: string) => check(state, word),
    checkExact: (word: string) => checkExact(state, word),
    suggest: (word: string, limit?: number) => suggest(state, word, limit),
  };
}
