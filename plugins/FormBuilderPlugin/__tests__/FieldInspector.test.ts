import { describe, expect, it, vi } from 'vitest';
import { FormStore } from '../services/FormStore';
import { FieldInspector } from '../components/FieldInspector';
import type { EditorAPI } from '@codemerge/sdk';

function stubEditor(): EditorAPI {
  return {
    t: (k: string) => k,
  } as unknown as EditorAPI;
}

describe('FieldInspector', () => {
  it('type change bar→select runs coerce (choices appear)', () => {
    const store = new FormStore(stubEditor());
    const bar = store.addField('text');
    expect(bar.options?.options).toBeUndefined();

    const onChange = vi.fn();
    const inspector = new FieldInspector(stubEditor(), store, {
      onChange,
      onRemove: vi.fn(),
      onClone: vi.fn(),
    });

    const host = document.createElement('div');
    document.body.appendChild(host);
    inspector.mountInto(host, bar);

    const select = host.querySelector('select');
    expect(select).toBeTruthy();
    select!.value = 'select';
    select!.dispatchEvent(new Event('change', { bubbles: true }));

    const next = store.getField(bar.id);
    expect(next?.type).toBe('select');
    expect(next?.options?.options?.length).toBeGreaterThan(0);
    expect(onChange).toHaveBeenCalledWith();

    inspector.destroy();
    host.remove();
  });
});
