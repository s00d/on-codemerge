import type { AffFlags, AffixEntry, AffixRules, ReplacementPair } from './types';
import { MAX_AFFIX_ENTRIES, MAX_AFFIX_PATTERN_LEN } from './limits';
import { parseRuleCodes } from './parseRuleCodes';

export type AffParseResult = {
  rules: AffixRules;
  flags: AffFlags;
  /** Raw COMPOUNDRULE pattern strings (not yet RegExp). */
  compoundRulePatterns: string[];
  replacementTable: ReplacementPair[];
};

function removeAffixComments(line: string): string {
  // Only strip full-line comments — COMPOUNDRULE may use `#` as a flag char.
  if (/^\s*#/.test(line)) {
    return '';
  }
  return line;
}

function tryCompileAffixRegex(source: string): RegExp | undefined {
  if (source.length > MAX_AFFIX_PATTERN_LEN) {
    return undefined;
  }
  try {
    return new RegExp(source);
  } catch {
    return undefined;
  }
}

/**
 * Parse Hunspell `.aff` content into rules, named flags, compound patterns, and REP pairs.
 */
export function parseAff(data: string): AffParseResult {
  const rules: AffixRules = {};
  const flags: AffFlags = {};
  const compoundRulePatterns: string[] = [];
  const replacementTable: ReplacementPair[] = [];

  const lines = data.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    let line = removeAffixComments(lines[i] ?? '').trim();
    if (!line) {
      continue;
    }

    const definitionParts = line.split(/\s+/);
    const ruleType = definitionParts[0];
    if (!ruleType) {
      continue;
    }

    if (ruleType === 'PFX' || ruleType === 'SFX') {
      const ruleCode = definitionParts[1];
      const combineable = definitionParts[2];
      const numEntries = Math.trunc(Number(definitionParts[3] ?? '0'));
      if (
        !ruleCode ||
        Number.isNaN(numEntries) ||
        numEntries < 0 ||
        numEntries > MAX_AFFIX_ENTRIES
      ) {
        if (!Number.isNaN(numEntries) && numEntries > 0) {
          i += Math.min(numEntries, lines.length);
        }
        continue;
      }

      const entries: AffixEntry[] = [];
      for (let j = i + 1; j < i + 1 + numEntries; j++) {
        const subline = lines[j] ?? '';
        const lineParts = subline.split(/\s+/);
        const charactersToRemove = lineParts[2] ?? '0';
        const additionParts = (lineParts[3] ?? '0').split('/');
        let charactersToAdd = additionParts[0] ?? '';
        if (charactersToAdd === '0') {
          charactersToAdd = '';
        }
        const continuationClasses = parseRuleCodes(additionParts[1], flags);
        const regexToMatch = lineParts[4] ?? '.';

        const entry: AffixEntry = { add: charactersToAdd };
        if (continuationClasses.length > 0) {
          entry.continuationClasses = continuationClasses;
        }
        if (regexToMatch !== '.') {
          const match =
            ruleType === 'SFX'
              ? tryCompileAffixRegex(`${regexToMatch}$`)
              : tryCompileAffixRegex(`^${regexToMatch}`);
          if (match === undefined) {
            continue;
          }
          entry.match = match;
        }
        if (charactersToRemove !== '0') {
          if (ruleType === 'SFX') {
            const remove = tryCompileAffixRegex(`${charactersToRemove}$`);
            if (remove === undefined) {
              continue;
            }
            entry.remove = remove;
          } else if (charactersToRemove.length <= MAX_AFFIX_PATTERN_LEN) {
            entry.remove = charactersToRemove;
          } else {
            continue;
          }
        }
        entries.push(entry);
      }

      rules[ruleCode] = {
        type: ruleType,
        combineable: combineable === 'Y',
        entries,
      };
      i += numEntries;
    } else if (ruleType === 'COMPOUNDRULE') {
      const numEntries = Math.trunc(Number(definitionParts[1] ?? '0'));
      if (Number.isNaN(numEntries) || numEntries < 0 || numEntries > MAX_AFFIX_ENTRIES) {
        if (!Number.isNaN(numEntries) && numEntries > 0) {
          i += Math.min(numEntries, lines.length);
        }
        continue;
      }
      for (let j = i + 1; j < i + 1 + numEntries; j++) {
        const parts = (lines[j] ?? '').split(/\s+/);
        const pattern = parts[1];
        if (pattern) {
          compoundRulePatterns.push(pattern);
        }
      }
      i += numEntries;
    } else if (ruleType === 'REP') {
      const from = definitionParts[1];
      const to = definitionParts[2];
      if (from !== undefined && to !== undefined && definitionParts.length === 3) {
        replacementTable.push([from, to]);
      }
    } else {
      // ONLYINCOMPOUND, COMPOUNDMIN, FLAG, KEEPCASE, NEEDAFFIX, TRY, WORDCHARS, NOSUGGEST, …
      const value = definitionParts[1];
      if (value !== undefined) {
        flags[ruleType] = value;
      }
    }
  }

  return { rules, flags, compoundRulePatterns, replacementTable };
}
