import { foreign, h, mount } from '@codemerge/sdk';
import type { EditorAPI, MountHandle, ViewSpec } from '@codemerge/sdk';
import type { Command, DocNode, EditorState, JSONDoc } from '@codemerge/kernel';
import { collapsedAt, getNodeAt } from '@codemerge/kernel';

import { indentFromDoc } from '../io/adapters';
import { serializeDoc } from '../io/text';
import { parseText } from '../io/text';
import {
  deleteNode,
  deleteNodeCommand,
  duplicateNode,
  duplicateNodeCommand,
  insertItem,
  insertProperty,
  pathToDot,
  renameKey,
  setValue,
} from '../commands/jsonCommands';
import { JsonNodeMenu } from '../components/JsonNodeMenu';
import { mountRawEditor } from '../widgets/rawEditor';
import type { RawEditorHandle } from '../widgets/rawEditor';
import { treeRootView } from './tree/branches';
import { pathKey } from './tree/types';
import type { TreeHandlers } from './tree/types';

export type JsonWorkspaceHost = EditorAPI & {
  replaceDocument?(doc: DocNode | JSONDoc): void;
};

export type JsonWorkspaceOptions = {
  rawPane?: boolean;
  /** Fired after Tree/Raw mode changes (toolbar can refresh active state). */
  onModeChange?: () => void;
  /** Shared collapse set so CE embed remounts keep open/closed rows. */
  collapsedPaths?: Set<string>;
  /** Initial Tree/Raw mode (default tree). */
  initialMode?: 'tree' | 'raw';
};

export type JsonWorkspaceHandle = {
  update(state: EditorState): void;
  destroy(): void;
  getMode(): 'tree' | 'raw';
  setMode(next: 'tree' | 'raw'): void;
  applyRaw(): boolean;
  discardRaw(): void;
  isRawDirty(): boolean;
};

function isEditingInside(host: HTMLElement): boolean {
  const ae = document.activeElement;
  if (!(ae instanceof HTMLElement) || !host.contains(ae)) {
    return false;
  }
  const tag = ae.tagName;
  if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || ae.isContentEditable) {
    return true;
  }
  return Boolean(ae.closest('.ocm-source-editor'));
}

function replaceDoc(editor: JsonWorkspaceHost, doc: DocNode | JSONDoc): void {
  if (typeof editor.replaceDocument === 'function') {
    editor.replaceDocument(doc);
    return;
  }
  editor.setJSON(doc);
}

export function mountJsonWorkspace(
  editor: JsonWorkspaceHost,
  contentHost: HTMLElement,
  options: JsonWorkspaceOptions = {}
): JsonWorkspaceHandle {
  const rawPane = options.rawPane !== false;
  contentHost.classList.add('ocm-json-root');

  let rawDirty = false;
  let lastSoTText = serializeDoc(editor.getState().doc);
  let parseError: string | null = null;
  let pendingState: EditorState | null = null;
  /** Tree and Raw share one panel; Raw replaces Tree when active. */
  let mode: 'tree' | 'raw' = options.initialMode === 'raw' && rawPane ? 'raw' : 'tree';
  const collapsedPaths = options.collapsedPaths ?? new Set<string>();
  const nodeMenu = new JsonNodeMenu(editor);

  let shellHandle: MountHandle | null = null;
  let treeHandle: MountHandle | null = null;
  let statusHandle: MountHandle | null = null;
  let rawHandle: RawEditorHandle | null = null;

  const runGuarded = (fn: () => void): void => {
    if (rawDirty) {
      editor.notify('Apply or Discard raw draft first');
      return;
    }
    fn();
  };

  // Fail-closed SoT writes while Raw draft is dirty (menu/toolbar/hotkeys bypass tree runGuarded).
  const origRun = editor.run.bind(editor);
  const origCommand = editor.command.bind(editor);
  const origUndo = editor.undo.bind(editor);
  const origRedo = editor.redo.bind(editor);
  const blockDirtyWrite = (): boolean => {
    if (!rawDirty) {
      return false;
    }
    editor.notify('Apply or Discard raw draft first');
    return true;
  };
  editor.run = (cmd: Command) => (blockDirtyWrite() ? false : origRun(cmd));
  editor.command = (name: string) => (blockDirtyWrite() ? false : origCommand(name));
  editor.undo = () => (blockDirtyWrite() ? false : origUndo());
  editor.redo = () => (blockDirtyWrite() ? false : origRedo());

  const updateStatus = (state: EditorState = editor.getState()): void => {
    contentHost.toggleAttribute('data-ocm-json-raw-dirty', rawDirty);
    const slot = shellHandle?.refs.status;
    if (!(slot instanceof HTMLElement)) {
      return;
    }
    const pathLabel = pathToDot(state.doc, state.selection.anchor.path);
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
                  'rounded-ocm-sm bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900',
                attrs: { type: 'button' },
                on: {
                  click: (ev) => {
                    ev.preventDefault();
                    if (rawHandle) {
                      applyParsedText(rawHandle.getText());
                    }
                  },
                },
              },
              'Apply'
            ),
          ]
        : [];
    const spec = h(
      'div',
      {
        class:
          'flex items-center gap-2 border-t border-ocm-border px-2 py-1 text-[11px] text-ocm-text-muted',
      },
      [
        h(
          'span',
          { class: 'min-w-0 flex-1 truncate font-mono text-ocm-text', attrs: { title: pathLabel } },
          pathLabel
        ),
        h('span', { class: `shrink-0 ${syncClass}` }, sync),
        ...actions,
      ]
    );
    if (!statusHandle) {
      statusHandle = mount(slot, spec);
    } else {
      statusHandle.update(spec);
    }
  };

  const applyParsedText = (text: string): boolean => {
    const result = parseText(text, indentFromDoc(editor.getState().doc));
    if (!result.ok) {
      parseError = result.error.message;
      updateStatus();
      return false;
    }
    parseError = null;
    rawDirty = false;
    replaceDoc(editor, result.doc);
    lastSoTText = serializeDoc(editor.getState().doc);
    rawHandle?.setText(lastSoTText);
    updateStatus();
    requestPaint(editor.getState(), { force: true });
    return true;
  };

  const discardDraft = (): void => {
    rawDirty = false;
    parseError = null;
    const text = serializeDoc(editor.getState().doc);
    lastSoTText = text;
    rawHandle?.setText(text);
    updateStatus();
    requestPaint(editor.getState(), { force: true });
  };

  const makeHandlers = (state: EditorState): TreeHandlers => ({
    selected: state.selection.anchor.path,
    collapsed: collapsedPaths,
    runGuarded,
    select(path) {
      editor.setSelection(collapsedAt(path, 0));
    },
    setValue(path, value) {
      editor.run(setValue(path, value));
    },
    rename(path, key) {
      let current: unknown;
      try {
        current = getNodeAt(editor.getState().doc, path).attrs?.key;
      } catch {
        return;
      }
      if (current === key) {
        return;
      }
      if (!editor.run(renameKey(path, key))) {
        editor.notify('Duplicate key');
        requestPaint(editor.getState(), { force: true });
      }
    },
    insertProperty(objectPath) {
      const obj = getNodeAt(editor.getState().doc, objectPath);
      const existing = new Set(
        (obj.content ?? [])
          .map((p) => p.attrs?.key)
          .filter((k): k is string => typeof k === 'string')
      );
      let key = 'property';
      let n = 1;
      while (existing.has(key)) {
        n += 1;
        key = `property${n}`;
      }
      editor.run(insertProperty(objectPath, key, null));
    },
    insertItem(arrayPath) {
      editor.run(insertItem(arrayPath, null));
    },
    deleteAt(path) {
      editor.run(deleteNode(path));
    },
    duplicateAt(path) {
      editor.run(duplicateNode(path));
    },
    toggleCollapse(path, alt) {
      const key = pathKey(path);
      const willCollapse = !collapsedPaths.has(key);
      const walk = (p: number[]) => {
        const k = pathKey(p);
        if (willCollapse) {
          collapsedPaths.add(k);
        } else {
          collapsedPaths.delete(k);
        }
        if (!alt) {
          return;
        }
        try {
          const n = getNodeAt(editor.getState().doc, p);
          if (n.type === 'jsonObject' || n.type === 'jsonArray') {
            (n.content ?? []).forEach((_, i) => {
              walk([...p, i]);
            });
          }
        } catch {
          /* ignore */
        }
      };
      walk(path);
      requestPaint(editor.getState(), { force: true });
    },
    openMenu(target, x, y) {
      nodeMenu.open(target, x, y);
    },
  });

  const flushIfIdle = (): void => {
    if (editor.ui.menu.isOpen) {
      return;
    }
    if (pendingState && !isEditingInside(contentHost)) {
      const next = pendingState;
      pendingState = null;
      paintTree(next);
    }
  };

  function requestPaint(state: EditorState, opts: { force?: boolean } = {}): void {
    if (!opts.force && (editor.ui.menu.isOpen || isEditingInside(contentHost))) {
      pendingState = state;
      return;
    }
    pendingState = null;
    paintTree(state);
  }

  function paintTree(state: EditorState): void {
    const treeSlot = shellHandle?.refs.tree;
    if (!(treeSlot instanceof HTMLElement)) {
      return;
    }
    const handlers = makeHandlers(state);
    let tree: ViewSpec;
    try {
      tree = treeRootView(state, handlers);
    } catch {
      tree = h('div', { class: 'px-3 py-4 text-sm text-red-600' }, 'Invalid JSON document');
    }
    if (!treeHandle) {
      treeHandle = mount(treeSlot, tree);
    } else {
      treeHandle.update(tree);
    }
    updateStatus(state);
  }

  const applyModeUi = (): void => {
    contentHost.setAttribute('data-ocm-json-mode', mode);
    const treeEl = shellHandle?.refs.tree;
    const rawEl = shellHandle?.refs.raw;
    if (treeEl instanceof HTMLElement) {
      treeEl.hidden = mode !== 'tree';
    }
    if (rawEl instanceof HTMLElement) {
      rawEl.hidden = mode !== 'raw';
    }
    updateStatus();
    options.onModeChange?.();
  };

  const setMode = (next: 'tree' | 'raw'): void => {
    if (!rawPane && next === 'raw') {
      return;
    }
    if (next === mode) {
      return;
    }
    if (next === 'tree' && rawDirty) {
      editor.notify('Apply or Discard raw draft first');
      return;
    }
    mode = next;
    if (mode === 'raw' && !rawDirty) {
      const text = serializeDoc(editor.getState().doc);
      lastSoTText = text;
      rawHandle?.setText(text);
    }
    applyModeUi();
    if (mode === 'raw') {
      rawHandle?.focus();
    } else {
      requestPaint(editor.getState(), { force: true });
    }
  };

  // Fill shell content edge-to-edge — mode toggle lives in the editor toolbar, not here.
  const shellSpec: ViewSpec = h(
    'div',
    { class: 'ocm-json-shell flex h-full min-h-0 flex-1 flex-col' },
    [
      h('div', {
        class: 'ocm-json-tree min-h-0 flex-1 overflow-auto',
        ref: 'tree',
        attrs: { 'aria-label': 'JSON tree' },
      }),
      rawPane
        ? h(
            'div',
            {
              ref: 'raw',
              class: 'ocm-json-raw-slot flex min-h-0 flex-1 flex-col',
              attrs: { 'aria-label': 'Raw JSON', hidden: 'true' },
            },
            [
              foreign(
                (host, scope) => {
                  host.classList.add(
                    'ocm-json-source-host',
                    'flex',
                    'flex-col',
                    'h-full',
                    'min-h-0',
                    'flex-1',
                    'overflow-hidden'
                  );
                  rawHandle = mountRawEditor(host, {
                    initialText: lastSoTText,
                    onDirty: () => {
                      const nextDirty = (rawHandle?.getText() ?? '') !== lastSoTText;
                      if (nextDirty === rawDirty) {
                        return;
                      }
                      rawDirty = nextDirty;
                      updateStatus();
                      options.onModeChange?.();
                    },
                    onApplyRequest: () => {
                      if (rawHandle) {
                        applyParsedText(rawHandle.getText());
                      }
                    },
                  });
                  scope.own({
                    destroy: () => {
                      rawHandle?.destroy();
                      rawHandle = null;
                    },
                  });
                },
                { class: 'ocm-json-source-foreign flex h-full min-h-0 flex-1 flex-col' }
              ),
            ]
          )
        : null,
      h('div', { ref: 'status' }),
    ]
  );

  shellHandle = mount(contentHost, shellSpec);
  applyModeUi();
  paintTree(editor.getState());
  updateStatus();

  const onFocusOut = (ev: FocusEvent): void => {
    const next = ev.relatedTarget;
    if (next instanceof Node && contentHost.contains(next)) {
      return;
    }
    queueMicrotask(flushIfIdle);
  };
  contentHost.addEventListener('focusout', onFocusOut);

  let menuWasOpen = false;
  const menuPoll = window.setInterval(() => {
    const open = editor.ui.menu.isOpen;
    if (menuWasOpen && !open) {
      flushIfIdle();
    }
    menuWasOpen = open;
  }, 120);

  const off = editor.on('docChanged', () => {
    const next = serializeDoc(editor.getState().doc);
    if (next === lastSoTText) {
      return;
    }
    lastSoTText = next;
    if (rawDirty) {
      updateStatus();
      contentHost.setAttribute('data-ocm-json-raw-dirty', '1');
      return;
    }
    contentHost.removeAttribute('data-ocm-json-raw-dirty');
    rawHandle?.setText(next);
  });

  const onKeyDown = (ev: KeyboardEvent): void => {
    if (isEditingInside(contentHost) || editor.ui.menu.isOpen) {
      return;
    }
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      runGuarded(() => {
        if (editor.run(deleteNodeCommand())) {
          ev.preventDefault();
        }
      });
    }
    if ((ev.key === 'd' || ev.key === 'D') && (ev.metaKey || ev.ctrlKey)) {
      runGuarded(() => {
        if (editor.run(duplicateNodeCommand())) {
          ev.preventDefault();
        }
      });
    }
  };
  contentHost.addEventListener('keydown', onKeyDown);

  return {
    update(state) {
      requestPaint(state);
    },
    getMode() {
      return mode;
    },
    setMode,
    applyRaw() {
      if (!rawHandle) {
        return false;
      }
      return applyParsedText(rawHandle.getText());
    },
    discardRaw() {
      discardDraft();
    },
    isRawDirty() {
      return rawDirty;
    },
    destroy() {
      off();
      window.clearInterval(menuPoll);
      contentHost.removeEventListener('focusout', onFocusOut);
      contentHost.removeEventListener('keydown', onKeyDown);
      editor.run = origRun;
      editor.command = origCommand;
      editor.undo = origUndo;
      editor.redo = origRedo;
      nodeMenu.destroy();
      statusHandle?.destroy();
      treeHandle?.destroy();
      shellHandle?.destroy();
      statusHandle = null;
      treeHandle = null;
      shellHandle = null;
      rawHandle = null;
      contentHost.classList.remove('ocm-json-root');
    },
  };
}
