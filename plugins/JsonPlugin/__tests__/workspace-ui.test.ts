/**
 * Compact Tree UI + CM raw + menu remount guards.
 */
import { describe, expect, it, afterEach } from 'vitest';
import {
  Editor as JsonEditor,
  createDefaultPlugins,
  emptyEditorDoc,
  docToValue,
} from 'on-codemerge/json';
import { changeType, duplicateNode, pathToDot, pathToJsonPointer } from '../commands/jsonCommands';
import { applyTransaction, createState, runCommand } from '@on-codemerge/kernel';
import { toEditorDoc, valueToDoc } from '../io';

function openRaw(editor: JsonEditor): void {
  const btn = editor.host.querySelector('[data-id="json-mode-raw"]') as HTMLButtonElement;
  expect(btn).toBeTruthy();
  btn.click();
  expect(editor.contentElement()?.getAttribute('data-ocm-json-mode')).toBe('raw');
}

describe('JsonPlugin workspace UI', () => {
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    for (const host of hosts) {
      const ed = Reflect.get(host, '__editor');
      if (ed && typeof ed.destroy === 'function') {
        ed.destroy();
      }
      host.remove();
    }
    hosts.length = 0;
  });

  function mountEditor(value: unknown = { hello: 'json editor', n: 1, ok: true }) {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new JsonEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc(value),
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);
    return { host, editor };
  }

  it('renders compact rows with key inputs and type chips (no native select)', () => {
    const { editor } = mountEditor({ a: 'x', b: 2 });
    const tree = editor.contentElement()?.querySelector('.ocm-json-tree');
    expect(tree).toBeTruthy();
    expect(tree!.querySelectorAll('input[aria-label="Property key"]')).toHaveLength(2);
    expect(tree!.querySelectorAll('select')).toHaveLength(0);
    expect(tree!.querySelectorAll('[data-ocm-json-actions]').length).toBeGreaterThan(0);
  });

  it('keeps raw draft text across selectionChanged', () => {
    const { editor } = mountEditor({ a: 'x' });
    openRaw(editor);
    const ta = editor
      .contentElement()
      ?.querySelector('textarea[aria-label="Source editor"]') as HTMLTextAreaElement;
    expect(ta).toBeTruthy();
    const before = ta.value;
    ta.focus();
    expect(document.activeElement).toBe(ta);
    editor.setSelection(editor.getState().selection);
    const ta2 = editor
      .contentElement()
      ?.querySelector('textarea[aria-label="Source editor"]') as HTMLTextAreaElement;
    expect(ta2.value).toBe(before);
    expect(document.activeElement).toBe(ta2);
  });

  it('changes type via command (menu Type path)', () => {
    const { editor } = mountEditor({ a: 'x' });
    expect(editor.run(changeType([0, 0, 0, 0], 'jsonNumber'))).toBe(true);
    expect(docToValue(editor.getState().doc)).toStrictEqual({ a: 0 });
    expect(editor.contentElement()?.querySelector('input[aria-label="Number value"]')).toBeTruthy();
  });

  it('edits string / boolean values inline', () => {
    const { editor } = mountEditor({ msg: 'hi', flag: false });
    let tree = editor.contentElement()!.querySelector('.ocm-json-tree')!;
    const str = tree.querySelector('input[aria-label="String value"]') as HTMLInputElement;
    str.value = 'bye';
    str.dispatchEvent(new Event('change', { bubbles: true }));
    str.blur();
    expect(docToValue(editor.getState().doc)).toStrictEqual({ msg: 'bye', flag: false });

    tree = editor.contentElement()!.querySelector('.ocm-json-tree')!;
    const flagBtn = tree.querySelector('button[aria-label="Boolean value"]') as HTMLButtonElement;
    expect(flagBtn).toBeTruthy();
    expect(flagBtn.textContent).toBe('false');
    flagBtn.click();
    expect(docToValue(editor.getState().doc)).toStrictEqual({ msg: 'bye', flag: true });
    const toggled = editor
      .contentElement()!
      .querySelector('button[aria-label="Boolean value"]') as HTMLButtonElement;
    expect(toggled.textContent).toBe('true');
  });

  it('renames keys and deletes via actions', () => {
    const { editor } = mountEditor({ old: 1, keep: 2 });
    let tree = editor.contentElement()!.querySelector('.ocm-json-tree')!;
    const key = tree.querySelector('input[aria-label="Property key"]') as HTMLInputElement;
    key.value = 'renamed';
    key.dispatchEvent(new Event('change', { bubbles: true }));
    key.blur();
    expect(docToValue(editor.getState().doc)).toStrictEqual({ renamed: 1, keep: 2 });

    tree = editor.contentElement()!.querySelector('.ocm-json-tree')!;
    const renamedRow = [...tree.querySelectorAll('input[aria-label="Property key"]')]
      .find((el) => (el as HTMLInputElement).value === 'renamed')
      ?.closest('.ocm-json-row') as HTMLElement;
    renamedRow.click();
    tree = editor.contentElement()!.querySelector('.ocm-json-tree')!;
    const selected = tree.querySelector('.ocm-json-row.is-selected') as HTMLElement;
    const del = selected.querySelector('button[title="Delete"]') as HTMLButtonElement;
    del.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(docToValue(editor.getState().doc)).toStrictEqual({ keep: 2 });
  });

  it('collapse survives selectionChanged', () => {
    const { editor } = mountEditor({ nested: { a: 1, b: 2 } });
    let tree = editor.contentElement()!.querySelector('.ocm-json-tree')!;
    const toggle = tree.querySelector('button[aria-expanded]') as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    tree = editor.contentElement()!.querySelector('.ocm-json-tree')!;
    expect(tree.querySelector('button[aria-expanded="false"]')).toBeTruthy();
    const before = tree.querySelectorAll('.ocm-json-row').length;
    editor.setSelection(editor.getState().selection);
    const afterTree = editor.contentElement()!.querySelector('.ocm-json-tree')!;
    expect(afterTree.querySelectorAll('.ocm-json-row').length).toBe(before);
    expect(afterTree.querySelector('button[aria-expanded="false"]')).toBeTruthy();
  });

  it('dirty Raw draft is fail-closed: tree op blocked until Discard', () => {
    const { editor } = mountEditor({ a: 1 });
    openRaw(editor);
    const ta = editor
      .contentElement()
      ?.querySelector('textarea[aria-label="Source editor"]') as HTMLTextAreaElement;
    expect(ta).toBeTruthy();
    ta.value = '{"a":1,';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(editor.contentElement()?.textContent).toContain('Draft dirty');
    expect(editor.contentElement()?.querySelector('[role="status"]')?.textContent ?? '').toMatch(
      /JSON|Unexpected|position|token|end/i
    );

    const before = docToValue(editor.getState().doc);
    // Cannot leave Raw while dirty.
    const treeBtn = editor.host.querySelector('[data-id="json-mode-tree"]') as HTMLButtonElement;
    treeBtn.click();
    expect(editor.contentElement()?.getAttribute('data-ocm-json-mode')).toBe('raw');

    // Menu/toolbar path: editor.run must also be gated (not only tree runGuarded).
    expect(editor.run(changeType([0, 0, 0, 0], 'jsonNumber'))).toBe(false);
    expect(docToValue(editor.getState().doc)).toStrictEqual(before);
    expect(editor.undo()).toBe(false);

    const discard = [...editor.contentElement()!.querySelectorAll('button')].find(
      (b) => b.textContent === 'Discard'
    ) as HTMLButtonElement;
    discard.click();
    expect(editor.contentElement()?.textContent).toContain('SoT synced');
    (editor.host.querySelector('[data-id="json-mode-tree"]') as HTMLButtonElement).click();
    expect(editor.contentElement()?.getAttribute('data-ocm-json-mode')).toBe('tree');
  });

  it('Apply commits valid Raw draft into SoT', () => {
    const { editor } = mountEditor({ a: 1 });
    openRaw(editor);
    const ta = editor
      .contentElement()
      ?.querySelector('textarea[aria-label="Source editor"]') as HTMLTextAreaElement;
    ta.value = '{"a":2,"b":true}';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(editor.contentElement()?.textContent).toContain('Draft dirty');
    const apply = [...editor.contentElement()!.querySelectorAll('button')].find(
      (b) => b.textContent === 'Apply'
    ) as HTMLButtonElement;
    expect(apply).toBeTruthy();
    apply.click();
    expect(docToValue(editor.getState().doc)).toStrictEqual({ a: 2, b: true });
    expect(editor.contentElement()?.textContent).toContain('SoT synced');
  });

  it('rejected rename heals key inputs from SoT', () => {
    const { editor } = mountEditor({ a: 1, b: 2 });
    const keys = [
      ...editor.contentElement()!.querySelectorAll('input[aria-label="Property key"]'),
    ] as HTMLInputElement[];
    expect(keys).toHaveLength(2);
    keys[1]!.value = 'a';
    keys[1]!.dispatchEvent(new Event('change', { bubbles: true }));
    const healed = [
      ...editor.contentElement()!.querySelectorAll('input[aria-label="Property key"]'),
    ] as HTMLInputElement[];
    expect(healed.map((el) => el.value)).toStrictEqual(['a', 'b']);
    expect(docToValue(editor.getState().doc)).toStrictEqual({ a: 1, b: 2 });
  });

  it('Mod-d duplicates via selection command (value path under property)', () => {
    const { editor } = mountEditor({ a: 1 });
    editor.setSelection({
      anchor: { path: [0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 0, 0], offset: 0 },
    });
    const host = editor.contentElement()!;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true, bubbles: true }));
    expect(docToValue(editor.getState().doc)).toStrictEqual({ a: 1, a_copy: 1 });
  });

  it('Delete removes property when selection is on value path', () => {
    const { editor } = mountEditor({ a: 'hello', b: 1 });
    editor.setSelection({
      anchor: { path: [0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 0, 0], offset: 0 },
    });
    editor
      .contentElement()!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    expect(docToValue(editor.getState().doc)).toStrictEqual({ b: 1 });
  });

  it('Discard restores SoT after invalid Raw draft', () => {
    const { editor } = mountEditor({ a: 1 });
    openRaw(editor);
    const ta = editor
      .contentElement()
      ?.querySelector('textarea[aria-label="Source editor"]') as HTMLTextAreaElement;
    ta.value = '{"a":';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(editor.contentElement()?.textContent).toContain('Draft dirty');
    const discard = [...editor.contentElement()!.querySelectorAll('button')].find(
      (b) => b.textContent === 'Discard'
    ) as HTMLButtonElement;
    expect(discard).toBeTruthy();
    discard.click();
    expect(editor.contentElement()?.textContent).toContain('SoT synced');
    expect(docToValue(editor.getState().doc)).toStrictEqual({ a: 1 });
    const restored = editor
      .contentElement()
      ?.querySelector('textarea[aria-label="Source editor"]') as HTMLTextAreaElement;
    expect(JSON.parse(restored.value)).toStrictEqual({ a: 1 });
  });

  it('Raw mode replaces Tree (not stacked below)', () => {
    const { editor } = mountEditor({ a: 1 });
    const root = editor.contentElement()!;
    const tree = root.querySelector('.ocm-json-tree') as HTMLElement;
    const raw = root.querySelector('.ocm-json-raw-slot') as HTMLElement;
    expect(tree.hidden).toBe(false);
    expect(raw.hidden).toBe(true);
    openRaw(editor);
    expect(tree.hidden).toBe(true);
    expect(raw.hidden).toBe(false);
  });

  it('history toolbar uses icons', () => {
    const { host } = mountEditor();
    const undo = host.querySelector('[data-id="undo"]') as HTMLButtonElement;
    const redo = host.querySelector('[data-id="redo"]') as HTMLButtonElement;
    expect(undo.querySelector('svg')).toBeTruthy();
    expect(redo.querySelector('svg')).toBeTruthy();
  });

  it('status shows selection path (single frame, no nested panel)', () => {
    const { editor } = mountEditor({ a: { b: 1 } });
    const root = editor.contentElement()!;
    expect(root.querySelector('.ocm-json-crumbs')).toBeNull();
    expect(root.querySelector('.ocm-json-panel')).toBeNull();
    expect(root.classList.contains('ocm-json-root')).toBe(true);
    editor.setSelection({
      anchor: { path: [0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 0, 0], offset: 0 },
    });
    expect(root.textContent).toContain('a');
    expect(root.textContent).toContain('SoT synced');
  });
});

describe('json path helpers + duplicate', () => {
  it('pathToDot / pathToJsonPointer', () => {
    const doc = toEditorDoc(valueToDoc({ users: [{ email: 'a@b.c' }] }));
    // json → object → users prop → array → [0] → email prop
    const propPath = [0, 0, 0, 0, 0, 0];
    expect(pathToDot(doc, propPath)).toBe('users.0.email');
    expect(pathToJsonPointer(doc, propPath)).toBe('/users/0/email');
  });

  it('duplicateNode clones property', () => {
    let state = createState(toEditorDoc(valueToDoc({ a: 1 })));
    const tr = runCommand(state, duplicateNode([0, 0, 0]));
    expect(tr).not.toBeNull();
    state = applyTransaction(state, tr!).state;
    expect(docToValue(state.doc)).toStrictEqual({ a: 1, a_copy: 1 });
  });
});
