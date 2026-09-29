/** One PFX/SFX entry from a Hunspell `.aff` file. */
export type AffixEntry = {
  add: string;
  continuationClasses?: string[];
  match?: RegExp;
  /** SFX: trailing RegExp; PFX: literal prefix string to strip. */
  remove?: RegExp | string;
};

/** Affix rule keyed by flag code in the `.aff` file. */
export type AffixRule = {
  type: 'PFX' | 'SFX';
  combineable: boolean;
  entries: AffixEntry[];
};

export type AffixRules = Record<string, AffixRule>;

/** Named flag values from `.aff` (`FLAG`, `KEEPCASE`, `TRY`, …). */
export type AffFlags = Record<string, string>;

/**
 * Word → flag-code sets.
 * - `null` — word present with no flags
 * - `string[][]` — one or more flag lists (duplicate dic entries)
 */
export type DictionaryTable = Map<string, string[][] | null>;

export type ReplacementPair = readonly [from: string, to: string];

export type SuggestMemo = {
  suggestions: string[];
  limit: number;
};

/** Mutable engine state after parsing `.aff` + `.dic`. */
export type HunspellState = {
  dictionaryTable: DictionaryTable;
  /** Compiled compound-word patterns. */
  compoundRules: RegExp[];
  replacementTable: ReplacementPair[];
  flags: AffFlags;
  memoized: Record<string, SuggestMemo>;
  alphabet: string;
};

export type HunspellDictionary = {
  readonly loaded: true;
  check(word: string): boolean;
  checkExact(word: string): boolean;
  suggest(word: string, limit?: number): string[];
};
