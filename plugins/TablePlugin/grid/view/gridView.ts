import { foreign, h, mount } from '@codemerge/sdk';
import type { MountHandle, ViewSpec } from '@codemerge/sdk';

import type { TableStore } from '../TableStore';
import { isGroupRowId } from '../derive/group';
import { rowDepth } from '../derive/tree';
import { renderCell } from '../drivers/registry';
import { stringifyCell } from '../../io/matrix';
import { handleGridKeydown, moveActiveDown } from '../keyboard';
import { DEFAULT_ROW_HEIGHT, visibleWindow } from '../viewport';
import type { ViewportWindow } from '../types';
import { copySelection, pasteFromClipboard } from '../clipboard';
import { isCovered, spanSize } from '../spans';
import { colLetter, isGhostColId, isGhostRowId } from '../sheet';

function sheetLayout(store: TableStore): {
  fill: boolean;
  widthOf: (id: string) => number;
} {
  const widths = store.getColumnWidths();
  return {
    fill: store.getDoc().view?.fit !== 'content',
    widthOf: (id) => widths.get(id) ?? 128,
  };
}

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
  const { fill, widthOf } = sheetLayout(store);
  const byCol = new Map(doc.columns.map((c) => [c.id, c]));
  const sheetCols = store.getSheetColumnIds();

  return h(
    'div',
    {
      class:
        'ocm-table-grid__header sticky top-0 z-10 flex h-8 min-w-full items-stretch border-b border-ocm-border bg-ocm-surface-muted',
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
    ...sheetCols.map((colId, visualIndex) => {
      const col = byCol.get(colId);
      const ghost = isGhostColId(colId) || !col;
      const sort = doc.view?.sort?.find((s) => s.colId === colId);
      const width = widthOf(colId);
      const renaming = !ghost && store.getEditingHeader() === colId;
      const label = ghost ? colLetter(visualIndex) : (col?.title ?? colLetter(visualIndex));
      const pinMark = !ghost && col?.pinned === 'left' ? ' ⌞' : '';
      const headerStyle: Record<string, string | number> = {
        width: `${width}px`,
        minWidth: `${width}px`,
      };
      if (col?.pinned === 'left') {
        headerStyle.position = 'sticky';
        headerStyle.left = `${pinLeftOffset(derived.pinnedLeft, colId, widthOf)}px`;
        headerStyle.zIndex = 3;
        headerStyle.background = 'var(--ocm-surface-muted, #f8fafc)';
      }
      return h(
        'div',
        {
          class: 'relative flex h-8 shrink-0 items-center gap-0.5 border-r border-ocm-border px-1',
          style: headerStyle,
          attrs: { role: 'columnheader', 'data-ocm-col': colId },
        },
        [
          renaming
            ? h('input', {
                class:
                  'h-6 min-w-0 flex-1 rounded-ocm-sm border border-sky-500 bg-ocm-surface px-1 font-mono text-[12px] font-semibold outline-none',
                attrs: {
                  type: 'text',
                  'aria-label': 'Column title',
                  'data-ocm-header-edit': colId,
                  autofocus: true,
                },
                props: { value: col?.title ?? '' },
                on: {
                  pointerdown: (ev) => {
                    ev.stopPropagation();
                  },
                  click: (ev) => {
                    ev.stopPropagation();
                  },
                  change: (ev) => {
                    const t = ev.target;
                    if (t instanceof HTMLInputElement) {
                      store.setColumnMeta(colId, { title: t.value });
                    }
                  },
                  blur: () => {
                    store.setEditingHeader(null);
                  },
                  keydown: (ev) => {
                    if (ev.key === 'Enter') {
                      ev.preventDefault();
                      ev.stopPropagation();
                      const t = ev.target;
                      if (t instanceof HTMLInputElement) {
                        t.blur();
                      }
                      return;
                    }
                    if (ev.key === 'Escape') {
                      ev.preventDefault();
                      ev.stopPropagation();
                      store.setEditingHeader(null);
                    }
                  },
                },
              })
            : h(
                'button',
                {
                  class:
                    'min-w-0 flex-1 truncate text-left font-mono text-[12px] font-semibold text-ocm-text hover:text-sky-700',
                  attrs: { type: 'button', title: ghost ? 'Column' : 'Rename column' },
                  on: {
                    click: (ev) => {
                      ev.preventDefault();
                      if (!ghost) {
                        store.setEditingHeader(colId);
                      }
                    },
                    dblclick: (ev) => {
                      ev.preventDefault();
                      if (!ghost) {
                        store.setEditingHeader(colId);
                      }
                    },
                  },
                },
                `${label}${pinMark}`
              ),
          ghost || renaming
            ? null
            : h('div', { class: 'flex shrink-0 items-center gap-0.5' }, [
                h(
                  'button',
                  {
                    class: 'px-0.5 font-mono text-[10px] text-ocm-text-muted hover:text-sky-700',
                    attrs: {
                      type: 'button',
                      title: 'Sort',
                      disabled: col?.sortable === false ? true : undefined,
                    },
                    on: {
                      click: (ev) => {
                        ev.preventDefault();
                        if (col?.sortable !== false) {
                          store.toggleSort(colId);
                        }
                      },
                    },
                  },
                  sort ? (sort.dir === 'asc' ? '↑' : '↓') : '⇅'
                ),
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
                          pinned: col?.pinned === 'left' ? null : 'left',
                        });
                      },
                    },
                  },
                  'pin'
                ),
              ]),
          h('div', {
            class: 'absolute top-0 -right-1 z-10 h-full w-2 cursor-col-resize hover:bg-sky-400/80',
            attrs: { title: 'Resize column' },
            on: {
              pointerdown: (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const startX = ev.clientX;
                const startW = width;
                const onMove = (e: PointerEvent): void => {
                  store.setColResize(colId, startW + (e.clientX - startX));
                };
                const onUp = (): void => {
                  window.removeEventListener('pointermove', onMove);
                  window.removeEventListener('pointerup', onUp);
                  if (isGhostColId(colId)) {
                    store.ensureCell(0, colId);
                  }
                  store.commitColResize();
                };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
              },
            },
          }),
        ]
      );
    }),
    h(
      'button',
      {
        class:
          'flex w-8 shrink-0 items-center justify-center border-r border-ocm-border font-mono text-[16px] leading-none text-ocm-text-muted hover:bg-ocm-surface-hover hover:text-sky-700',
        attrs: { type: 'button', title: 'Add column' },
        on: {
          click: (ev) => {
            ev.preventDefault();
            store.addColumn();
          },
        },
      },
      '+'
    ),
    fill
      ? null
      : h('div', {
          class: 'min-w-[2rem] flex-1 border-r border-ocm-border bg-ocm-surface-muted',
          attrs: { 'aria-hidden': 'true' },
        })
  );
}

function bodyRowsSpec(store: TableStore, vp: ViewportWindow): ViewSpec {
  const doc = store.getDoc();
  const derived = store.getDerived();
  const sel = store.getSelection();
  const { fill, widthOf } = sheetLayout(store);
  const byCol = new Map(doc.columns.map((c) => [c.id, c]));
  const byRow = new Map(doc.rows.map((r) => [r.id, r]));
  const visibleIds = store.getSheetRowIds().slice(vp.start, vp.end);
  const sheetCols = store.getSheetColumnIds();
  const groupByAgg = new Map(derived.groups.map((g) => [g.key, g]));

  return h(
    'div',
    { class: 'flex w-max min-w-full flex-col' },
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
      const ghostRow = isGhostRowId(rowId);
      const row = byRow.get(rowId);
      const selected = !ghostRow && sel.rowIds.includes(rowId);
      const depth = row ? rowDepth(doc, rowId) : 0;
      const stripe = doc.theme === 'striped' && absIndex % 2 === 1;
      return h(
        'div',
        {
          key: rowId,
          class: [
            'flex w-max min-w-full shrink-0 border-b border-ocm-border',
            selected ? 'bg-sky-50/80' : stripe ? 'bg-ocm-surface-muted/50' : 'bg-ocm-surface',
          ].join(' '),
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
                  if (ghostRow) {
                    store.ensureCell(absIndex, sheetCols[0] ?? '');
                    return;
                  }
                  store.selectRow(rowId, {
                    additive: ev.metaKey || ev.ctrlKey,
                    range: ev.shiftKey,
                  });
                },
              },
            },
            String(absIndex + 1)
          ),
          ...sheetCols.map((colId, colIndex) => {
            const col = byCol.get(colId);
            const fakeCol = col ?? { id: colId, title: colLetter(colIndex), type: 'text' as const };
            if (row && colIndex < derived.columnIds.length) {
              const rowIndex = doc.rows.findIndex((r) => r.id === rowId);
              if (rowIndex >= 0 && isCovered(doc.rows, derived.columnIds, rowIndex, colIndex)) {
                return null;
              }
            }
            const active = sel.active?.rowId === rowId && sel.active?.colId === colId;
            const editing = Boolean(row) && active && store.isEditing();
            const span = row ? spanSize(row.spans?.[colId]) : { cols: 1, rows: 1 };
            let width = widthOf(colId);
            if (span.cols > 1) {
              width = sheetCols
                .slice(colIndex, colIndex + span.cols)
                .reduce((sum, id) => sum + widthOf(id), 0);
            }
            const padLeft = colIndex === 0 ? depth * 12 : 0;
            const cs = row?.styles?.[colId];
            const align = cs?.align ?? 'left';
            const justify =
              align === 'center'
                ? 'justify-center'
                : align === 'right'
                  ? 'justify-end'
                  : 'justify-start';
            const cellStyle: Record<string, string | number> = {
              width: `${width}px`,
              minWidth: `${width}px`,
            };
            if (span.rows > 1) {
              cellStyle.height = `${vp.rowHeight * span.rows}px`;
              cellStyle.zIndex = 2;
            }
            if (padLeft > 0) {
              cellStyle.paddingLeft = `${padLeft}px`;
            }
            if (cs?.border) {
              const w =
                cs.border === 'none'
                  ? 0
                  : cs.border === 'thick'
                    ? 3
                    : cs.border === 'medium'
                      ? 2
                      : 1;
              cellStyle.borderWidth = `${w}px`;
              cellStyle.borderStyle = w > 0 ? 'solid' : 'none';
            }
            if (cs?.color) {
              cellStyle.color = cs.color;
            }
            if (col?.pinned === 'left') {
              cellStyle.position = 'sticky';
              cellStyle.left = `${pinLeftOffset(derived.pinnedLeft, colId, widthOf)}px`;
              cellStyle.zIndex = 1;
              cellStyle.background = selected
                ? 'rgb(240 249 255 / 0.95)'
                : (cs?.background ?? 'var(--ocm-surface, #fff)');
            } else if (cs?.background) {
              cellStyle.background = cs.background;
            }
            const activate = (edit: boolean): void => {
              const got = store.ensureCell(absIndex, colId);
              if (got && edit) {
                store.setEditing(true);
              }
            };
            return h(
              'div',
              {
                class: `flex min-w-0 shrink-0 items-center ${justify} border-r border-ocm-border px-0.5`,
                style: cellStyle,
                attrs: {
                  role: 'gridcell',
                  'data-ocm-row': rowId,
                  'data-ocm-col': colId,
                  'data-ocm-row-index': String(absIndex),
                },
                on: {
                  click: () => {
                    activate(true);
                  },
                  dblclick: () => {
                    activate(true);
                  },
                },
              },
              renderCell({
                value: row?.cells[colId] ?? null,
                column: fakeCol,
                rowId,
                selected: active,
                editing,
                align,
                color: cs?.color,
                onChange: (v) => {
                  const got = store.ensureCell(absIndex, colId);
                  if (got) {
                    store.setCell(got.rowId, got.colId, v);
                  }
                },
                onStartEdit: () => {
                  activate(true);
                },
                onEndEdit: () => {
                  store.setEditing(false);
                  store.flushCommit();
                },
              })
            );
          }),
          h('div', {
            class: 'w-8 shrink-0 border-r border-ocm-border',
            attrs: { 'aria-hidden': 'true' },
          }),
          fill
            ? null
            : h('div', {
                class: 'min-w-[2rem] flex-1 border-r border-ocm-border',
                attrs: { 'aria-hidden': 'true' },
              }),
        ]
      );
    })
  );
}

function isFormControl(t: EventTarget | null): t is HTMLInputElement | HTMLTextAreaElement {
  return t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
}

function liveCellInput(root: HTMLElement): HTMLInputElement | null {
  const live = [...root.querySelectorAll('input')].find(
    (el) => el instanceof HTMLInputElement && el.dataset.ocmHeaderEdit === undefined
  );
  return live instanceof HTMLInputElement ? live : null;
}

function gridRootClass(store: TableStore): string {
  const theme = store.getDoc().theme ?? 'default';
  return `ocm-table-grid ocm-table-grid--${theme} flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden outline-none`;
}

export function tableGridView(
  store: TableStore,
  opts?: { onContextMenu?: (ev: MouseEvent) => void }
): ViewSpec {
  return h(
    'div',
    {
      class: gridRootClass(store),
      attrs: { role: 'grid', tabindex: 0 },
      on: {
        contextmenu: (ev) => {
          const el = ev.target;
          if (!(el instanceof Element)) {
            return;
          }
          const cell = el.closest('[data-ocm-row][data-ocm-col]');
          if (cell instanceof HTMLElement) {
            const colId = cell.dataset.ocmCol;
            const idx = Number(cell.dataset.ocmRowIndex);
            if (colId && Number.isFinite(idx)) {
              store.ensureCell(idx, colId);
            }
          } else {
            const head = el.closest('[data-ocm-col]');
            const colId = head instanceof HTMLElement ? head.dataset.ocmCol : undefined;
            const rowId = store.getDerived().rowIds[0];
            if (colId && rowId) {
              store.setActive(rowId, colId);
            }
          }
          ev.preventDefault();
          ev.stopPropagation();
          opts?.onContextMenu?.(ev);
        },
        keydown: (ev) => {
          if (isFormControl(ev.target)) {
            if (ev.target.dataset.ocmHeaderEdit) {
              return;
            }
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
      foreign(
        (host, scope) => {
          host.className = [
            'ocm-table-grid__body relative min-h-0 flex-1 overscroll-contain',
            store.getDoc().view?.fit === 'content'
              ? 'overflow-auto'
              : 'overflow-x-hidden overflow-y-auto',
          ].join(' ');
          host.setAttribute('role', 'rowgroup');

          const sheetHandle = mount(
            host,
            h('div', { class: 'relative w-max min-w-full' }, [
              h('div', {
                ref: 'header',
                class: 'ocm-table-grid__header-host sticky top-0 z-20',
                attrs: { 'data-ocm-table-header': 'true' },
              }),
              h('div', { ref: 'canvas', class: 'relative min-w-full bg-ocm-surface' }, [
                h('div', {
                  ref: 'window',
                  class: 'ocm-table-grid__window absolute top-0 left-0 w-max min-w-full',
                }),
              ]),
            ])
          );
          let headerHandle: MountHandle | null = null;
          let windowHandle: MountHandle | null = null;

          const headerH = (): number => {
            const slot = sheetHandle.refs.header;
            return slot instanceof HTMLElement ? slot.offsetHeight : 0;
          };

          const applyBodyOverflow = (): void => {
            const fill = store.getDoc().view?.fit !== 'content';
            host.classList.toggle('overflow-x-hidden', fill);
            host.classList.toggle('overflow-y-auto', true);
            host.classList.toggle('overflow-auto', !fill);
          };

          const clampScroll = (): void => {
            const fill = store.getDoc().view?.fit !== 'content';
            if (fill) {
              host.scrollLeft = 0;
            }
            const maxX = Math.max(0, host.scrollWidth - host.clientWidth);
            const maxY = Math.max(0, host.scrollHeight - host.clientHeight);
            if (host.scrollLeft > maxX) {
              host.scrollLeft = maxX;
            }
            if (host.scrollTop > maxY) {
              host.scrollTop = maxY;
            }
          };

          const syncViewport = (): void => {
            applyBodyOverflow();
            store.setLayoutWidth(host.clientWidth);
            const rh = store.getDoc().view?.rowHeight ?? DEFAULT_ROW_HEIGHT;
            const total = store.getSheetRowCount();
            const clientH = Math.max(1, host.clientHeight - headerH());
            const vp = visibleWindow(host.scrollTop, clientH, total, rh);
            if (clientH >= rh * 3 && vp.end >= total - 8 && clientH + 1 < total * rh) {
              store.growSheetRows();
            }
            paintWindow();
            clampScroll();
          };

          const paintWindow = (): void => {
            const rh = store.getDoc().view?.rowHeight ?? DEFAULT_ROW_HEIGHT;
            const vp = visibleWindow(
              host.scrollTop,
              Math.max(1, host.clientHeight - headerH()),
              store.getSheetRowCount(),
              rh
            );
            const canvasHeight = Math.max(rh, store.getSheetRowCount() * rh);
            const canvas = sheetHandle.refs.canvas;
            const win = sheetHandle.refs.window;
            if (!(canvas instanceof HTMLElement) || !(win instanceof HTMLElement)) {
              return;
            }
            canvas.style.height = `${canvasHeight}px`;
            canvas.style.backgroundColor = 'var(--color-ocm-surface, #fff)';

            const headerSlot = sheetHandle.refs.header;
            let headerDraft: string | null = null;
            if (store.getEditingHeader() && headerSlot instanceof HTMLElement) {
              const liveHeader = headerSlot.querySelector('input[data-ocm-header-edit]');
              if (liveHeader instanceof HTMLInputElement) {
                headerDraft = liveHeader.value;
              }
            }

            const cellDraft = liveCellInput(win)?.value ?? null;

            win.style.top = `${vp.start * rh}px`;
            const spec = bodyRowsSpec(store, vp);
            if (windowHandle) {
              windowHandle.update(spec);
            } else {
              windowHandle = mount(win, spec);
            }
            if (store.isEditing()) {
              queueMicrotask(() => {
                const live = liveCellInput(win);
                if (live) {
                  if (cellDraft !== null) {
                    live.value = cellDraft;
                  }
                  live.focus();
                }
              });
            }

            const headerHost = sheetHandle.refs.header;
            if (headerHost instanceof HTMLElement) {
              const liveHeader = headerHost.querySelector('input[data-ocm-header-edit]');
              const keepHeader =
                Boolean(store.getEditingHeader()) && liveHeader instanceof HTMLInputElement;
              if (!keepHeader) {
                const specH = headerSpec(store);
                if (headerHandle) {
                  headerHandle.update(specH);
                } else {
                  headerHandle = mount(headerHost, specH);
                }
                if (store.getEditingHeader()) {
                  queueMicrotask(() => {
                    const live = headerHost.querySelector('input[data-ocm-header-edit]');
                    if (live instanceof HTMLInputElement) {
                      if (headerDraft !== null) {
                        live.value = headerDraft;
                      }
                      live.focus();
                    }
                  });
                }
              }
            }
          };

          host.addEventListener('scroll', syncViewport);
          const unsub = store.subscribe(() => {
            applyBodyOverflow();
            paintWindow();
            clampScroll();
          });
          paintWindow();
          queueMicrotask(syncViewport);
          let ro: ResizeObserver | null = null;
          if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(syncViewport);
            ro.observe(host);
          }
          scope.disposable(() => {
            host.removeEventListener('scroll', syncViewport);
            ro?.disconnect();
            unsub();
            windowHandle?.destroy();
            windowHandle = null;
            headerHandle?.destroy();
            headerHandle = null;
            sheetHandle.destroy();
          });
        },
        { key: 'table-grid-body', class: 'ocm-table-grid__body-host flex min-h-0 flex-1 flex-col' }
      ),
    ]
  );
}

export function paintGridChrome(shell: MountHandle, store: TableStore): void {
  if (shell.el instanceof HTMLElement) {
    shell.el.className = gridRootClass(store);
  }
}

export function chromeSignature(store: TableStore): string {
  return store.getDoc().theme ?? 'default';
}
