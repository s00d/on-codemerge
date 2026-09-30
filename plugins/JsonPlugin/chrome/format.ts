import type { Command } from '@codemerge/kernel';
import { getNodeAt } from '@codemerge/kernel';

const JSON_ROOT_PATH = [0];

/** Persist pretty/compact indent on `json` root via set_attrs (not getText/setText). */
export function setFormatIndent(indent: number): Command {
  return (state) => {
    let node;
    try {
      node = getNodeAt(state.doc, JSON_ROOT_PATH);
    } catch {
      return null;
    }
    if (node.type !== 'json') {
      return null;
    }
    const current = node.attrs?.indent;
    if (current === indent) {
      return [];
    }
    return [
      {
        type: 'set_attrs',
        path: JSON_ROOT_PATH,
        attrs: { indent },
        replace: false,
      },
    ];
  };
}
