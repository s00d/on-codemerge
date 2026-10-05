import { foreign, h, mount } from '@codemerge/sdk';
import type { MountHandle, ViewSpec } from '@codemerge/sdk';
import type { TableStore } from '../TableStore';
import { isGroupRowId } from '../derive/group';
import { rowDepth } from '../derive/tree';
import { getCellDriver } from '../drivers/registry';
import { stringifyCell } from '../../io/matrix';
import { handleGridKeydown, moveActiveDown } from '../keyboard';
import { copySelection, pasteFromClipboard } from '../clipboard';

function pinLeftOffset(
  pinnedLeft: string[],
  colId: string,
  widthOf: (id: string) => number
): number {
  let left = 40;
  for (const id of pinnedLeft) {
    if (id === colId) {
      break;
    }
    left += widthOf(id);
  }
  return left;
}

function headerSpec(store: TableStore): ViewSpec {
  const doc = store.getDoc();
  const derived = store.getDerived();
  const byCol = new Map(doc.columns.map((c) => [c.id, c]));
  const widthOf = (id: string): number => byCol.get(id)?.width ?? 128;

  return h(
    'div',
    {
      class:
        'ocm-table-grid__header sticky top-0 z-10 flex border-b border-ocm-border bg-ocm-surface-muted',
      attrs: { role: 'row' },
    },
    h(
      'div',
      {
        class:
          'sticky left-0 z-[4] flex w-10 shrink-0 items-center justify-center border-r border-ocm-border bg-ocm-surface-muted text-[10px] text-ocm-text-muted',
      },
      '#'
    ),
    ...derived.columnIds.map((colId) => {
      const col = byCol.get(colId);
      if (!col) {
        return null;
      }
      const sort = doc.view?.sort?.find((s) => s.colId === colId);
      const width = widthOf(colId);
      const title = `${col.title}${sort ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}${
        col.pinned === 'left' ? ' ⌞' : ''
      }`;
      const headerStyle: Record<string, string | number> = {
        width: `${width}px`,
        minWidth: `${width}px`,
      };
      if (col.pinned === 'left') {
        headerStyle.position = 'sticky';
        headerStyle.left = `${pinLeftOffset(derived.pinnedLeft, colId, widthOf)}px`;
        headerStyle.zIndex = 3;
        headerStyle.background = 'var(--ocm-surface-muted, #f8fafc)';
      }
      return h(
        'div',
        {
          class: 'relative flex shrink-0 flex-col border-r border-ocm-border px-1 py-0.5',
          style: headerStyle,
          attrs: { role: 'columnheader' },
        },
        [
          h(
            'button',
            {
              class:
                'truncate text-left font-mono text-[12px] font-semibold text-ocm-text hover:text-sky-700',
              attrs: { type: 'button', title: 'Sort' },
              on: {
                click: (ev) => {
                  ev.preventDefault();
                  if (col.sortable !== false) {
                    store.toggleSort(colId);
                  }
                },
              },
            },
            title
          ),
          h('div', { class: 'mt-0.5 flex gap-0.5' }, [
            h(
              'button',
              {
                class: 'px-0.5 font-mono text-[10px] text-ocm-text-muted hover:text-sky-700',
                attrs: { type: 'button', title: 'Move left' },
                on: {
                  click: (ev) => {
                    ev.preventDefault();
                    const order = [...derived.columnIds];
                    const i = order.indexOf(colId);
                    const prev = i > 0 ? order[i - 1] : undefined;
                    if (i > 0 && prev !== undefined) {
                      order[i - 1] = colId;
                      order[i] = prev;
                      store.reorderColumns(order);
                    }
                  },
                },
              },
              '←'
            ),
            h(
              'button',
              {
                class: 'px-0.5 font-mono text-[10px] text-ocm-text-muted hover:text-sky-700',
                attrs: { type: 'button', title: 'Move right' },
                on: {
                  click: (ev) => {
                    ev.preventDefault();
                    const order = [...derived.columnIds];
                    const i = order.indexOf(colId);
                    const next = i >= 0 && i < order.length - 1 ? order[i + 1] : undefined;
                    if (i >= 0 && next !== undefined) {
                      order[i + 1] = colId;
                      order[i] = next;
                      store.reorderColumns(order);
                    }
                  },
                },
              },
              '→'
            ),
            h(
              'button',
              {
                class: 'px-0.5 font-mono text-[10px] text-ocm-text-muted hover:text-sky-700',
                attrs: { type: 'button', title: 'Toggle pin left' },
                on: {
                  click: (ev) => {
                    ev.preventDefault();
                    store.setColumnMeta(colId, {
                      pinned: col.pinned === 'left' ? null : 'left',
                    });
                  },
                },
              },
              'pin'
            ),
          ]),
          h('div', {
            class: 'absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-sky-400',
            on: {
              pointerdown: (ev) => {
                ev.preventDefault();
                const startX = ev.clientX;
                const startW = width;
                const onMove = (e: PointerEvent): void => {
                  store.setColumnMeta(
                    colId,
                    { width: Math.max(64, startW + (e.clientX - startX)) },
                    { commit: false }
                  );
                };
                const onUp = (): void => {
                  window.removeEventListener('pointermove', onMove);
                  window.removeEventListener('pointerup', onUp);
                  store.flushCommit();
                };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
              },
            },
          }),
        ]
      );
    })
  );
}

function bodyRowsSpec(store: TableStore): ViewSpec {
  const doc = store.getDoc();
  const derived = store.getDerived();
  const sel = store.getSelection();
  const vp = store.getViewport();
  const byCol = new Map(doc.columns.map((c) => [c.id, c]));
  const byRow = new Map(doc.rows.map((r) => [r.id, r]));
  const visibleIds = store.getVisibleRowIds();
  const widthOf = (id: string): number => byCol.get(id)?.width ?? 128;
  const groupByAgg = new Map(derived.groups.map((g) => [g.key, g]));

  return h(
    'div',
    null,
    visibleIds.map((rowId, i) => {
      const absIndex = vp.start + i;
      if (isGroupRowId(rowId)) {
        const group = groupByAgg.get(rowId);
        const key = group?.value ?? rowId.slice('__group__:'.length);
        const numCol = doc.columns.find((c) => c.type === 'number');
        let aggLabel = '';
        if (group !== undefined && numCol !== undefined) {
          const a = group.agg[numCol.id];
          if (a !== undefined && a.count > 0) {
            aggLabel = ` · ${numCol.title}: Σ${a.sum} n=${a.count} μ=${a.avg.toFixed(1)}`;
          }
        }
        const expandedSet = doc.view?.expandedGroupIds;
        const open = expandedSet === undefined || expandedSet.includes(rowId);
        return h(
          'div',
          {
            key: rowId,
            class:
              'flex items-center border-b border-ocm-border bg-ocm-surface-muted/60 px-2 font-mono text-[12px] font-semibold',
            style: { height: `${vp.rowHeight}px` },
            on: {
              click: () => {
                const allKeys = derived.groups.map((g) => g.key);
                const expanded = new Set(expandedSet ?? allKeys);
                if (expanded.has(rowId)) {
                  expanded.delete(rowId);
                } else {
                  expanded.add(rowId);
                }
                store.setView({ expandedGroupIds: [...expanded] });
              },
            },
          },
          `${open ? '▾' : '▸'} ${String(key)}${aggLabel}`
        );
      }
      const row = byRow.get(rowId);
      if (!row) {
        return null;
      }
      const selected = sel.rowIds.includes(rowId);
      const depth = rowDepth(doc, rowId);
      return h(
        'div',
        {
          key: rowId,
          class: `flex border-b border-ocm-border ${selected ? 'bg-sky-50/80' : 'bg-ocm-surface'}`,
          style: { height: `${vp.rowHeight}px` },
          attrs: { role: 'row', 'aria-selected': selected ? 'true' : 'false' },
        },
        [
          h(
            'button',
            {
              class:
                'sticky left-0 z-[2] flex w-10 shrink-0 items-center justify-center border-r border-ocm-border bg-inherit font-mono text-[10px] text-ocm-text-muted hover:bg-ocm-surface-hover',
              attrs: { type: 'button', title: 'Select row' },
              on: {
                click: (ev) => {
                  store.selectRow(rowId, {
                    additive: ev.metaKey || ev.ctrlKey,
                    range: ev.shiftKey,
                  });
                },
              },
            },
            String(absIndex + 1)
          ),
          ...derived.columnIds.map((colId) => {
            const col = byCol.get(colId);
            if (!col) {
              return null;
            }
            const active = sel.active?.rowId === rowId && sel.active?.colId === colId;
            const editing = active && store.isEditing();
            const driver = getCellDriver(col);
            const width = widthOf(colId);
            const padLeft = colId === derived.columnIds[0] ? depth * 12 : 0;
            const cellStyle: Record<string, string | number> = {
              width: `${width}px`,
              minWidth: `${width}px`,
            };
            if (padLeft > 0) {
              cellStyle.paddingLeft = `${padLeft}px`;
            }
            if (col.pinned === 'left') {
              cellStyle.position = 'sticky';
              cellStyle.left = `${pinLeftOffset(derived.pinnedLeft, colId, widthOf)}px`;
              cellStyle.zIndex = 1;
              cellStyle.background = selected
                ? 'rgb(240 249 255 / 0.95)'
                : 'var(--ocm-surface, #fff)';
            }
            return h(
              'div',
              {
                class: 'flex shrink-0 items-center border-r border-ocm-border px-0.5',
                style: cellStyle,
                attrs: { role: 'gridcell' },
                on: {
                  mousedown: () => {
                    store.setActive(rowId, colId);
                  },
                },
              },
              driver.render({
                value: row.cells[colId] ?? null,
                column: col,
                rowId,
                selected: active,
                editing,
                onChange: (v) => {
                  store.setCell(rowId, colId, v);
                },
                onStartEdit: () => {
                  store.setActive(rowId, colId);
                  store.setEditing(true);
                },
                onEndEdit: () => {
                  store.setEditing(false);
                  store.flushCommit();
                },
              })
            );
          }),
        ]
      );
    })
  );
}

function footerSpec(store: TableStore): ViewSpec {
  const derived = store.getDerived();
  const sel = store.getSelection();
  return h(
    'div',
    {
      class:
        'ocm-table-grid__footer flex shrink-0 items-center gap-2 border-t border-ocm-border px-2 py-1 text-[11px] text-ocm-text-muted',
    },
    [
      h(
        'span',
        null,
        `${derived.totalRowCount} rows · page ${derived.page + 1}/${derived.pageCount}`
      ),
      h(
        'button',
        {
          class: 'rounded border border-ocm-border px-1.5 py-0.5 hover:bg-ocm-surface-hover',
          attrs: { type: 'button', disabled: derived.page <= 0 ? true : undefined },
          on: {
            click: () => {
              store.setView({
                pagination: {
                  page: Math.max(0, derived.page - 1),
                  pageSize: derived.pageSize,
                },
              });
            },
          },
        },
        'Prev'
      ),
      h(
        'button',
        {
          class: 'rounded border border-ocm-border px-1.5 py-0.5 hover:bg-ocm-surface-hover',
          attrs: {
            type: 'button',
            disabled: derived.page >= derived.pageCount - 1 ? true : undefined,
          },
          on: {
            click: () => {
              store.setView({
                pagination: {
                  page: Math.min(derived.pageCount - 1, derived.page + 1),
                  pageSize: derived.pageSize,
                },
              });
            },
          },
        },
        'Next'
      ),
      sel.active ? h('span', { class: 'ml-auto font-mono' }, sel.active.colId) : null,
    ]
  );
}

function isFormControl(t: EventTarget | null): t is HTMLInputElement | HTMLTextAreaElement {
  return t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
}

/** Stable grid shell: header/footer remount; scroll body is foreign and never remounted. */
export function tableGridView(store: TableStore): ViewSpec {
  return h(
    'div',
    {
      class: 'ocm-table-grid flex h-full min-h-0 flex-1 flex-col outline-none',
      attrs: { role: 'grid', tabindex: 0 },
      on: {
        keydown: (ev) => {
          if (isFormControl(ev.target)) {
            if (ev.key === 'Enter') {
              ev.preventDefault();
              ev.target.blur();
              store.setEditing(false);
              moveActiveDown(store);
              return;
            }
            if (ev.key === 'Escape') {
              ev.preventDefault();
              const active = store.getSelection().active;
              if (active) {
                const row = store.getDoc().rows.find((r) => r.id === active.rowId);
                ev.target.value = stringifyCell(row?.cells[active.colId] ?? '');
              }
              store.setEditing(false);
              return;
            }
            return;
          }
          if ((ev.metaKey || ev.ctrlKey) && ev.key === 'c') {
            ev.preventDefault();
            void copySelection(store);
            return;
          }
          if ((ev.metaKey || ev.ctrlKey) && ev.key === 'v') {
            ev.preventDefault();
            void pasteFromClipboard(store);
            return;
          }
          handleGridKeydown(store, ev);
        },
      },
    },
    [
      h('div', { ref: 'header', class: 'shrink-0 overflow-x-auto' }),
      foreign(
        (host, scope) => {
          host.className =
            'ocm-table-grid__body relative min-h-0 flex-1 overflow-auto overscroll-contain';
          host.setAttribute('role', 'rowgroup');

          const spacerHandle = mount(
            host,
            h('div', { class: 'relative w-max min-w-full', style: { height: '0px' } }, [
              h('div', { ref: 'window', class: 'absolute left-0 right-0' }),
            ])
          );
          let windowHandle: MountHandle | null = null;

          const paintWindow = (): void => {
            const derived = store.getDerived();
            const vp = store.getViewport();
            const totalHeight = Math.max(vp.rowHeight, derived.rowIds.length * vp.rowHeight);
            const spacer = spacerHandle.el.firstElementChild;
            if (spacer instanceof HTMLElement) {
              spacer.style.height = `${totalHeight}px`;
            }
            const win = spacerHandle.refs.window;
            if (!(win instanceof HTMLElement)) {
              return;
            }
            // Keep spacer/top metrics current; skip row remount while a live editor exists
            // (mount.update is full replaceChildren and would wipe uncommitted input).
            if (store.isEditing() && windowHandle) {
              const live = win.querySelector('input');
              if (live instanceof HTMLInputElement) {
                return;
              }
            }
            win.style.top = `${vp.start * vp.rowHeight}px`;
            const spec = bodyRowsSpec(store);
            if (windowHandle) {
              windowHandle.update(spec);
            } else {
              windowHandle = mount(win, spec);
            }
            if (store.isEditing()) {
              queueMicrotask(() => {
                const input = win.querySelector('input');
                input?.focus();
              });
            }
          };

          const onScroll = (): void => {
            store.setScroll(host.scrollTop, host.clientHeight);
          };
          host.addEventListener('scroll', onScroll);
          const unsub = store.subscribe(paintWindow);
          paintWindow();
          scope.disposable(() => {
            host.removeEventListener('scroll', onScroll);
            unsub();
            windowHandle?.destroy();
            windowHandle = null;
            spacerHandle.destroy();
          });
        },
        { key: 'table-grid-body', class: 'ocm-table-grid__body-host flex min-h-0 flex-1 flex-col' }
      ),
      h('div', { ref: 'footer', class: 'shrink-0' }),
    ]
  );
}

const chromeHandles = new WeakMap<HTMLElement, MountHandle>();

export function paintGridChrome(shell: MountHandle, store: TableStore): void {
  const header = shell.refs.header;
  const footer = shell.refs.footer;
  if (header instanceof HTMLElement) {
    const prev = chromeHandles.get(header);
    const spec = headerSpec(store);
    if (prev) {
      prev.update(spec);
    } else {
      chromeHandles.set(header, mount(header, spec));
    }
  }
  if (footer instanceof HTMLElement) {
    const prev = chromeHandles.get(footer);
    const spec = footerSpec(store);
    if (prev) {
      prev.update(spec);
    } else {
      chromeHandles.set(footer, mount(footer, spec));
    }
  }
}

export function chromeSignature(store: TableStore): string {
  const d = store.getDerived();
  return JSON.stringify({
    doc: store.getDoc(),
    sel: store.getSelection(),
    page: d.page,
    pageCount: d.pageCount,
    total: d.totalRowCount,
    cols: d.columnIds,
  });
}
