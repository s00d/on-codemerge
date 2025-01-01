import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { HistoryManager } from './services/HistoryManager';
import { HistoryViewerModal } from './components/HistoryViewerModal';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { historyIcon, undoIcon, redoIcon } from '../../icons';

export class HistoryPlugin implements Plugin {
  name = 'history';
  private editor: HTMLEditor | null = null;
  private historyManager: HistoryManager;
  private historyViewer: HistoryViewerModal | null = null;
  private observer: MutationObserver | null = null;
  private undoButton: HTMLElement | null = null;
  private redoButton: HTMLElement | null = null;
  private historyButton: HTMLElement | null = null;

  constructor() {
    this.historyManager = new HistoryManager();
  }

  initialize(editor: HTMLEditor): void {
    this.historyViewer = new HistoryViewerModal(editor);
    this.editor = editor;
    this.addToolbarButtons();
    this.startObserving();

    this.editor.on('history', () => {
      this.showHistory();
    });
    this.editor.on('undo', () => {
      this.undo();
    });
    this.editor.on('redo', () => {
      this.redo();
    });
  }

  private addToolbarButtons(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar || !this.editor) return;

    this.undoButton = createToolbarButton({
      icon: undoIcon,
      title: this.editor.t('Undo') ?? '',
      onClick: () => this.undo(),
    });

    this.redoButton = createToolbarButton({
      icon: redoIcon,
      title: this.editor.t('Redo') ?? '',
      onClick: () => this.redo(),
    });

    this.historyButton = createToolbarButton({
      icon: historyIcon,
      title: this.editor.t('View History') ?? '',
      onClick: () => this.showHistory(),
    });

    toolbar.appendChild(this.undoButton);
    toolbar.appendChild(this.redoButton);
    toolbar.appendChild(this.historyButton);
  }

  private undo(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    const cursorPosition = this.editor.saveCursorPosition();

    const previousState = this.historyManager.undo();
    if (previousState !== null) {
      container.innerHTML = previousState;

      if (cursorPosition) {
        this.editor.restoreCursorPosition(cursorPosition);
      }
    }
  }

  private redo(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    const cursorPosition = this.editor.saveCursorPosition();

    const nextState = this.historyManager.redo();
    if (nextState) {
      container.innerHTML = nextState;

      if (cursorPosition) {
        this.editor.restoreCursorPosition(cursorPosition);
      }
    }
  }

  private showHistory(): void {
    if (!this.editor) return;

    this.historyViewer?.show(
      this.historyManager.getStates(),
      this.historyManager.getCurrentIndex(),
      (content: string) => {
        if (this.editor) {
          this.editor.getContainer().innerHTML = content;
        }
      }
    );
  }

  private startObserving(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    if (!container) return;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        this.historyManager.addState(container.innerHTML);
      });
    });

    // Observer configuration: Listen for child changes (insertions, deletions, or text changes)
    const config = { childList: true, subtree: true, characterData: true };
    this.observer.observe(container, config);
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.undoButton && this.undoButton.parentElement) {
      this.undoButton.parentElement.removeChild(this.undoButton);
    }
    if (this.redoButton && this.redoButton.parentElement) {
      this.redoButton.parentElement.removeChild(this.redoButton);
    }
    if (this.historyButton && this.historyButton.parentElement) {
      this.historyButton.parentElement.removeChild(this.historyButton);
    }

    if (this.historyViewer) {
      this.historyViewer.destroy();
      this.historyViewer = null;
    }

    this.editor?.off('history');
    this.editor?.off('undo');
    this.editor?.off('redo');

    this.editor = null;
    this.historyManager.clear();
  }
}
