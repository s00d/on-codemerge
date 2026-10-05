import { downloadBlob, h, mount } from '@codemerge/sdk';
import type { EditorAPI, MountHandle } from '@codemerge/sdk';
import type { DocNode, EditorState, JSONDoc } from '@codemerge/kernel';

import { mountSourceEditor } from '@codemerge/editor';
import type { SourceEditorHandle } from '@codemerge/editor';
import { openMatrixImportPopup } from '../chrome/importPopup';
import { buildGridContextMenu, openFormatCell } from '../chrome/gridContextMenu';
import type { TableGridSource } from '../io/adapters';
import { attrsFromGrid, gridFromDoc, gridFromMatrix } from '../io/adapters';
import { fetchLazyMatrix } from '../io/fetchMatrix';
import type { LazyTableConfig } from '../io/fetchMatrix';
import { exportCsv as toCsv } from '../io/adapters';
import { parseText, serializeText } from '../io/text';
import { TableStore } from '../grid/TableStore';
import { chromeSignature, paintGridChrome, tableGridView } from '../grid/view/gridView';

export type TableWorkspaceHost = EditorAPI & {
  replaceDocument?(doc: DocNode | JSONDoc): void;
};

export type TableWorkspaceHandle = {
  update(state: EditorState): void;
  destroy(): void;
  getMode(): 'grid' | 'raw';
  setMode(next: 'grid' | 'raw'): void;
  addRow(): void;
  addColumn(): void;
  mergeHorizontal(): void;
  mergeVertical(): void;
  splitCell(): void;
  openImport(): void;
  refreshSource(): void;
  editSource(): void;
  formatCell(): void;
  exportCsv(): void;
  applyRaw(): boolean;
  discardRaw(): void;
  isRawDirty(): boolean;
  getStore(): TableStore;
};

function replaceDoc(editor: TableWorkspaceHost, doc: DocNode | JSONDoc): void {
  if (typeof editor.replaceDocument === 'function') {
    editor.replaceDocument(doc);
    return;
  }
  editor.setJSON(doc);
}

function isEditingInside(host: HTMLElement): boolean {
  const ae = document.activeElement;
  if (!(ae instanceof HTMLElement) || !host.contains(ae)) {
    return false;
  }
  const tag = ae.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || ae.isContentEditable;
}

function gridSig(grid: ReturnType<typeof gridFromDoc>): string {
  return JSON.stringify(attrsFromGrid(grid));
}

function sourceFromConfig(config: LazyTableConfig): TableGridSource {
  return {
    url: config.url,
    format: config.format === 'csv' ? 'csv' : 'json',
    headers: config.headers,
    delimiter: config.delimiter,
  };
}

export function mountTableWorkspace(
  editor: TableWorkspaceHost,
  contentHost: HTMLElement
): TableWorkspaceHandle {
  contentHost.classList.add('ocm-table-root');

  let writing = false;
  let rawDirty = false;
  let parseError: string | null = null;
  let mode: 'grid' | 'raw' = 'grid';
  let chromeSig = '';
  let editBaseSig: string | null = null;

  let shellHandle: MountHandle | null = null;
  let gridHandle: MountHandle | null = null;
  let statusHandle: MountHandle | null = null;
  let rawHandle: SourceEditorHandle | null = null;

  const store = new TableStore(gridFromDoc(editor.getState().doc), {
    onCommit: (doc) => {
      if (writing || rawDirty) {
        return;
      }
      if (editBaseSig !== null) {
        const kernelSig = gridSig(gridFromDoc(editor.getState().doc));
        if (kernelSig !== editBaseSig) {
          store.setEditing(false);
          store.setDoc(gridFromDoc(editor.getState().doc));
          editBaseSig = null;
          return;
        }
      }
      writing = true;
      editor.run(() => [
        {
          type: 'set_attrs',
          path: [0],
          attrs: attrsFromGrid(doc),
        },
      ]);
      writing = false;
      editBaseSig = null;
      editor.toolbar.refresh();
    },
  });

  let loadedSourceUrl: string | null = null;

  const applyRemote = async (config: LazyTableConfig): Promise<boolean> => {
    try {
      const { matrix, hasHeader } = await fetchLazyMatrix(config);
      const grid = gridFromMatrix(matrix, hasHeader);
      grid.source = sourceFromConfig(config);
      store.setDoc(grid, { commit: true });
      loadedSourceUrl = config.url;
      editor.toolbar.refresh();
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      editor.notify(msg);
      return false;
    }
  };

  const tryAutoload = (): void => {
    const src = store.getDoc().source;
    if (!src?.url || rawDirty || src.url === loadedSourceUrl) {
      return;
    }
    void applyRemote({
      url: src.url,
      format: src.format,
      headers: src.headers,
      delimiter: src.delimiter,
    });
  };

  const origUndo = editor.undo.bind(editor);
  const origRedo = editor.redo.bind(editor);
  const blockWhileCellEdit = (): boolean => store.isEditing() || isEditingInside(contentHost);
  editor.undo = () => {
    if (blockWhileCellEdit()) {
      editor.notify('Finish cell edit first');
      return false;
    }
    return origUndo();
  };
  editor.redo = () => {
    if (blockWhileCellEdit()) {
      editor.notify('Finish cell edit first');
      return false;
    }
    return origRedo();
  };

  const unsubEditing = store.subscribe(() => {
    if (store.isEditing()) {
      if (editBaseSig === null) {
        editBaseSig = gridSig(gridFromDoc(editor.getState().doc));
      }
    } else if (!store.hasPendingCommit()) {
      editBaseSig = null;
    }
  });

  const paintStatus = (): void => {
    contentHost.toggleAttribute('data-ocm-table-raw-dirty', rawDirty);
    const slot = shellHandle?.refs.status;
    if (!(slot instanceof HTMLElement)) {
      return;
    }
    const sync = parseError
      ? parseError
      : rawDirty
        ? 'Draft dirty — Apply or Discard'
        : 'SoT synced';
    const syncClass = parseError
      ? 'text-red-600'
      : rawDirty
        ? 'text-amber-600'
        : 'text-ocm-text-muted';
    const derived = store.getDerived();
    const active = store.getSelection().active;
    const fill = store.getDoc().view?.fit !== 'content';
    const source = store.getDoc().source;
    let sourceLabel: string | null = null;
    if (source?.url) {
      try {
        sourceLabel = new URL(source.url).host;
      } catch {
        sourceLabel = source.url;
      }
    }
    const left =
      mode === 'grid'
        ? [
            h(
              'span',
              { class: 'tabular-nums text-ocm-text-muted' },
              `${derived.totalRowCount} rows`
            ),
            active ? h('span', { class: 'font-mono text-ocm-text' }, active.colId) : null,
            h(
              'button',
              {
                class: fill
                  ? 'rounded-ocm-sm border border-ocm-accent bg-ocm-accent/10 px-2 py-0.5 text-[11px] font-medium text-ocm-text'
                  : 'rounded-ocm-sm border border-ocm-border px-2 py-0.5 text-[11px] font-medium text-ocm-text hover:bg-ocm-surface-hover',
                attrs: {
                  type: 'button',
                  title: fill ? 'Columns stretch to the editor width' : 'Columns use stored widths',
                },
                on: {
                  click: (ev) => {
                    ev.preventDefault();
                    store.setView({ fit: fill ? 'content' : 'fill' });
                    editor.toolbar.refresh();
                  },
                },
              },
              fill ? 'Stretch' : 'Fixed width'
            ),
            sourceLabel
              ? h(
                  'span',
                  {
                    class: 'truncate font-mono text-ocm-text-muted',
                    attrs: { title: source?.url },
                  },
                  sourceLabel
                )
              : null,
          ]
        : [];
    const actions =
      mode === 'raw'
        ? [
            h(
              'button',
              {
                class:
                  'rounded-ocm-sm border border-ocm-border px-2 py-0.5 text-[11px] font-medium text-ocm-text hover:bg-ocm-surface-hover',
                attrs: { type: 'button' },
                on: {
                  click: (ev) => {
                    ev.preventDefault();
                    discardDraft();
                  },
                },
              },
              'Discard'
            ),
            h(
              'button',
              {
                class:
                  'rounded-ocm-sm border border-ocm-accent bg-ocm-accent px-2 py-0.5 text-[11px] font-medium text-white hover:opacity-90',
                attrs: { type: 'button' },
                on: {
                  click: (ev) => {
                    ev.preventDefault();
                    applyDraft();
                  },
                },
              },
              'Apply'
            ),
          ]
        : [];
    const spec = h(
      'div',
      { class: 'flex min-h-7 items-center gap-2 px-2 py-1 text-[11px] text-ocm-text-muted' },
      [...left, h('span', { class: `ml-auto shrink-0 ${syncClass}` }, sync), ...actions]
    );
    if (statusHandle) {
      statusHandle.update(spec);
    } else {
      statusHandle = mount(slot, spec);
    }
  };

  const paintGrid = (): void => {
    const slot = shellHandle?.refs.grid;
    if (!(slot instanceof HTMLElement) || mode !== 'grid') {
      return;
    }
    if (!gridHandle) {
      gridHandle = mount(
        slot,
        tableGridView(store, {
          onContextMenu: (ev) => {
            editor.ui.menu.open(
              buildGridContextMenu(editor, store, {
                onImport: () => {
                  handle.openImport();
                },
                onRefresh: () => {
                  handle.refreshSource();
                },
                onEditSource: () => {
                  handle.editSource();
                },
              }),
              ev.clientX,
              ev.clientY
            );
          },
        })
      );
      chromeSig = '';
    }
    const sig = chromeSignature(store);
    if (sig !== chromeSig) {
      chromeSig = sig;
      paintGridChrome(gridHandle, store);
    }
  };

  const destroyRaw = (): void => {
    rawHandle?.destroy();
    rawHandle = null;
  };

  const mountRaw = (): void => {
    const slot = shellHandle?.refs.raw;
    if (!(slot instanceof HTMLElement)) {
      return;
    }
    destroyRaw();
    rawHandle = mountSourceEditor(slot, {
      initialText: serializeText(editor.getState().doc),
      onDocChanged: () => {
        rawDirty = true;
        parseError = null;
        paintStatus();
        editor.toolbar.refresh();
      },
    });
  };

  const applyDraft = (): boolean => {
    if (mode !== 'raw' || !rawHandle) {
      return false;
    }
    const result = parseText(rawHandle.getText());
    if (!result.ok) {
      parseError = result.error.message;
      paintStatus();
      editor.notify(result.error.message);
      return false;
    }
    // Prefer set_attrs (undoable) over replaceDocument, which clears history.
    const grid = gridFromDoc(result.doc);
    writing = true;
    const ok = editor.run(() => [
      {
        type: 'set_attrs',
        path: [0],
        attrs: attrsFromGrid(grid),
      },
    ]);
    writing = false;
    if (!ok) {
      replaceDoc(editor, result.doc);
    }
    rawDirty = false;
    parseError = null;
    store.setDoc(grid);
    paintStatus();
    editor.toolbar.refresh();
    return true;
  };

  const discardDraft = (): void => {
    rawDirty = false;
    parseError = null;
    store.setDoc(gridFromDoc(editor.getState().doc));
    if (rawHandle) {
      rawHandle.setText(serializeText(editor.getState().doc), { caret: 'end' });
    }
    paintStatus();
    editor.toolbar.refresh();
  };

  const syncModeDom = (): void => {
    const gridSlot = shellHandle?.refs.grid;
    const rawSlot = shellHandle?.refs.raw;
    if (gridSlot instanceof HTMLElement) {
      gridSlot.hidden = mode !== 'grid';
    }
    if (rawSlot instanceof HTMLElement) {
      rawSlot.hidden = mode !== 'raw';
    }
    if (mode === 'raw') {
      if (!rawHandle) {
        mountRaw();
      } else if (!rawDirty) {
        rawHandle.setText(serializeText(editor.getState().doc), { caret: 'preserve' });
      }
    } else {
      destroyRaw();
      paintGrid();
    }
    paintStatus();
    editor.toolbar.refresh();
  };

  const blockIfRawDirty = (): boolean => {
    if (!rawDirty) {
      return false;
    }
    editor.notify('Apply or Discard raw draft first');
    return true;
  };

  shellHandle = mount(
    contentHost,
    h('div', { class: 'ocm-table-shell flex h-full min-h-0 flex-1 flex-col overflow-hidden' }, [
      h('div', {
        ref: 'grid',
        class: 'ocm-table-grid-host flex min-h-0 flex-1 flex-col overflow-hidden',
      }),
      h('div', {
        ref: 'raw',
        class: 'ocm-table-source-host flex min-h-0 flex-1 flex-col overflow-hidden',
        attrs: { hidden: true },
      }),
      h('div', {
        ref: 'status',
        class: 'ocm-table-status',
      }),
    ])
  );

  const unsub = store.subscribe(() => {
    if (mode === 'grid') {
      paintGrid();
    }
    paintStatus();
  });

  paintGrid();
  paintStatus();

  const handle: TableWorkspaceHandle = {
    update(state) {
      if (writing || rawDirty) {
        return;
      }
      const next = gridFromDoc(state.doc);
      if (isEditingInside(contentHost) || store.isEditing()) {
        if (gridSig(store.getDoc()) !== gridSig(next)) {
          store.setEditing(false);
          store.setDoc(next);
          editBaseSig = null;
          const ae = document.activeElement;
          if (ae instanceof HTMLElement && contentHost.contains(ae)) {
            ae.blur();
          }
        }
        paintStatus();
        return;
      }
      store.setDoc(next);
      tryAutoload();
      paintStatus();
    },
    destroy() {
      editor.undo = origUndo;
      editor.redo = origRedo;
      unsubEditing();
      unsub();
      store.destroy();
      statusHandle?.destroy();
      statusHandle = null;
      gridHandle?.destroy();
      gridHandle = null;
      destroyRaw();
      shellHandle?.destroy();
      shellHandle = null;
      contentHost.replaceChildren();
      contentHost.classList.remove('ocm-table-root');
    },
    getMode: () => mode,
    setMode(next) {
      if (next === mode) {
        return;
      }
      if (next === 'grid' && rawDirty) {
        editor.notify('Apply or Discard raw draft first');
        return;
      }
      if (next === 'raw' && store.hasPendingCommit()) {
        store.flushCommit();
      }
      mode = next;
      syncModeDom();
    },
    addRow() {
      if (blockIfRawDirty()) {
        return;
      }
      store.addRow();
    },
    addColumn() {
      if (blockIfRawDirty()) {
        return;
      }
      store.addColumn();
    },
    mergeHorizontal() {
      if (blockIfRawDirty()) {
        return;
      }
      store.mergeHorizontal();
    },
    mergeVertical() {
      if (blockIfRawDirty()) {
        return;
      }
      store.mergeVertical();
    },
    splitCell() {
      if (blockIfRawDirty()) {
        return;
      }
      store.splitActive();
    },
    openImport() {
      if (blockIfRawDirty()) {
        return;
      }
      const src = store.getDoc().source;
      openMatrixImportPopup(editor, {
        mode: 'workspace',
        initial: src
          ? {
              url: src.url,
              format: src.format,
              headers: src.headers,
              delimiter: src.delimiter,
            }
          : undefined,
        onMatrix: (matrix, hasHeader, config) => {
          const grid = gridFromMatrix(matrix, hasHeader);
          grid.source = sourceFromConfig(config);
          store.setDoc(grid, { commit: true });
          loadedSourceUrl = config.url;
        },
      });
    },
    refreshSource() {
      if (blockIfRawDirty()) {
        return;
      }
      const src = store.getDoc().source;
      if (!src?.url) {
        editor.notify(editor.t('common.dataUrlIsRequired') || 'Set a data URL first');
        return;
      }
      void applyRemote({
        url: src.url,
        format: src.format,
        headers: src.headers,
        delimiter: src.delimiter,
      });
    },
    editSource() {
      if (blockIfRawDirty()) {
        return;
      }
      const src = store.getDoc().source;
      openMatrixImportPopup(editor, {
        mode: 'edit',
        initial: src
          ? {
              url: src.url,
              format: src.format,
              headers: src.headers,
              delimiter: src.delimiter,
            }
          : undefined,
        onMatrix: (matrix, hasHeader, config) => {
          const grid = gridFromMatrix(matrix, hasHeader);
          grid.source = sourceFromConfig(config);
          store.setDoc(grid, { commit: true });
          loadedSourceUrl = config.url;
        },
      });
    },
    formatCell() {
      if (blockIfRawDirty()) {
        return;
      }
      openFormatCell(editor, store);
    },
    exportCsv() {
      downloadBlob(toCsv(store.getDoc()), 'table.csv', 'text/csv;charset=utf-8');
    },
    applyRaw: applyDraft,
    discardRaw: discardDraft,
    isRawDirty: () => rawDirty,
    getStore: () => store,
  };

  tryAutoload();
  return handle;
}
