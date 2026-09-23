import './style.scss';

import { definePlugin } from '@on-codemerge/sdk';
import { HistoryManager } from './services/HistoryManager';
import { HistoryViewerModal } from './components/HistoryViewerModal';
import { historyIcon, undoIcon, redoIcon } from '../../icons';

export function HistoryPlugin() {
  const historyManager = new HistoryManager();
  let openHistory: (() => void) | null = null;

  return definePlugin({
    name: 'history',
    hotkeys: [
      { keys: 'Mod-z', command: 'undo', description: 'Undo' },
      { keys: 'Mod-y', command: 'redo', description: 'Redo' },
      { keys: 'Mod-Shift-z', command: 'redo', description: 'Redo' },
      { keys: 'Mod-Alt-h', command: 'viewHistory', description: 'View history' },
    ],
    commands: {
      undo: () => null,
      redo: () => null,
      viewHistory: () => {
        openHistory?.();
        return null;
      },
    },
    setup(ctx) {
      const editor = ctx.editor;
      const viewer = new HistoryViewerModal(editor, ctx.scope);
      historyManager.addState(editor.getMarkdown());

      openHistory = () => {
        viewer.show(historyManager.getStates(), historyManager.getCurrentIndex(), (md) => {
          editor.setMarkdown(md);
        });
      };

      ctx.on('docChanged', () => {
        historyManager.addState(editor.getMarkdown());
      });

      ctx.toolbar.add({
        id: 'undo',
        icon: undoIcon,
        title: editor.t('history.undo'),
        group: 'history',
        order: 1,
        onClick: () => {
          editor.undo();
        },
      });
      ctx.toolbar.add({
        id: 'redo',
        icon: redoIcon,
        title: editor.t('history.redo'),
        group: 'history',
        order: 2,
        onClick: () => {
          editor.redo();
        },
      });
      ctx.toolbar.add({
        id: 'history',
        icon: historyIcon,
        title: editor.t('history.history'),
        group: 'history',
        order: 3,
        onClick: () => {
          openHistory?.();
        },
      });
    },
  });
}
