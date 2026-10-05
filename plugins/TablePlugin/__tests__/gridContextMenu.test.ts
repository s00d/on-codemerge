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
});
