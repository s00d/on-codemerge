import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { trackChangesIcon } from '../../icons';

export class TrackChangesPlugin implements Plugin {
  name = 'track-changes';
  private editor: HTMLEditor | null = null;
  private enabled = false;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.addToolbarButton();
    const container = editor.getContainer();
    container.addEventListener('input', this.handleInput);
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (!toolbar) return;
    const button = createToolbarButton({
      icon: trackChangesIcon,
      title: this.editor?.t('Track Changes'),
      onClick: () => this.toggle(),
    });
    toolbar.appendChild(button);
  }

  private toggle(): void {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.editor?.showInfoNotification(this.editor.t('Track changes enabled'));
    } else {
      this.editor?.showInfoNotification(this.editor.t('Track changes disabled'));
    }
  }

  private handleInput = (e: Event): void => {
    if (!this.enabled) return;
    const target = e.target as HTMLElement;
    if (!target) return;
    // Простейшая подсветка вставок: оборачиваем новые текстовые узлы
    // В полноценном варианте нужно сравнение с предыдущей версией, но каркас — достаточно
    // Для демо: если вставлен текстовый узел, выделим родителя
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const el = (range.startContainer as HTMLElement).parentElement;
      if (el && this.editor?.getContainer().contains(el)) {
        el.classList.add('tracked-insert');
        setTimeout(() => el.classList.remove('tracked-insert'), 1000);
      }
    }
  };

  destroy(): void {
    if (!this.editor) return;
    this.editor.getContainer().removeEventListener('input', this.handleInput);
    this.editor = null;
  }
}


