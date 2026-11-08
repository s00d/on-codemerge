import { describe, expect, it } from 'vitest';
import type { EditorAPI } from '@codemerge/sdk';

import { buildGridContextMenu } from '../chrome/gridContextMenu';
import { TableStore } from '../grid/TableStore';

function stubEditor(): EditorAPI {
  return {
    t: (k: string) => k,
    ui: {
      popup: { open: () => ({ close: () => {}, update: () => {} }) },
      menu: { open: () => {}, isOpen: false },
    },
  } as unknown as EditorAPI;
}

describe('buildGridContextMenu', () => {
  it('nests insert/delete/style with icons', () => {
    const store = new TableStore({
      version: 2,
      columns: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ],
      rows: [{ id: 'r1', cells: { a: 'x', b: 'y' } }],
    });
    store.setActive('r1', 'a');
    const items = buildGridContextMenu(stubEditor(), store);
    const labels = items.map((i) => i.label).filter(Boolean);
    expect(labels).toContain('common.insert');
    expect(labels).toContain('common.delete');
    expect(labels).toContain('table.tableStyle');
    expect(labels).toContain('table.tableProperties');
    expect(items[0]?.icon).toBeTruthy();
    expect(items[0]?.subMenu?.some((s) => s.label === 'table.addRowAbove')).toBe(true);
    const style = items.find((i) => i.label === 'table.tableStyle');
    expect(style?.subMenu?.some((s) => s.label === 'alignment.alignCenter')).toBe(true);
    store.destroy();
  });

  it('properties Apply commits once (one undo step)', () => {
    const commits: unknown[] = [];
    const store = new TableStore(
      {
        version: 2,
        columns: [{ id: 'a', title: 'A' }],
        rows: [{ id: 'r1', cells: { a: 'x' } }],
      },
      { onCommit: (d) => commits.push(d) }
    );
    store.setActive('r1', 'a');
    let apply: ((v: Record<string, unknown>) => unknown) | undefined;
    const editor = {
      t: (k: string) => k,
      ui: {
        popup: {
          open: (cfg: { buttons: { onClick: (v: Record<string, unknown>) => unknown }[] }) => {
            apply = cfg.buttons[0]?.onClick;
            return { close: () => {}, update: () => {} };
          },
        },
        menu: { open: () => {}, isOpen: false },
      },
    } as unknown as EditorAPI;
    const items = buildGridContextMenu(editor, store);
    items.find((i) => i.label === 'table.tableProperties')?.onClick?.();
    commits.length = 0;
    apply?.({ theme: 'striped', fit: 'fixed', rowHeight: 40, colWidth: 200 });
    expect(commits).toHaveLength(1);
    const doc = store.getDoc();
    expect(doc.theme).toBe('striped');
    expect(doc.view?.fit).toBe('content');
    expect(doc.view?.rowHeight).toBe(40);
    expect(doc.columns[0]?.width).toBe(200);
    store.destroy();
  });
});
