import type { DocNode } from '@on-codemerge/kernel';
import { nextId } from '@on-codemerge/kernel';

const DEFAULT_LANGUAGE = 'plaintext';

/** Kernel SoT: `doc` → one `code_source` child. */
export function toEditorDoc(source: DocNode): DocNode {
  if (source.type !== 'code_source') {
    throw new TypeError('toEditorDoc expects type "code_source"');
  }
  return {
    type: 'doc',
    id: nextId('doc'),
    content: [source],
  };
}

export function isCodeEditorDoc(doc: DocNode): boolean {
  return (
    doc.type === 'doc' &&
    (doc.content?.length ?? 0) === 1 &&
    doc.content![0]?.type === 'code_source'
  );
}

export function resolveCodeSource(doc: DocNode): DocNode {
  if (doc.type === 'code_source') {
    return doc;
  }
  if (doc.type === 'doc') {
    const child = doc.content?.[0];
    if (child?.type === 'code_source') {
      return child;
    }
  }
  throw new TypeError('Expected doc→code_source SoT');
}

export function textFromDoc(doc: DocNode): string {
  const src = resolveCodeSource(doc);
  return typeof src.attrs?.text === 'string' ? src.attrs.text : '';
}

export function languageFromDoc(doc: DocNode): string {
  const src = resolveCodeSource(doc);
  const lang = src.attrs?.language;
  return typeof lang === 'string' && lang.trim() ? lang.trim() : DEFAULT_LANGUAGE;
}

export function emptyEditorDoc(text = '', language = DEFAULT_LANGUAGE): DocNode {
  return toEditorDoc({
    type: 'code_source',
    id: nextId('cs'),
    attrs: { text, language },
  });
}

export function docFromText(text: string, language = DEFAULT_LANGUAGE): DocNode {
  return emptyEditorDoc(text, language);
}
