import { describe, expect, it } from 'vitest';
import { emptyEditorDoc, parseText, serializeDoc } from '../io';
import { emptyFormConfig } from '../io/adapters';
import { createField } from '../drivers';

const stubI18n = { t: (k: string) => k };

describe('io.roundtrip', () => {
  it('emptyEditorDoc → serialize → parse keeps method and fields length', () => {
    const config = emptyFormConfig();
    config.fields = [
      createField('text', stubI18n, 'a'),
      createField('email', stubI18n, 'b'),
      createField('select', stubI18n, 'c'),
    ];
    config.method = 'POST';
    const doc = emptyEditorDoc(config);
    const text = serializeDoc(doc);
    const parsed = parseText(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.doc.type).toBe('doc');
    const form = parsed.doc.content?.[0];
    expect(form?.type).toBe('form');
    const schema = form?.attrs?.schema as typeof config;
    expect(schema.method).toBe('POST');
    expect(schema.fields.length).toBe(3);
    expect(schema.fields.map((f) => f.type)).toStrictEqual(['text', 'email', 'select']);
  });
});
