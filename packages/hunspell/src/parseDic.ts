import { applyRule } from './applyRule';
import { parseRuleCodes } from './parseRuleCodes';
import type { AffFlags, AffixRules, DictionaryTable } from './types';

function removeDicComments(data: string): string {
  // de_DE and some others use tab-indented comment lines.
  return data.replace(/^\t.*$/gm, '');
}

export type ParseDicOptions = {
  rules: AffixRules;
  flags: AffFlags;
  /** Mutated: flag code → stems that carry that compound flag. */
  compoundRuleCodes: Record<string, string[]>;
};

/**
 * Parse Hunspell `.dic` content into a word→flags lookup table.
 * Also expands affix forms into the table (Typo.js approach).
 */
export function parseDic(data: string, options: ParseDicOptions): DictionaryTable {
  const { rules, flags, compoundRuleCodes } = options;
  const cleaned = removeDicComments(data);
  const lines = cleaned.split(/\r?\n/);
  const dictionaryTable: DictionaryTable = new Map();

  function addWord(word: string, ruleCodes: string[]): void {
    if (!dictionaryTable.has(word)) {
      dictionaryTable.set(word, null);
    }
    if (ruleCodes.length === 0) {
      return;
    }
    if (dictionaryTable.get(word) === null) {
      dictionaryTable.set(word, []);
    }
    const existing = dictionaryTable.get(word);
    if (Array.isArray(existing)) {
      existing.push(ruleCodes);
    }
  }

  // First line is the word count — skip it.
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined || line.length === 0) {
      continue;
    }

    // Drop morphological fields (`xx:abc`); keep `word` or `word/flags`.
    const justWordAndFlags = line.replace(/\s.*$/, '');
    const parts = justWordAndFlags.split('/', 2);
    const word = parts[0] ?? '';
    if (word.length === 0) {
      continue;
    }

    if (parts.length > 1) {
      const ruleCodesArray = parseRuleCodes(parts[1], flags);
      const needAffix = flags.NEEDAFFIX;
      if (needAffix === undefined || !ruleCodesArray.includes(needAffix)) {
        addWord(word, ruleCodesArray);
      }

      for (let j = 0; j < ruleCodesArray.length; j++) {
        const code = ruleCodesArray[j];
        if (code === undefined) {
          continue;
        }
        const rule = rules[code];
        if (rule !== undefined) {
          const newWords = applyRule(word, rule, rules);
          for (const newWord of newWords) {
            addWord(newWord, []);
            if (rule.combineable) {
              for (let k = j + 1; k < ruleCodesArray.length; k++) {
                const combineCode = ruleCodesArray[k];
                if (combineCode === undefined) {
                  continue;
                }
                const combineRule = rules[combineCode];
                if (
                  combineRule !== undefined &&
                  combineRule.combineable &&
                  rule.type !== combineRule.type
                ) {
                  for (const other of applyRule(newWord, combineRule, rules)) {
                    addWord(other, []);
                  }
                }
              }
            }
          }
        }
        const compoundStems = compoundRuleCodes[code];
        if (compoundStems !== undefined) {
          compoundStems.push(word);
        }
      }
    } else {
      addWord(word.trim(), []);
    }
  }

  return dictionaryTable;
}
