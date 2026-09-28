export type JsonLeafType =
  | 'jsonObject'
  | 'jsonArray'
  | 'jsonString'
  | 'jsonNumber'
  | 'jsonBoolean'
  | 'jsonNull';

export const VALUE_TYPES = new Set<string>([
  'jsonObject',
  'jsonArray',
  'jsonString',
  'jsonNumber',
  'jsonBoolean',
  'jsonNull',
]);
