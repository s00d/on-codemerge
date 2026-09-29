export type EnCheckRow = {
  id: string;
  word: string;
  check: boolean;
  checkExact?: boolean;
};

export type EnSuggestRow = {
  id: string;
  input: string;
  limit?: number;
  mustInclude?: string[];
  mustExclude?: string[];
};

/** Compact corpus on real dictionary-en (~50k stems). Keep rows few and stable. */
export const EN_CHECK_CORPUS: EnCheckRow[] = [
  { id: 'common-beautiful', word: 'beautiful', check: true },
  { id: 'common-the', word: 'the', check: true },
  { id: 'miss-beautifull', word: 'beautifull', check: false },
  { id: 'miss-zxqwy', word: 'zxqwy', check: false },
  { id: 'pfx-unhappy', word: 'unhappy', check: true },
  { id: 'sfx-cats', word: 'cats', check: true },
  { id: 'compound-21st', word: '21st', check: true },
  { id: 'compound-11th', word: '11th', check: true },
  { id: 'compound-56714th', word: '56714th', check: true },
  { id: 'onlyincompound-1th', word: '1th', check: false },
  { id: 'onlyincompound-3th', word: '3th', check: false },
  { id: 'casing-Beautiful', word: 'Beautiful', check: true, checkExact: false },
  { id: 'dont-ascii', word: "don't", check: true },
  { id: 'dont-curly', word: 'don\u2019t', check: true },
];

export const EN_SUGGEST_CORPUS: EnSuggestRow[] = [
  {
    id: 'near-beautifull',
    input: 'beautifull',
    limit: 5,
    mustInclude: ['beautiful'],
  },
  {
    id: 'near-colur',
    input: 'colur',
    limit: 5,
    mustInclude: ['color'],
  },
  {
    id: 'nosuggest-bullshit',
    input: 'bullshitt',
    limit: 10,
    mustExclude: ['bullshit'],
  },
];
