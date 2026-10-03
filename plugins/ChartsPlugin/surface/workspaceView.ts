import type { EditorState } from '@codemerge/kernel';
import type { DisposableScope, EditorAPI } from '@codemerge/sdk';
import { ChartMenu } from '../components/ChartMenu';
import type { ChartAttrs } from '../io/adapters';
import { attrsFromDoc, emptyChartAttrs } from '../io/adapters';

export type ChartWorkspaceHandle = {
  destroy: () => void;
  update: (state: EditorState) => void;
  getAttrs: () => ChartAttrs;
  setAttrs: (attrs: ChartAttrs) => void;
  exportPng: () => void;
};

export type MountChartWorkspaceOptions = {
  mode: 'workspace' | 'atom';
  initial?: ChartAttrs;
  scope: DisposableScope;
  onChange?: (attrs: ChartAttrs) => void;
};

/**
 * Chart studio: type strip + options | live preview + data table.
 * Reuses ChartMenu body UI.
 */
export function mountChartWorkspace(
  editor: EditorAPI,
  host: HTMLElement,
  opts: MountChartWorkspaceOptions
): ChartWorkspaceHandle {
  const menu = new ChartMenu(editor, opts.scope);
  let suppress = false;

  const initial =
    opts.initial ??
    (opts.mode === 'workspace' ? attrsFromDoc(editor.getState().doc) : emptyChartAttrs());
  menu.applyChartAttrs(initial);

  // Atom lg popup also uses the 2-col studio (same mountChartWorkspace UI).
  const studio = menu.mountStudio(host, {
    layout: 'workspace',
    onChange: () => {
      if (suppress) {
        return;
      }
      opts.onChange?.(menu.getChartAttrs());
    },
  });

  // Apply pending data after mount (editorHost ready)
  menu.applyChartAttrs(initial);

  return {
    destroy: () => {
      studio.destroy();
    },
    update: (state) => {
      if (suppress || opts.mode !== 'workspace') {
        return;
      }
      const next = attrsFromDoc(state.doc);
      const cur = menu.getChartAttrs();
      if (JSON.stringify(next) === JSON.stringify(cur)) {
        return;
      }
      suppress = true;
      menu.applyChartAttrs(next);
      suppress = false;
    },
    getAttrs: () => menu.getChartAttrs(),
    setAttrs: (attrs) => {
      suppress = true;
      menu.applyChartAttrs(attrs);
      suppress = false;
      opts.onChange?.(attrs);
    },
    exportPng: () => {
      menu.exportPng();
    },
  };
}
