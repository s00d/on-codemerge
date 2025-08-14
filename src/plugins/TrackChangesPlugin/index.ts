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
  private toolbarButton: HTMLElement | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.addToolbarButton();
    const container = editor.getContainer();
    container.addEventListener('input', this.handleInput);
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (!toolbar) return;

    // Проверяем, не добавлена ли уже кнопка
    if (toolbar.querySelector('[data-track-changes-button]')) {
      return;
    }

    this.toolbarButton = createToolbarButton({
      icon: trackChangesIcon,
      title: this.editor?.t('Track Changes'),
      onClick: () => this.toggle(),
    });

    // Добавляем атрибут для идентификации
    this.toolbarButton.setAttribute('data-track-changes-button', 'true');

    toolbar.appendChild(this.toolbarButton);
  }

  private toggle(): void {
    this.enabled = !this.enabled;

    // Показываем уведомление внутри редактора вместо глобального
    if (this.editor) {
      const message = this.enabled
        ? this.editor.t('Track changes enabled')
        : this.editor.t('Track changes disabled');

      // Создаем временное уведомление внутри редактора
      this.showInlineNotification(message);
    }
  }

  private showInlineNotification(message: string): void {
    if (!this.editor) return;

    const domContext = this.editor.getDOMContext();
    if (!domContext) return;

    // Удаляем предыдущие уведомления, если они есть
    const existingNotifications = domContext.querySelectorAll('.track-changes-notification');
    existingNotifications.forEach((notification) => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });

    const notification = document.createElement('div');
    notification.className = 'track-changes-notification';
    notification.id = `track-changes-notification-${Date.now()}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #3b82f6;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    domContext.appendChild(notification);

    // Автоматически удаляем через 3 секунды
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  private handleInput = (e: Event): void => {
    if (!this.enabled) return;
    const target = e.target as HTMLElement;
    if (!target) return;
    // Простейшая подсветка вставок: оборачиваем новые текстовые узлы
    // В полноценном варианте нужно сравнение с предыдущей версией, но каркас — достаточно
    // Для демо: если вставлен текстовый узел, выделим родителя
    const selection = this.editor?.getTextFormatter()?.getSelection();
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

    const container = this.editor.getContainer();
    // Удаляем все обработчики событий
    container.removeEventListener('input', this.handleInput);

    // Удаляем кнопку из тулбара
    if (this.toolbarButton) {
      this.toolbarButton.remove();
      this.toolbarButton = null;
    }

    // Отписываемся от всех событий
    this.editor.off('track-changes');
    this.editor.off('track-changes-enabled');
    this.editor.off('track-changes-disabled');

    // Очищаем все ссылки
    this.editor = null;
    this.enabled = false;
  }
}
