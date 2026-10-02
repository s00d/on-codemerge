import type { DocNode } from '@codemerge/kernel';
import { nextId } from '@codemerge/kernel';
import type { FormConfig } from '../types';
import { isFormConfig } from '../types';

export function emptyFormConfig(): FormConfig {
  return {
    id: `form_${Date.now().toString(36)}`,
    method: 'POST',
    action: '',
    className: 'generated-form',
    fields: [],
  };
}

/** Kernel SoT: `doc` → one `form` child. */
export function toEditorDoc(form: DocNode): DocNode {
  if (form.type !== 'form') {
    throw new TypeError('toEditorDoc expects type "form"');
  }
  return {
    type: 'doc',
    id: nextId('doc'),
    content: [form],
  };
}

export function isFormEditorDoc(doc: DocNode): boolean {
  return doc.type === 'doc' && (doc.content?.length ?? 0) === 1 && doc.content![0]?.type === 'form';
}

export function resolveFormNode(doc: DocNode): DocNode {
  if (doc.type === 'form') {
    return doc;
  }
  if (doc.type === 'doc') {
    const child = doc.content?.[0];
    if (child?.type === 'form') {
      return child;
    }
  }
  throw new TypeError('Expected doc→form SoT');
}

export function configFromDoc(doc: DocNode): FormConfig {
  const node = resolveFormNode(doc);
  const schema = node.attrs?.schema;
  if (isFormConfig(schema)) {
    return schema;
  }
  return emptyFormConfig();
}

export function emptyEditorDoc(config?: FormConfig): DocNode {
  const schema = config ?? emptyFormConfig();
  return toEditorDoc({
    type: 'form',
    id: nextId('form'),
    attrs: {
      schema,
      action: schema.action || '',
      align: '',
    },
  });
}

export function docFromConfig(config: FormConfig): DocNode {
  return emptyEditorDoc(config);
}
