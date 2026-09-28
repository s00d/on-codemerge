import type { DocNode } from '@on-codemerge/kernel';
import { docFromJSON, docToJSON } from '@on-codemerge/kernel';

export function serializeJSON(doc: DocNode): string {
  return JSON.stringify(docToJSON(doc));
}

export function parseJSON(raw: string): DocNode {
  const data: unknown = JSON.parse(raw);
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid JSON document');
  }
  return docFromJSON(data);
}
