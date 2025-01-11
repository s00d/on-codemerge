import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { HistoryManager } from './services/HistoryManager';
import { HistoryViewerModal } from './components/HistoryViewerModal';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { historyIcon, undoIcon, redoIcon } from '../../icons';

type Unsubscribe = () => void;

export class HistoryPlugin implements Plugin {
  name = 'history';
  private editor: HTMLEditor | null = null;
  private historyManager: HistoryManager;
  private historyViewer: HistoryViewerModal | null = null;
  private observer: MutationObserver | null = null;
  private undoButton: HTMLElement | null = null;
  private redoButton: HTMLElement | null = null;
  private historyButton: HTMLElement | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private isRestoringState: boolean = false; // Флаг для игнорирования изменений

  constructor() {
    this.historyManager = new HistoryManager();
  }

  initialize(editor: HTMLEditor): void {
    this.historyViewer = new HistoryViewerModal(editor);
    this.editor = editor;
    this.addToolbarButtons();

    this.unsubscribe = this.editor.subscribeToContentChange(this.contentEvent.bind(this));

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

  private contentEvent(newContent: string) {
    if (this.isRestoringState) return; // Игнорируем изменения, если восстанавливаем состояние
    console.log(1111, this.isRestoringState);
    this.historyManager.addState(newContent);
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

  private async undo(): Promise<void> {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    const cursorPosition = this.editor.saveCursorPosition();

    const previousState = this.historyManager.undo();
    if (previousState !== null) {
      this.isRestoringState = true; // Включаем флаг

      container.innerHTML = previousState;

      if (cursorPosition) {
        this.editor.restoreCursorPosition(cursorPosition);
      }

      // Откладываем сброс флага до следующего цикла событий
      await Promise.resolve();
      this.isRestoringState = false; // Выключаем флаг
    }
  }

  private async redo(): Promise<void> {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    const cursorPosition = this.editor.saveCursorPosition();

    const nextState = this.historyManager.redo();
    if (nextState) {
      this.isRestoringState = true; // Включаем флаг

      container.innerHTML = nextState;

      if (cursorPosition) {
        this.editor.restoreCursorPosition(cursorPosition);
      }

      // Откладываем сброс флага до следующего цикла событий
      await Promise.resolve();
      this.isRestoringState = false; // Выключаем флаг
    }
  }

  private showHistory(): void {
    if (!this.editor) return;

    this.historyViewer?.show(
      this.historyManager.getStates(),
      this.historyManager.getCurrentIndex(),
      async (content: string) => {
        if (this.editor) {
          this.isRestoringState = true; // Включаем флаг
          this.editor.getContainer().innerHTML = content;
          await Promise.resolve();
          this.isRestoringState = false; // Выключаем флаг
        }
      }
    );
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

    if (this.unsubscribe) this.unsubscribe();

    this.editor?.off('history');
    this.editor?.off('undo');
    this.editor?.off('redo');

    this.editor = null;
    this.historyManager.clear();
  }
}
